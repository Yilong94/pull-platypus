import BitbucketServer, { Options } from "@atlassian/bitbucket-server";
import {
  PullRequest,
  Reviewer,
  PullRequestActivity,
  ReviewAction,
  PullRequestMeta,
} from "../interfaces/PullRequest";

interface BitbucketHelperOptions {
  authOptions: {
    username: string;
    password: string;
    projectName: string;
    repoName: string;
  };
  serverOptions: Options;
}

class BitbucketHelper {
  private username: string;
  private password: string;
  private projectName: string;
  private repoName: string;
  private client: BitbucketServer;

  constructor(options: BitbucketHelperOptions) {
    const {
      authOptions: { username, password, projectName, repoName },
      serverOptions,
    } = options;

    this.username = username;
    this.password = password;
    this.projectName = projectName;
    this.repoName = repoName;

    this.client = new BitbucketServer(serverOptions);

    this.authenticate({
      username,
      password,
    });
  }

  private authenticate({ username, password }) {
    this.client.authenticate({
      type: "basic",
      username,
      password,
    });
  }

  public async getAllPr(): Promise<PullRequest[]> {
    try {
      const { data } = await this.client.repos.getPullRequests({
        projectKey: this.projectName,
        repositorySlug: this.repoName,
        state: "open",
      });

      const pr: PullRequest[] = await Promise.all(
        data.values.map(
          async ({
            id,
            title,
            author: {
              user: { emailAddress },
            },
            links: {
              self: [{ href }],
            },
            reviewers: rawReviewers,
          }) => {
            const reviewers: Reviewer[] = rawReviewers.map(
              ({ user: { emailAddress }, status }) => {
                return { reviewerId: emailAddress, status };
              }
            );

            const {
              data: { values: rawComments },
            } = await this.client.pullRequests.getActivities({
              projectKey: this.projectName,
              repositorySlug: this.repoName,
              pullRequestId: id,
            });

            const comments: Comment[] = rawComments
              .filter(({ action }) => action === "COMMENTED")
              .map(({ user: { emailAddress }, comment }) => ({
                commenterId: emailAddress,
                text: comment.text,
              }));

            return {
              prId: id,
              prTitle: title,
              prLink: href,
              authorId: emailAddress,
              reviewers,
              comments,
            };
          }
        )
      );

      return pr;
    } catch (err) {
      console.log(err);
    }
  }

  public async getAllPrMeta(): Promise<PullRequestMeta[]> {
    try {
      const { data } = await this.client.repos.getPullRequests({
        projectKey: this.projectName,
        repositorySlug: this.repoName,
        state: "open",
      });

      const prMeta: PullRequestMeta[] = data.values.map(
        ({
          id,
          title,
          author: {
            user: { emailAddress },
          },
          reviewers: rawReviewers,
          links: {
            self: [{ href }],
          },
        }) => {
          const reviewers: string[] = rawReviewers.map(
            ({ user: { emailAddress } }) => {
              return emailAddress;
            }
          );

          return {
            prId: id,
            prTitle: title,
            prLink: href,
            authorId: emailAddress,
            reviewerIds: reviewers,
          };
        }
      );
      return prMeta;
    } catch (err) {
      console.log(err);
    }
  }

  public async getPrActivities(
    prId: number,
    reviewerIds: string[]
  ): Promise<PullRequestActivity[]> {
    try {
      const {
        data: { values },
      } = await this.client.pullRequests.getActivities({
        projectKey: this.projectName,
        repositorySlug: this.repoName,
        pullRequestId: prId,
      });
      const activities: PullRequestActivity[] = values.reduce(
        (
          acc: PullRequestActivity[],
          { action, user: { emailAddress }, createdDate, comment }
        ) => {
          let item;
          switch (action) {
            case ReviewAction.APPROVED:
            case ReviewAction.UNAPPROVED:
              item = { action, reviewerId: emailAddress, createdDate };
              break;
            case ReviewAction.COMMENTED:
              item = {
                action,
                commenterId: emailAddress,
                text: comment.text,
                createdDate,
              };
              break;
            case ReviewAction.OPENED:
              item = { action, reviewerIds, createdDate };
              break;
            default:
              return acc;
          }
          acc.push(item);
          return acc;
        },
        []
      );
      return activities;
    } catch (err) {
      console.log(err);
    }
  }
}

export default BitbucketHelper;
