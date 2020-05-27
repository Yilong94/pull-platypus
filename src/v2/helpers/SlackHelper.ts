import { IncomingWebhook } from "@slack/webhook";
import {
  PullRequestData,
  PullRequestEvent,
  PullRequestOpened,
  PullRequestStatus,
} from "../interfaces/PullRequest";
import {
  SlackMessageDecision,
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
  private webhookUrl: string;
  private bitbucketToSlackMap: { [key: string]: string };

  constructor(
    webhookUrl: string,
    bitbucketToSlackMap: { [key: string]: string }
  ) {
    this.webhookUrl = webhookUrl;
    this.bitbucketToSlackMap = bitbucketToSlackMap;
  }

  public async sendMessage(
    prEvent: PullRequestEvent,
    prData: PullRequestData
  ): Promise<void> {
    const { message, receivedUser } = this.genMessage(prEvent, prData);

    if (Array.isArray(message) && Array.isArray(receivedUser)) {
      message.forEach(async (msg, idx) => {
        if (!receivedUser[idx]) throw new Error("User not found");
        await this.send(receivedUser[idx], msg);
      });
    } else if (
      typeof message === "string" &&
      typeof receivedUser === "string"
    ) {
      if (!receivedUser) throw new Error("User not found");
      await this.send(receivedUser, message);
    }
  }

  private async send(user: string, text: string): Promise<void> {
    const webhook = new IncomingWebhook(this.webhookUrl, {
      channel: `@${user}`,
      username: "Pull Platypus",
    });
    await webhook.send(text);
  }

  private getSlackUser(bitbucketUser: string): string {
    const slackUser = this.bitbucketToSlackMap[bitbucketUser];
    return slackUser ? slackUser : bitbucketUser;
  }

  private genMessage(
    prEvent: PullRequestEvent,
    prData: PullRequestData
  ): { message: string | string[]; receivedUser: string | string[] } {
    let message: string | string[];
    let receivedUser: string | string[];

    switch (prEvent) {
      case PullRequestEvent.APPROVED:
      case PullRequestEvent.UNAPPROVED:
      case PullRequestEvent.NEEDS_WORK:
        message = this.genSlackMessageDecision(prData as SlackMessageDecision);
        receivedUser = this.getSlackUser(prData.authorId);
        break;

      case PullRequestEvent.COMMENTDS_ADDED:
        message = this.genSlackMessageComment(prData as SlackMessageComment);
        receivedUser = this.getSlackUser(prData.authorId);
        break;

      case PullRequestEvent.OPENED:
        const { reviewerIds, ...rest } = prData as PullRequestOpened;
        message = reviewerIds.map((reviewerId) => {
          return this.genSlackMessageRequest({ ...rest, reviewerId });
        });
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
      projectName,
      prTitle,
      prLink,
      reviewerId,
      status,
    } = slackMessageDecision;
    let displayStatus: string;
    switch (status) {
      case PullRequestStatus.APPROVED:
        displayStatus = "Your PR has been approved :star:";
        break;
      case PullRequestStatus.UNAPPROVED:
        displayStatus = "Your PR has been unapproved :exclamation:";
        break;
      case PullRequestStatus.NEEDS_WORK:
        displayStatus = "Your PR needs work :sweat_drops:";
        break;
    }
    const message = buildMessage({
      messageTitle: PR_REVIEW_STATUS,
      prTitle,
      repoName,
      projectName,
      mainMessage: `${displayStatus}`,
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
      projectName,
      prTitle,
      prLink,
      commenterId,
      text,
    } = slackMessageComment;
    const message = buildMessage({
      messageTitle: PR_COMMENT,
      prTitle,
      repoName,
      projectName,
      mainMessage: `${text} :speech_balloon:`,
      by: this.getSlackUser(commenterId),
      link: prLink,
    });

    return message;
  }

  private genSlackMessageRequest(
    slackMessageRequest: SlackMessageRequest
  ): string {
    const {
      repoName,
      projectName,
      prTitle,
      prLink,
      authorId,
    } = slackMessageRequest;
    const message = buildMessage({
      messageTitle: PR_REVIEW_REQUEST,
      prTitle,
      repoName,
      projectName,
      mainMessage: `A PR has been opened for your review :bow:`,
      by: this.getSlackUser(authorId),
      link: prLink,
    });

    return message;
  }
}

export default SlackHelper;
