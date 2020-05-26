import BitbucketHelper from "./helpers/BitbucketHelper";
import SlackHelper from "./helpers/SlackHelper";

// Configuration
const webhookUrl = process.env.WEBHOOK_URL;
const bitbucketToSlackMap = JSON.parse(process.env.BITBUCKET_TO_SLACK_MAP);

// Main
const main = (event) => {
  const slackHelper = new SlackHelper(webhookUrl, bitbucketToSlackMap);

  // Extract data from webhook
  const data = BitbucketHelper.getData(event);
  // Send slack emssage
  slackHelper.sendMessage(event, data);
};

export default main;
