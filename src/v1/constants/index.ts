export const PR_REVIEW_STATUS = "PR REVIEW STATUS";
export const PR_COMMENT = "PR COMMENT";
export const PR_REVIEW_REQUEST = "PR REVIEW REQUEST";

interface BuildMessage {
  messageTitle: string;
  prTitle: string;
  repoName: string;
  mainMessage?: string;
  by: string;
  link: string;
}

export const buildMessage = ({
  messageTitle,
  prTitle,
  repoName,
  mainMessage,
  by,
  link,
}: BuildMessage): string => {
  const message = `*${messageTitle}  (${repoName})*
${prTitle}${mainMessage ? `\n${mainMessage}` : ""}
By: @${by}


> Link: ${link}`;
  return message;
};
