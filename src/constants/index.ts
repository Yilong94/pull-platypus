import { IncomingWebhookSendArguments } from "@slack/webhook";
import { PullRequestEvent } from "../interfaces/PullRequest";

export const PR_REVIEW_STATUS = "PR REVIEW STATUS";
export const PR_COMMENT = "PR COMMENT";
export const PR_REVIEW_REQUEST = "PR REVIEW REQUEST";
export const PULL_REQUEST_EVENTS = [
  PullRequestEvent.APPROVED,
  PullRequestEvent.UNAPPROVED,
  PullRequestEvent.NEEDS_WORK,
  PullRequestEvent.OPENED,
  PullRequestEvent.COMMENTDS_ADDED,
];

interface BuildMessage {
  messageTitle: string;
  prTitle: string;
  repoName: string;
  projectName: string;
  mainMessage: string;
  by: string;
  link: string;
}

export const buildMessage = ({
  messageTitle,
  prTitle,
  repoName,
  projectName,
  mainMessage,
  by,
  link,
}: BuildMessage): IncomingWebhookSendArguments => {
  const message = {
    text: messageTitle,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${messageTitle}*
><${link}|${prTitle}>
>${projectName} – ${repoName}
>${mainMessage.replace("\n", "\n>")}
>
>By: <@${by}>`,
        },
      },
    ],
  };

  return message;
};

export const ignoreComments = [
  /Please ensure the following tasks are completed before merging/,
];

export const mockDecisionPayload = {
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

export const mockCommentPayload = {
  eventKey: "pr:comment:added",
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
    reviewers: [
      {
        user: {
          emailAddress: "chan_win_hung@htx.gov.sg",
        },
      },
    ],
    links: {
      self: [{ href: "www.google.com" }],
    },
  },
  comment: {
    text: "This is a comment!",
    author: {
      emailAddress: "chan_win_hung@htx.gov.sg",
    },
  },
};
