import { SlackMessageMeta } from "../interfaces/SlackMessage";
import {
  PullRequestOpened,
  PullRequestMeta,
  PullRequestComment,
  PullRequestDecision,
  PullRequestEvent,
  PullRequestData,
} from "../interfaces/PullRequest";
import { ignoreComments } from "../constants";

class BitbucketHelper {
  private static getMetaData(event: any): SlackMessageMeta {
    const {
      pullRequest: {
        title: prTitle,
        fromRef: {
          repository: {
            name: repoName,
            project: { name: projectName },
          },
        },
        author: {
          user: { emailAddress: authorId },
        },
        links: {
          self: [{ href: prLink }],
        },
      },
    } = event;

    return { repoName, projectName, prTitle, prLink, authorId };
  }

  private static getStatusData(
    event: any
  ): Omit<PullRequestDecision, keyof PullRequestMeta> {
    const {
      participant: {
        user: { emailAddress: reviewerId },
        status,
      },
      eventKey,
    } = event;

    return { type: eventKey, reviewerId, status };
  }

  private static getCommentData(
    event: any
  ): Omit<PullRequestComment, keyof PullRequestMeta> | undefined {
    const {
      comment: {
        text,
        author: { emailAddress: commenterId },
      },
      pullRequest: { reviewers: rawReviewers },
      eventKey,
    } = event;

    const reviewerIds: string[] = rawReviewers.map(
      ({ user: { emailAddress } }) => {
        return emailAddress;
      }
    );

    // Return undefined if comment is to be ignored
    if (ignoreComments.some((regex) => regex.test(text))) return;

    return { type: eventKey, commenterId, text, reviewerIds };
  }

  private static getOpenedData(
    event: any
  ): Omit<PullRequestOpened, keyof PullRequestMeta> {
    const {
      pullRequest: { reviewers: rawReviewers },
      eventKey,
    } = event;

    const reviewerIds: string[] = rawReviewers.map(
      ({ user: { emailAddress } }) => {
        return emailAddress;
      }
    );

    return { type: eventKey, reviewerIds };
  }

  public static getData(event: any): PullRequestData | undefined {
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
    if (!mainData) return;

    const data = { ...metaData, ...mainData };
    return data;
  }
}

export default BitbucketHelper;
