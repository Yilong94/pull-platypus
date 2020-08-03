# pull-platypus

<img src="https://github.com/Yilong94/pull-platypus/blob/master/assets/images/pull_platypus_icon.png" width="350px" alt="Image of Pull Platypus">

A Pull request reminder for Bitbucket server with Slack integration inspired by Github's [Pull Panda](https://pullreminders.com/)

Notifications on pull request activities are currently sent to emails, which are not very visible and results in lead time delay in the development process. **Pull-platypus** uses Bitbucket Server's [webhook](https://confluence.atlassian.com/bitbucketserver/managing-webhooks-in-bitbucket-server-938025878.html#ManagingwebhooksinBitbucketServer-creatingwebhooks) to alert users to pull request events via Slack direct message. Because the current codebase is optimized for deployment on a AWS lambda function integrated with AWS API gateway, extra steps are required to test the program locally.

**Note: this is made for Bitbucket Server, not tested on Bitbucket Cloud**

## Benefits
:white_check_mark:&nbsp;&nbsp;**Notifications via Slack** (who checks their email?)

:white_check_mark:&nbsp;&nbsp;**Real-time**

:white_check_mark:&nbsp;&nbsp;**Targeted** (notify only those who needs to be notified)

:white_check_mark:&nbsp;&nbsp;**Sends direct message to user** (instead of spamming a channel)

## How it works?
When an event occurs in Bitbucket Server, Bitbucket will fire an API call with a request payload describing the event to a specified URL, and **pull-platypus** will then extract the necessary data from the payload and send the notiifcations via Slack as direct messages to the appropriate recipient using Incoming Webhooks.

Currently, this library supports the following types of notifications:
* Request for PR to be reviewed --> sent to PR reviewer(s)
<img src="https://github.com/Yilong94/pull-platypus/blob/master/assets/images/pull-platypus-pr-opened.png" width="350px" alt="Image of Pull Platypus">

* Comments made in PR --> sent to PR author & PR reviewer(s) (except author of comment)
<img src="https://github.com/Yilong94/pull-platypus/blob/master/assets/images/pull-platypus-pr-comment.png" width="350px" alt="Image of Pull Platypus">

* Decision of PR reviewer (approved/rejected/needs work) --> sent to PR author
<img src="https://github.com/Yilong94/pull-platypus/blob/master/assets/images/pull-platypus-pr-decision.png" width="350px" alt="Image of Pull Platypus">

For more information, you can view the following resources:
* [Bitbucket: Managing webhooks in Bitbucket Server](https://confluence.atlassian.com/bitbucketserver/managing-webhooks-in-bitbucket-server-938025878.html#ManagingwebhooksinBitbucketServer-creatingwebhooks)
* [Bitbucket: Event Payload](https://confluence.atlassian.com/bitbucketserver/event-payload-938025882.html)
* [Slack: Sending messages using Incoming Webhooks](https://api.slack.com/messaging/webhooks)

**Note: There are two different webhooks being used: Bitbucket's webhooks and Slack's Incoming Webhooks**

## <a name="prerequisites"></a>Prerequisites
It is assumed that you have done the following:
* Own a Slack account with access to a channel with people. If not, create a Slack account and make some friends!
* Created an Incoming Webhook in your Slack workspace. If not, check out this [tutorial](https://api.slack.com/messaging/webhooks)
* (For production) Access to a Bitbucket admin account, which provides the ability to configure Bitbucket's webhook. If not, topple the current admin and start a dictatorship (just kidding).

## <a name="configuration"></a>Configuration
For local development, create a `.env` file with the following configuration
```
WEBHOOK_URL=<your slack incoming webhook URL>
WEBHOOK_SECRET=<your bitbucket webhook secret>
BITBUCKET_TO_SLACK_MAP=<your JSON string map of email_address_used_for_bitbucket to slack_member_id>
```

Example of BITBUCKET_TO_SLACK_MAP:
```
BITBUCKET_TO_SLACK_MAP={"platypus_is_cool@zoo.com":"UL2H6L7NG"}
```

## Development
Before this, ensure that you have fulfilled the [prerequisites](#prerequisites) and your [configurations](#configuration) are defined

In `src/constants/index.ts`, modify the following code
```
export const mockDecisionPayload = {
  ...
  pullRequest: {
    ...
    participant: {
      user: {
        emailAddress: "mr_platypus@gmail.com" >>> "<your-bitbucket-email-address>",
      },
    ...
  },
};
```

In `src/index.ts`, add the following code
```
import { mockDecisionPayload } from "./constants";

(...rest of code)

// TESTING
(async () => {
  const body = mockDecisionPayload;
  const stringifiedBody = JSON.stringify(body);
  const hmac = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET);
  hmac.update(stringifiedBody);
  const hmacHashed = hmac.digest("hex");
  const data = {
    headers: {
      "X-Hub-Signature": `sha256=${hmacHashed}`,
    },
    body: stringifiedBody,
  };
  main(data);
})();
```

In the root-level directory, run the following in a terminal
```
# development
npm install
npm run dev
```
You should be able to see the Slack notification on your pull request

## Production
@TODO
