/**
 * ANGEL AI — GitHub Integration Service (Server-Side)
 * Real operations:
 * - Repository inspection & metadata
 * - Branch awareness
 * - File tree & content inspection
 * - Issues & Pull Request workflows
 * - Token authorization & rate-limit handling
 * Strictly server-side: Tokens are never sent to the browser client.
 */

export interface GitHubRepoDetails {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  defaultBranch: string;
  openIssuesCount: number;
  isPrivate: boolean;
  htmlUrl: string;
  updatedAt: string;
}

export interface GitHubBranch {
  name: string;
  commitSha: string;
  isDefault: boolean;
}

export interface GitHubFileItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  body: string;
  author: string;
  labels: string[];
  htmlUrl: string;
  createdAt: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  author: string;
  branch: string;
  baseBranch: string;
  htmlUrl: string;
  createdAt: string;
}

class GitHubService {
  private getToken(): string | undefined {
    return process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  }

  isConfigured(): boolean {
    const token = this.getToken();
    return Boolean(token && token.length > 5);
  }

  private getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Angel-AI-Workspace/1.0',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async testConnection(): Promise<{ success: boolean; username?: string; rateLimitRemaining?: number; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'GITHUB_TOKEN is not configured in server environment secrets.',
      };
    }

    try {
      const res = await fetch('https://api.github.com/user', {
        headers: this.getHeaders(),
      });

      const remaining = res.headers.get('x-ratelimit-remaining');
      const rateLimitRemaining = remaining ? parseInt(remaining, 10) : undefined;

      if (!res.ok) {
        return {
          success: false,
          rateLimitRemaining,
          message: `GitHub authentication failed (${res.status}): ${await res.text()}`,
        };
      }

      const user = await res.json();
      return {
        success: true,
        username: user.login,
        rateLimitRemaining,
        message: `Successfully connected to GitHub as @${user.login}`,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async getRepoDetails(owner: string, repo: string): Promise<GitHubRepoDetails> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch repo ${owner}/${repo} (${res.status})`);
    }

    const d = await res.json();
    return {
      owner: d.owner?.login || owner,
      name: d.name,
      fullName: d.full_name,
      description: d.description || 'No description provided.',
      stars: d.stargazers_count || 0,
      forks: d.forks_count || 0,
      defaultBranch: d.default_branch || 'main',
      openIssuesCount: d.open_issues_count || 0,
      isPrivate: d.private,
      htmlUrl: d.html_url,
      updatedAt: d.updated_at,
    };
  }

  async listBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=30`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to list branches for ${owner}/${repo} (${res.status})`);
    }

    const branches = await res.json();
    return branches.map((b: any) => ({
      name: b.name,
      commitSha: b.commit?.sha || '',
      isDefault: b.name === 'main' || b.name === 'master',
    }));
  }

  async listFiles(owner: string, repo: string, path: string = '', branch?: string): Promise<GitHubFileItem[]> {
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
    if (branch) url.searchParams.set('ref', branch);

    const res = await fetch(url.toString(), {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to list contents for path '${path}' (${res.status})`);
    }

    const items = await res.json();
    if (!Array.isArray(items)) return [];

    return items.map((it: any) => ({
      name: it.name,
      path: it.path,
      type: it.type === 'dir' ? 'dir' : 'file',
      size: it.size,
      sha: it.sha,
    }));
  }

  async getFileContent(owner: string, repo: string, path: string, branch?: string): Promise<{ content: string; encoding: string }> {
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
    if (branch) url.searchParams.set('ref', branch);

    const res = await fetch(url.toString(), {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to get file ${path} (${res.status})`);
    }

    const d = await res.json();
    const rawBase64 = d.content || '';
    const cleanBase64 = rawBase64.replace(/\n/g, '');
    const decoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');

    return {
      content: decoded,
      encoding: 'utf-8',
    };
  }

  async listIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=20`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to list issues for ${owner}/${repo}`);
    }

    const issues = await res.json();
    return issues
      .filter((it: any) => !it.pull_request) // filter out pull requests
      .map((it: any) => ({
        id: it.id,
        number: it.number,
        title: it.title,
        state: it.state,
        body: it.body || '',
        author: it.user?.login || 'unknown',
        labels: (it.labels || []).map((l: any) => l.name),
        htmlUrl: it.html_url,
        createdAt: it.created_at,
      }));
  }

  async listPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubPullRequest[]> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=20`, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to list PRs for ${owner}/${repo}`);
    }

    const prs = await res.json();
    return prs.map((it: any) => ({
      id: it.id,
      number: it.number,
      title: it.title,
      state: it.state,
      author: it.user?.login || 'unknown',
      branch: it.head?.ref || '',
      baseBranch: it.base?.ref || '',
      htmlUrl: it.html_url,
      createdAt: it.created_at,
    }));
  }

  async createIssue(owner: string, repo: string, title: string, body: string): Promise<GitHubIssue> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create issue in ${owner}/${repo} (${res.status})`);
    }

    const it = await res.json();
    return {
      id: it.id,
      number: it.number,
      title: it.title,
      state: it.state,
      body: it.body || '',
      author: it.user?.login || 'unknown',
      labels: (it.labels || []).map((l: any) => l.name),
      htmlUrl: it.html_url,
      createdAt: it.created_at,
    };
  }
}

export const githubService = new GitHubService();
