# pull-platypus
A Pull request reminder for Bitbucket server with Slack integration.

Notifications on pull request activities are currently sent to emails, which are not very visible and results in delay time in the development process. **Pull-platypus** will make API calls at regular intervals to check for updates in the pull request and send the notiifcations via Slack as direct messages to the appropriate recipient

Currently, this library supports the following types of notifications:
* Decision of PR reviewer (approved/rejected/needs work) --> sent to PR author
* Comments made in PR --> sent to PR author
* Request for PR to be reviewed --> sent to PR reviewer

Inspired from Github's [Pull Panda](https://pullreminders.com/)

**Note: this is made for Bitbucket Server, not Bitbucket Cloud**

## <a name="configuration"></a>Configuration
Create a `.env` file with the following configuration
```
USERNAME=<your bitbucket server username>
PASSWORD=<your bitbucket server password>
PROJECT_NAME=<your bitbucket server project name>
REPO_NAME=<your bitbucket server repository name>
API_CALL_INTERVAL=<interval between each API call in milliseconds>
WEBHOOK_URL=<your slack webhook URL>
BITBUCKET_TO_SLACK_MAP=<your JSON string map of email address used for bitbucket to slack username>
```

Example of BITBUCKET_TO_SLACK_MAP:
```
BITBUCKET_TO_SLACK_MAP={"platypus_is_cool@zoo.com":"mr_platypus"}
```

## Quick Start
Before this, ensure that your [configurations](#configuration) are set
```
# development
npm install
npm run dev

# production
npm install
npm run build
npm start
```
