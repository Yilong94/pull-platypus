import { IncomingWebhook } from "@slack/webhook";
import {
  PullRequestMeta,
  PullRequestActivity,
  ReviewAction,
  ReviewStatus,
} from "../interfaces/PullRequest";
import {
  SlackMessageDecision,
  SlackMessageMeta,
  SlackMessageComment,
  SlackMessageRequest,
} from "../interfaces/SlackMessage";
import {
  buildMessage,
  PR_REVIEW_REQUEST,
  PR_COMMENT,
  PR_REVIEW_STATUS,
} from "../constants";

class SlackHelper {
  webhookUrl: string;
  bitbucketToSlackMap: { [key: string]: string };

  constructor(
    webhookUrl: string,
    bitbucketToSlackMap: { [key: string]: string }
  ) {
    this.webhookUrl = webhookUrl;
    this.bitbucketToSlackMap = bitbucketToSlackMap;
  }

  public async sendMessage(user: string, text: string): Promise<void> {
    const webhook = new IncomingWebhook(this.webhookUrl, {
      channel: `@${user}`,
      username: "Pull Platypus",
    });
    await webhook.send(text);
  }

  private getSlackUser(bitbucketUser: string): string {
    return this.bitbucketToSlackMap[bitbucketUser];
  }

  public genMessage(
    prMeta: PullRequestMeta,
    prActivity: PullRequestActivity
  ): { message: string | string[]; receivedUser: string | string[] } {
    let message: string | string[];
    let receivedUser: string | string[];
    const { prTitle, prLink, authorId } = prMeta;
    const { action } = prActivity;

    const slackMessageMeta: SlackMessageMeta = {
      repoName: process.env.REPO_NAME,
      prTitle,
      prLink,
      authorId,
    };
    switch (action) {
      case ReviewAction.APPROVED:
      case ReviewAction.UNAPPROVED:
        const { reviewerId } = prActivity as Extract<
          PullRequestActivity,
          { action: ReviewAction.APPROVED | ReviewAction.UNAPPROVED }
        >;
        message = this.genSlackMessageDecision({
          ...slackMessageMeta,
          reviewerId,
          status:
            action === ReviewAction.APPROVED
              ? ReviewStatus.APPROVED
              : ReviewStatus.REJECTED,
        });
        receivedUser = this.getSlackUser(authorId);
        break;

      case ReviewAction.COMMENTED:
        const { commenterId, text: commentText } = prActivity as Extract<
          PullRequestActivity,
          { action: ReviewAction.COMMENTED }
        >;
        message = this.genSlackMessageComment({
          ...slackMessageMeta,
          commenterId,
          text: commentText,
        });
        receivedUser = this.getSlackUser(authorId);
        break;

      case ReviewAction.OPENED:
        const { reviewerIds } = prActivity as Extract<
          PullRequestActivity,
          { action: ReviewAction.OPENED }
        >;
        message = reviewerIds.map((reviewerId) =>
          this.genSlackMessageRequest({ ...slackMessageMeta, reviewerId })
        );
        receivedUser = reviewerIds.map((reviewerId) =>
          this.getSlackUser(reviewerId)
        );
        break;
    }

    return { message, receivedUser };
  }

  private genSlackMessageDecision(
    slackMessageDecision: SlackMessageDecision
  ): string {
    const {
      repoName,
      prTitle,
      prLink,
      reviewerId,
      status,
    } = slackMessageDecision;
    let displayStatus: string;
    switch (status) {
      case ReviewStatus.APPROVED:
        displayStatus = "Approved :star:";
        break;
      case ReviewStatus.REJECTED:
        displayStatus = "Rejected :exclamation:";
        break;
      case ReviewStatus.NEEDS_WORK:
        displayStatus = "Needs work :sweat_drops:";
        break;
    }
    const message = buildMessage({
      messageTitle: PR_REVIEW_STATUS,
      prTitle,
      repoName,
      mainMessage: `Status: ${displayStatus}`,
      by: this.getSlackUser(reviewerId),
      link: prLink,
    });

    return message;
  }

  private genSlackMessageComment(
    slackMessageComment: SlackMessageComment
  ): string {
    const {
      repoName,
      prTitle,
      prLink,
      commenterId,
      text,
    } = slackMessageComment;
    const message = buildMessage({
      messageTitle: PR_COMMENT,
      prTitle,
      repoName,
      mainMessage: `Comment :speech_balloon:: ${text}`,
      by: this.getSlackUser(commenterId),
      link: prLink,
    });

    return message;
  }

  private genSlackMessageRequest(
    slackMessageRequest: SlackMessageRequest
  ): string {
    const { repoName, prTitle, prLink, authorId } = slackMessageRequest;
    const message = buildMessage({
      messageTitle: PR_REVIEW_REQUEST,
      prTitle,
      repoName,
      by: this.getSlackUser(authorId),
      link: prLink,
    });

    return message;
  }
}

export default SlackHelper;
