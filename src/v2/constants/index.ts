export const PR_REVIEW_STATUS = "PR REVIEW STATUS";
export const PR_COMMENT = "PR COMMENT";
export const PR_REVIEW_REQUEST = "PR REVIEW REQUEST";

interface BuildMessage {
  messageTitle: string;
  prTitle: string;
  repoName: string;
  projectName: string;
  mainMessage: string;
  by: string;
  link: string;
}

export const buildMessage = ({
  messageTitle,
  prTitle,
  repoName,
  projectName,
  mainMessage,
  by,
  link,
}: BuildMessage): string => {
  const message = `*${messageTitle}*
><${link}|${prTitle}>
>${projectName} – ${repoName}
>${mainMessage.replace("\n", "\n>")}
>
>By: <@${by}>`;
  return message;
};

export const ignoreComments = [
  /Please ensure the following tasks are completed before merging/,
];
