export enum PullRequestEvent {
  OPENED = "pr:opened",
  APPROVED = "pr:reviewer:approved",
  UNAPPROVED = "pr:reviewer:unapproved",
  NEEDS_WORK = "pr:reviewer:needs_work",
  COMMENTDS_ADDED = "pr:comment:added",
}

export enum PullRequestStatus {
  APPROVED = "approved",
  NEEDS_WORK = "needsWork",
  REJECTED = "rejected",
}

export interface PullRequestMeta {
  repoName: string;
  prTitle: string;
  prLink: string;
  authorId: string;
}

export interface PullRequestDecision extends PullRequestMeta {
  reviewerId: string;
  status: PullRequestStatus;
}

export interface PullRequestComment extends PullRequestMeta {
  commenterId: string;
  text: string;
}

export interface PullRequestOpened extends PullRequestMeta {
  reviewerIds: string[];
}

export type PullRequestData =
  | PullRequestDecision
  | PullRequestComment
  | PullRequestOpened;
