import dotenv from "dotenv";
import crypto from "crypto";
import BitbucketHelper from "./helpers/BitbucketHelper";
import SlackHelper from "./helpers/SlackHelper";
import awsParamStore from "aws-param-store";

dotenv.config();

enum Param {
  BITBUCKET_TO_SLACK_MAP = "BITBUCKET_TO_SLACK_MAP",
  WEBHOOK_URL = "WEBHOOK_URL",
  WEBHOOK_SECRET = "WEBHOOK_SECRET",
}

// Function to filter param list returned from AWS param store
// and return the param value based on param name
const filterParam = (paramName, parameters: any[]) => {
  let param = "";
  const filteredParam = parameters.filter(({ Name }) =>
    Name.includes(paramName)
  );
  if (filteredParam.length > 0) {
    param = filteredParam[0].Value;
  }
  return param;
};

// Main
const main = async (event: any) => {
  let message: string;

  // Configuration
  let bitbucketToSlackMap: string, webhookUrl: string, webhookSecret: string;
  const ssmPath = process.env.SSM_PATH;
  // Use variables from aws param store
  if (ssmPath) {
    try {
      const parameters = await awsParamStore.getParametersByPath(ssmPath);
      bitbucketToSlackMap = filterParam(
        Param.BITBUCKET_TO_SLACK_MAP,
        parameters
      );
      webhookUrl = filterParam(Param.WEBHOOK_URL, parameters);
      webhookSecret = filterParam(Param.WEBHOOK_SECRET, parameters);
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
  }
  // Use variables from .env file
  else {
    bitbucketToSlackMap = process.env[Param.BITBUCKET_TO_SLACK_MAP];
    webhookUrl = process.env[Param.WEBHOOK_URL];
    webhookSecret = process.env[Param.WEBHOOK_SECRET];
  }

  if (!bitbucketToSlackMap || !webhookUrl || !webhookSecret) {
    message = "Internal Server Error";
    console.log("Environment variables not found");
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
    console.log("Request Body: ", body);
    const slackHelper = new SlackHelper(
      webhookUrl,
      JSON.parse(bitbucketToSlackMap)
    );
    const data = BitbucketHelper.getData(payload);

    // Send slack message
    if (data) await slackHelper.sendMessage(data);

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
