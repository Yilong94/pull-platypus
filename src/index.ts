import dotenv from "dotenv";
import BitbucketHelper from "./helpers/BitbucketHelper";
import SlackHelper from "./helpers/SlackHelper";
import { PullRequestData } from "./interfaces/PullRequest";

dotenv.config();

// Configuration
const authOptions = {
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  projectName: process.env.PROJECT_NAME,
  repoName: process.env.REPO_NAME,
};

const serverOptions = {
  baseUrl: process.env.SERVER_BASE_URL,
  headers: {},
  options: {
    timeout: 5000,
  },
};

const interval = +process.env.API_CALL_INTERVAL;
const webhookUrl = process.env.WEBHOOK_URL;
const bitbucketToSlackMap = JSON.parse(process.env.BITBUCKET_TO_SLACK_MAP);

// Initialize bitbucker helper
const bitbucketHelper = new BitbucketHelper({ authOptions, serverOptions });
const slackHelper = new SlackHelper(webhookUrl, bitbucketToSlackMap);

// Main
const main = async function (): Promise<void> {
  try {
    const allPrMeta = await bitbucketHelper.getAllPrMeta();
    const allPrActivities = await Promise.all(
      allPrMeta.map(async ({ prId, reviewerIds }) => {
        const prActivities = await bitbucketHelper.getPrActivities(
          prId,
          reviewerIds
        );
        return prActivities;
      })
    );

    const now = new Date().getTime();
    // Filter to most recent PR activities
    const filteredPrActivities = allPrActivities.map((prActivities) => {
      // If interval is -1, return all activities
      if (interval === -1) {
        return prActivities;
      } else {
        return prActivities.filter(
          ({ createdDate }) => now - createdDate <= interval
        );
      }
    });

    // Link meta and activity data together
    const updatedPrData = allPrMeta.reduce(
      (acc: PullRequestData[], prMeta, idx) => {
        const prActivities = filteredPrActivities[idx];
        if (prActivities.length > 0) {
          acc.push({
            prMeta,
            prActivities: filteredPrActivities[idx],
          });
        }
        return acc;
      },
      []
    );

    // For each PR
    for (const pr of updatedPrData) {
      const { prMeta, prActivities } = pr;

      // For each PR activity
      for (const prActivity of prActivities) {
        const { message, receivedUser } = slackHelper.genMessage(
          prMeta,
          prActivity
        );

        if (Array.isArray(message) && Array.isArray(receivedUser)) {
          message.forEach(async (msg, idx) => {
            if (!receivedUser[idx]) throw new Error("User not found");
            await slackHelper.sendMessage(receivedUser[idx], msg);
          });
        } else if (
          typeof message === "string" &&
          typeof receivedUser === "string"
        ) {
          if (!receivedUser) throw new Error("User not found");
          await slackHelper.sendMessage(receivedUser, message);
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
};

export default main;
