import { SlackMessageMeta } from "../interfaces/SlackMessage";
import {
  PullRequestOpened,
  PullRequestMeta,
  PullRequestComment,
  PullRequestDecision,
  PullRequestEvent,
  PullRequestData,
} from "../interfaces/PullRequest";

class BitbucketHelper {
  private static getMetaData(event: any): SlackMessageMeta {
    const {
      pullRequest: {
        title: prTitle,
        fromRef: {
          repository: { name: repoName },
        },
        author: {
          user: { emailAddress: authorId },
        },
        links: {
          self: [{ href: prLink }],
        },
      },
    } = event;

    return { repoName, prTitle, prLink, authorId };
  }

  private static getStatusData(
    event: any
  ): Omit<PullRequestDecision, keyof PullRequestMeta> {
    const {
      participant: {
        user: { emailAddress: reviewerId },
        status,
      },
    } = event;

    return { reviewerId, status };
  }

  private static getCommentData(
    event: any
  ): Omit<PullRequestComment, keyof PullRequestMeta> {
    const {
      comment: {
        text,
        author: { emailAddress: commenterId },
      },
    } = event;

    return { commenterId, text };
  }

  private static getOpenedData(
    event: any
  ): Omit<PullRequestOpened, keyof PullRequestMeta> {
    const {
      pullRequest: { reviewers: rawReviewers },
    } = event;

    const reviewerIds: string[] = rawReviewers.map(
      ({ user: { emailAddress } }) => {
        return emailAddress;
      }
    );

    return { reviewerIds };
  }

  public static getData(event: any): PullRequestData {
    const { eventKey }: { eventKey: PullRequestEvent } = event;

    const metaData = this.getMetaData(event);

    let mainData;
    switch (eventKey) {
      case PullRequestEvent.APPROVED:
      case PullRequestEvent.NEEDS_WORK:
      case PullRequestEvent.UNAPPROVED:
        mainData = this.getStatusData(event);
        break;
      case PullRequestEvent.COMMENTDS_ADDED:
        mainData = this.getCommentData(event);
        break;
      case PullRequestEvent.OPENED:
        mainData = this.getOpenedData(event);
        break;
    }

    const data = { ...metaData, ...mainData };
    return data;
  }
}

export default BitbucketHelper;
