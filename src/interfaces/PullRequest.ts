export enum ReviewStatus {
  APPROVED = "approved",
  NEEDS_WORK = "needsWork",
  REJECTED = "rejected",
}

export enum ReviewAction {
  COMMENTED = "COMMENTED",
  APPROVED = "APPROVED",
  RESCOPED = "RESCOPED",
  UNAPPROVED = "UNAPPROVED",
  UPDATED = "UPDATED",
  OPENED = "OPENED",
}

export interface PullRequest {
  prId: string;
  prTitle: string;
  prLink: string;
  authorId: string;
  comments: Comment[];
  reviewers: Reviewer[];
}

export interface Reviewer {
  reviewerId: string;
  status: ReviewStatus;
}

export interface Comment {
  commenterId: string;
  text: string;
}

// Main data to be extracted from listing PR activities for given PR
export type PullRequestActivity = (
  | {
      action: ReviewAction.APPROVED | ReviewAction.UNAPPROVED;
      reviewerId: string;
    }
  | { action: ReviewAction.COMMENTED; commenterId: string; text: string }
  | { action: ReviewAction.OPENED; reviewerIds: string[] }
) & { createdDate: number };

// Initial data to extracted from listing PRs from given repo
export interface PullRequestMeta {
  prId: number;
  prTitle: string;
  prLink: string;
  authorId: string;
  reviewerIds: string[];
}

export interface PullRequestData {
  prMeta: PullRequestMeta;
  prActivities: PullRequestActivity[];
}
