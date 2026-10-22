import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/github";
export const REPO = "minhohuengmin1010-hue/vortex-main-web-1";

async function gh(path: string) {
  const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
  const GITHUB_API_KEY = process.env["GITHUB_API_KEY"];
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!GITHUB_API_KEY) throw new Error("GITHUB_API_KEY is not configured");
  const res = await fetch(`${GATEWAY_URL}/${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GITHUB_API_KEY,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`GitHub request failed [${res.status}]: ${body}`);
    throw new Error(`GitHub request failed [${res.status}]`);
  }
  return res.json();
}

export type RepoSummary = {
  name: string;
  url: string;
  stars: number;
  forks: number;
  issues: number;
  branch: string;
  pushedAt: string;
  language: string | null;
  sizeKb: number;
  commits: { sha: string; message: string; author: string; date: string; url: string }[];
};

export const getRepoSummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<RepoSummary> => {
    const [repo, commits] = await Promise.all([
      gh(`repos/${REPO}`),
      gh(`repos/${REPO}/commits?per_page=8`).catch(() => []),
    ]);
    return {
      name: repo.name,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      issues: repo.open_issues_count,
      branch: repo.default_branch,
      pushedAt: repo.pushed_at,
      language: repo.language,
      sizeKb: repo.size,
      commits: (Array.isArray(commits) ? commits : []).map((c: any) => ({
        sha: String(c.sha).slice(0, 7),
        message: String(c.commit?.message ?? "").split("\n")[0] ?? "",
        author: c.commit?.author?.name ?? "unknown",
        date: c.commit?.author?.date ?? "",
        url: c.html_url,
      })),
    };
  },
);
