import {
  PullRequestMeta,
  PullRequestDecision,
  PullRequestComment,
} from "./PullRequest";

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

export type SlackMessageMeta = PullRequestMeta;

export type SlackMessageDecision = PullRequestDecision;

export type SlackMessageComment = PullRequestComment;

export type SlackMessageRequest = { reviewerId: string } & SlackMessageMeta;
