import { IncomingWebhook, IncomingWebhookSendArguments } from "@slack/webhook";
import {
  PullRequestData,
  PullRequestEvent,
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

  public async sendMessage(prData: PullRequestData): Promise<void> {
    const { message, receivedUser } = this.genMessage(prData);

    if (Array.isArray(message) && Array.isArray(receivedUser)) {
      message.forEach(async (msg, idx) => {
        if (!receivedUser[idx]) throw new Error("User not found");
        console.log(`Sending message ${msg} to ${receivedUser[idx]}`);
        await this.send(receivedUser[idx], msg);
      });
    } else if (
      typeof message === "object" &&
      typeof receivedUser === "string"
    ) {
      if (!receivedUser) throw new Error("User not found");

      await this.send(receivedUser, message as IncomingWebhookSendArguments);
    } else {
      throw new Error("Message do not match with user");
    }
  }

  private async send(
    user: string,
    message: IncomingWebhookSendArguments
  ): Promise<void> {
    const webhook = new IncomingWebhook(this.webhookUrl, {
      channel: `@${user}`,
      username: "Pull Platypus",
    });

    await webhook.send(message);
  }

  private getSlackUser(bitbucketUser: string): string {
    const slackUser = this.bitbucketToSlackMap[bitbucketUser];
    return slackUser ? slackUser : bitbucketUser;
  }

  private genMessage(
    prData: PullRequestData
  ): {
    message: IncomingWebhookSendArguments | IncomingWebhookSendArguments[];
    receivedUser: string | string[];
  } {
    let message: IncomingWebhookSendArguments | IncomingWebhookSendArguments[];
    let receivedUser: string | string[];

    switch (prData.type) {
      case PullRequestEvent.APPROVED:
      case PullRequestEvent.UNAPPROVED:
      case PullRequestEvent.NEEDS_WORK: {
        message = this.genSlackMessageDecision(prData);
        receivedUser = this.getSlackUser(prData.authorId);
        break;
      }

      case PullRequestEvent.COMMENTS_ADDED: {
        const { authorId, commenterId, reviewerIds } = prData;
        console.log("three ids", authorId, commenterId, reviewerIds);
        // No need to send notification to commenter
        const receiverIds = [authorId, ...reviewerIds].filter(
          (id) => id !== commenterId
        );
        console.log("receiverIds", receiverIds);
        message = Array(receiverIds.length).fill(
          this.genSlackMessageComment(prData)
        );
        receivedUser = receiverIds.map((receiverId) =>
          this.getSlackUser(receiverId)
        );
        console.log("message", message);
        console.log("receivedUser", receivedUser);
        break;
      }

      case PullRequestEvent.OPENED: {
        const { reviewerIds, ...rest } = prData;
        message = reviewerIds.map((reviewerId) => {
          return this.genSlackMessageRequest({ ...rest, reviewerId });
        });
        receivedUser = reviewerIds.map((reviewerId) =>
          this.getSlackUser(reviewerId)
        );
        break;
      }
    }

    return { message, receivedUser };
  }

  private genSlackMessageDecision(
    slackMessageDecision: SlackMessageDecision
  ): IncomingWebhookSendArguments {
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
  ): IncomingWebhookSendArguments {
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
  ): IncomingWebhookSendArguments {
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
