import { ReviewStatus } from "./PullRequest";

/**
 * Types of notification to send to user
 * (1) Decision of PR reviewer (approved/rejected/needs work) --> sent to PR author
 * (2) Comments made in PR by a person (need not be reviewer) --> sent to PR author
 * (3) Request for PR to be reviewed --> sent to PR reviewer
 */

export enum SlackMessageType {
  DECISION = "decision",
  COMMENT = "comment",
  REQUEST = "request",
}

export interface SlackMessageMeta {
  repoName: string;
  prTitle: string;
  prLink: string;
  authorId: string;
}

export interface SlackMessageDecision extends SlackMessageMeta {
  reviewerId: string;
  status: ReviewStatus;
}

export interface SlackMessageComment extends SlackMessageMeta {
  commenterId: string;
  text: string;
}

export interface SlackMessageRequest extends SlackMessageMeta {
  reviewerId: string;
}
