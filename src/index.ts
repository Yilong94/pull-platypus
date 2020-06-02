import crypto from "crypto";
import dotenv from "dotenv";
import BitbucketHelper from "./helpers/BitbucketHelper";
import SlackHelper from "./helpers/SlackHelper";

dotenv.config();

// Configuration
const webhookUrl = process.env.WEBHOOK_URL;
const bitbucketToSlackMap = JSON.parse(process.env.BITBUCKET_TO_SLACK_MAP);

// Main
const main = async (event: any) => {
  let response, message: string;
  const slackHelper = new SlackHelper(webhookUrl, bitbucketToSlackMap);
  const { headers, body } = event;

  // Authenticate with webhook secret
  console.log("headers", headers);
  console.log("body", body);
  const hmacHeader = headers["X-Hub-Signature"].replace("sha256=", "");
  const hmac = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET);
  hmac.update(body);
  const hmacHashed = hmac.digest("hex");
  console.log("hmacHashed", hmacHashed);
  console.log("hmacHeader", hmacHeader);

  if (hmacHashed !== hmacHeader) {
    message = "Not authorized";
    response = {
      isBase64Encoded: false,
      statusCode: 401,
      body: JSON.stringify({ message }),
    };
  } else {
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
    }
  }

  console.log(message);
  return response;
};

(async () => {
  const body = {
    eventKey: "pr:reviewer:approved",
    pullRequest: {
      title: "Test title",
      fromRef: {
        repository: {
          name: "test-repo",
          project: "test-project",
        },
      },
      author: {
        user: {
          emailAddress: "tan_yi_long@tech.gov.sg",
        },
      },
      links: {
        self: [{ href: "www.google.com" }],
      },
    },
    participant: {
      user: {
        emailAddress: "tan_yi_long@tech.gov.sg",
      },
      status: "APPROVED",
    },
  };
  const stringifiedBody = JSON.stringify(body);
  console.log(stringifiedBody);
  const hmac = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET);
  hmac.update(stringifiedBody);
  const hmacHashed = hmac.digest("hex");
  const data = {
    headers: {
      "X-Hub-Signature": `sha256=${hmacHashed}`,
    },
    body: stringifiedBody,
  };
  console.log(data);
  main(data);
})();

export default main;

// { "headers" :
//   { "X-Hub-Signature": "sha256=28f544633b04551962d4d83009eada1748badcc6b80433fb7590e4d33b1843b4" },
//  "body": "{\"eventKey\":\"pr:reviewer:approved\",\"pullRequest\":{\"title\":\"Test title\",\"fromRef\":{\"repository\":{\"name\":\"test-repo\",\"project\":\"test-project\"}},\"author\":{\"user\":{\"emailAddress\":\"tan_yi_long@tech.gov.sg\"}},\"links\":{\"self\":[{\"href\":\"www.google.com\"}]}},\"participant\":{\"user\":{\"emailAddress\":\"tan_yi_long@tech.gov.sg\"},\"status\":\"APPROVED\"}}"
// }

// {"eventKey":"pr:reviewer:approved","pullRequest":{"title":"Test title","fromRef":{"repository":{"name":"test-repo","project":"test-project"}},"author":{"user":{"emailAddress":"tan_yi_long@tech.gov.sg"}},"links":{"self":[{"href":"www.google.com"}]}},"participant":{"user":{"emailAddress":"tan_yi_long@tech.gov.sg"},"status":"APPROVED"}}
