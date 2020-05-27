import dotenv from "dotenv";
import BitbucketHelper from "./helpers/BitbucketHelper";
import SlackHelper from "./helpers/SlackHelper";

dotenv.config();

// Configuration
const webhookUrl = process.env.WEBHOOK_URL;
const bitbucketToSlackMap = JSON.parse(process.env.BITBUCKET_TO_SLACK_MAP);

// Main
const main = async (event: any) => {
  // TOOD: verification of bitbucket webhook secret

  let response, message: string;
  const slackHelper = new SlackHelper(webhookUrl, bitbucketToSlackMap);
  const { headers, body } = event;

  // Diagnostics check
  if (headers && headers["X-Event-Key"] === "diagnostics:ping") {
    message = "Diagnostics check successful";
    response = {
      isBase64Encoded: false,
      statusCode: 200,
      body: JSON.stringify({ message }),
    };
  } else {
    try {
      const payload = JSON.parse(body);
      // Extract data from webhook
      const data = BitbucketHelper.getData(payload);
      // Send slack emssage
      await slackHelper.sendMessage(payload.eventKey, data);

      message = "Webhook call successful";
      response = {
        isBase64Encoded: false,
        statusCode: 200,
        body: JSON.stringify({ message }),
      };
    } catch (err) {
      message = "Webhook call failed";
      response = {
        isBase64Encoded: false,
        statusCode: 500,
        body: JSON.stringify({ message }),
      };
    }
  }

  console.log(message);
  return response;
};

export default main;
