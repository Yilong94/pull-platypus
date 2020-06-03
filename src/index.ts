import crypto from "crypto";
import BitbucketHelper from "./helpers/BitbucketHelper";
import SlackHelper from "./helpers/SlackHelper";
import awsParamStore from "aws-param-store";

enum Param {
  BITBUCKET_TO_SLACK_MAP = "BITBUCKET_TO_SLACK_MAP",
  WEBHOOK_URL = "WEBHOOK_URL",
  WEBHOOK_SECRET = "WEBHOOK_SECRET",
}

// Main
const main = async (event: any) => {
  let message: string;

  // Configuration
  let bitbucketToSlackMap: string, webhookUrl: string, webhookSecret: string;
  const ssmPath = process.env.SSM_PATH;
  try {
    const parameters = await awsParamStore.getParametersByPath(ssmPath);
    console.log("parameters", parameters);
    bitbucketToSlackMap = parameters[Param.BITBUCKET_TO_SLACK_MAP];
    webhookUrl = parameters[Param.WEBHOOK_URL];
    webhookSecret = parameters[Param.WEBHOOK_SECRET];
    console.log("bitbucketToSlackMap", bitbucketToSlackMap);
    console.log("webhookUrl", webhookUrl);
    console.log("webhookSecret", webhookSecret);

    if (!bitbucketToSlackMap || !webhookUrl || !webhookSecret)
      throw new Error("Missing environment variables");
  } catch (err) {
    message = "Internal Server Error";
    console.log(err);
    console.log(message);
    return {
      isBase64Encoded: false,
      statusCode: 500,
      body: JSON.stringify({ message }),
    };
  }

  const { headers, body } = event;

  // Diagnostics check
  if (headers && headers["X-Event-Key"] === "diagnostics:ping") {
    message = "Diagnostics check successful";
    console.log(message);
    return {
      isBase64Encoded: false,
      statusCode: 200,
      body: JSON.stringify({ message }),
    };
  }

  // Authenticate with webhook secret
  const hmacHeader = headers["X-Hub-Signature"].replace("sha256=", "");
  const hmac = crypto.createHmac("sha256", webhookSecret);
  hmac.update(body);
  const hmacHashed = hmac.digest("hex");

  if (hmacHashed !== hmacHeader) {
    message = "Not authorized";
    console.log(message);
    return {
      isBase64Encoded: false,
      statusCode: 401,
      body: JSON.stringify({ message }),
    };
  }

  let response;
  try {
    const payload = JSON.parse(body);
    const slackHelper = new SlackHelper(
      webhookUrl,
      JSON.parse(bitbucketToSlackMap)
    );
    const data = BitbucketHelper.getData(payload);

    // Send slack message
    if (data) await slackHelper.sendMessage(payload.eventKey, data);

    message = "Webhook call successful";
    response = {
      isBase64Encoded: false,
      statusCode: 200,
      body: JSON.stringify({ message }),
    };
  } catch (err) {
    console.log(err);
    message = "Webhook call failed";
    response = {
      isBase64Encoded: false,
      statusCode: 500,
      body: JSON.stringify({ message }),
    };
  }

  console.log(message);
  return response;
};

export default main;
