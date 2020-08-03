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
  PullRequestEvent.COMMENTS_ADDED,
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
    title: "Name of Pull Request",
    fromRef: {
      repository: {
        name: "name-of-repository",
        project: {
          name: "PROJECT NAME",
        },
      },
    },
    author: {
      user: {
        emailAddress: "mr_platypus@gmail.com",
      },
    },
    links: {
      self: [{ href: "www.google.com" }],
    },
  },
  participant: {
    user: {
      emailAddress: "mr_platypus@gmail.com",
    },
    status: "APPROVED",
  },
};

export const mockCommentPayload = {
  eventKey: "pr:comment:added",
  pullRequest: {
    title: "Name of Pull Request",
    fromRef: {
      repository: {
        name: "name-of-repository",
        project: {
          name: "PROJECT NAME",
        },
      },
    },
    author: {
      user: {
        emailAddress: "mr_platypus@gmail.com",
      },
    },
    reviewers: [
      {
        user: {
          emailAddress: "mr_platypus@gmail.com",
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
      emailAddress: "mr_platypus@gmail.com",
    },
  },
};

export const mockOpenPayload = {
  eventKey: "pr:opened",
  pullRequest: {
    title: "Name of Pull Request",
    fromRef: {
      repository: {
        name: "name-of-repository",
        project: {
          name: "PROJECT NAME",
        },
      },
    },
    author: {
      user: {
        emailAddress: "mr_platypus@gmail.com",
      },
    },
    reviewers: [
      {
        user: {
          emailAddress: "mr_platypus@gmail.com",
        },
      },
    ],
    links: {
      self: [{ href: "www.google.com" }],
    },
  },
};
