import BitbucketHelper from "./helpers/BitbucketHelper";
import SlackHelper from "./helpers/SlackHelper";

// Configuration
const webhookUrl = process.env.WEBHOOK_URL;
const bitbucketToSlackMap = JSON.parse(process.env.BITBUCKET_TO_SLACK_MAP);

// Main
const main = async (event: any) => {
  // TOOD: verification of bitbucket webhook secret

  const slackHelper = new SlackHelper(webhookUrl, bitbucketToSlackMap);
  const { body } = event;
  if (body) {
    const payload = JSON.parse(body);

    // Extract data from webhook
    const data = BitbucketHelper.getData(payload);
    // Send slack emssage
    await slackHelper.sendMessage(payload, data);
  }

  return {
    isBase64Encoded: false,
    statusCode: 200,
    body: {},
  };
};

export default main;
