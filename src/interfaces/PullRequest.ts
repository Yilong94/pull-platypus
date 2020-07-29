export enum PullRequestEvent {
  OPENED = "pr:opened",
  APPROVED = "pr:reviewer:approved",
  UNAPPROVED = "pr:reviewer:unapproved",
  NEEDS_WORK = "pr:reviewer:needs_work",
  COMMENTDS_ADDED = "pr:comment:added",
}

export enum PullRequestStatus {
  APPROVED = "APPROVED",
  NEEDS_WORK = "NEEDS_WORK",
  UNAPPROVED = "UNAPPROVED",
}

export interface PullRequestMeta {
  repoName: string;
  projectName: string;
  prTitle: string;
  prLink: string;
  authorId: string;
}

export interface PullRequestDecision extends PullRequestMeta {
  type:
    | PullRequestEvent.APPROVED
    | PullRequestEvent.UNAPPROVED
    | PullRequestEvent.NEEDS_WORK;
  reviewerId: string;
  status: PullRequestStatus;
}

export interface PullRequestComment extends PullRequestMeta {
  type: PullRequestEvent.COMMENTDS_ADDED;
  commenterId: string;
  text: string;
  reviewerIds: string[];
}

export interface PullRequestOpened extends PullRequestMeta {
  type: PullRequestEvent.OPENED;
  reviewerIds: string[];
}

export type PullRequestData =
  | PullRequestDecision
  | PullRequestComment
  | PullRequestOpened;
