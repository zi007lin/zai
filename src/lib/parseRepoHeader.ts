// Non-greedy `.*?` skips any formatting (backticks, whitespace) between the
// **Repo:** marker and the owner/repo token. Owner/repo character class
// matches GitHub's allowed chars; first match in the body wins.
const REPO_HEADER_REGEX = /\*\*Repo:\*\*.*?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/;

export function parseRepoHeader(markdown: string): string | null {
  if (!markdown) return null;
  const match = markdown.match(REPO_HEADER_REGEX);
  return match ? match[1] : null;
}
