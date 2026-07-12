import { z } from "zod";

const baseSchema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(10).max(500),
  owner: z.string().trim().min(2).max(80),
  environment: z.string().trim().min(2).max(40),
  repository: z.string().trim().min(3).max(200),
  branch: z.string().trim().min(1).max(160),
  commitSha: z.string().trim().min(7).max(40),
  prUrl: z.string().trim().max(500).optional().default(""),
  linearUrl: z.string().trim().max(500).optional().default(""),
  previewUrl: z.string().trim().max(500).optional().default(""),
  changedFiles: z.string().trim().min(1).max(20_000),
});

export type ReleaseInput = {
  title: string;
  summary: string;
  owner: string;
  environment: string;
  repository: string;
  branch: string;
  commitSha: string;
  prUrl?: string;
  linearUrl?: string;
  previewUrl?: string;
  changedFiles: string[];
};

export type ReleaseInputResult =
  | { success: true; data: ReleaseInput }
  | { success: false; error: string };

function normalizeRepository(value: string) {
  return value
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
}

function parseUrl(value: string, label: string) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { error: `${label} must use HTTP or HTTPS.` } as const;
    }
    return { url: parsed } as const;
  } catch {
    return { error: `${label} must be a valid URL.` } as const;
  }
}

function normalizeChangedFiles(value: string) {
  const files = value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim().replace(/\\/g, "/").replace(/^\.\//, ""))
    .filter(Boolean);
  const unique = [...new Set(files)];
  if (unique.length === 0) return { error: "Add at least one changed file." } as const;
  if (unique.length > 200) {
    return { error: "A release can include at most 200 changed files." } as const;
  }
  const invalid = unique.find(
    (file) =>
      file.length > 300 ||
      file.startsWith("/") ||
      /^[a-zA-Z]:\//.test(file) ||
      file.split("/").includes(".."),
  );
  if (invalid) {
    return {
      error: `Changed file paths must be repository-relative. Check “${invalid}”.`,
    } as const;
  }
  return { files: unique } as const;
}

function repositoryFromPullRequest(url: URL) {
  const match = url.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/i);
  return match ? `${match[1]}/${match[2]}` : null;
}

export function parseReleaseInput(raw: unknown): ReleaseInputResult {
  const parsed = baseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid release candidate.",
    };
  }

  const repository = normalizeRepository(parsed.data.repository);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    return {
      success: false,
      error: "Repository must use the GitHub owner/repository format.",
    };
  }
  if (!/^[a-fA-F0-9]{7,40}$/.test(parsed.data.commitSha)) {
    return {
      success: false,
      error: "Commit SHA must contain 7–40 hexadecimal characters.",
    };
  }
  if (
    /\s/.test(parsed.data.branch) ||
    parsed.data.branch.includes("..") ||
    parsed.data.branch.startsWith("/") ||
    parsed.data.branch.endsWith("/")
  ) {
    return {
      success: false,
      error: "Branch must be a repository branch name without spaces or traversal segments.",
    };
  }

  const pr = parseUrl(parsed.data.prUrl, "PR URL");
  if (pr && "error" in pr) return { success: false, error: pr.error };
  if (pr) {
    if (pr.url.hostname.toLowerCase() !== "github.com") {
      return { success: false, error: "PR URL must point to github.com." };
    }
    const prRepository = repositoryFromPullRequest(pr.url);
    if (!prRepository) {
      return {
        success: false,
        error: "PR URL must point to a GitHub pull request.",
      };
    }
    if (prRepository.toLowerCase() !== repository.toLowerCase()) {
      return {
        success: false,
        error: "PR URL must belong to the release repository.",
      };
    }
  }

  const linear = parseUrl(parsed.data.linearUrl, "Linear URL");
  if (linear && "error" in linear) return { success: false, error: linear.error };
  if (
    linear &&
    (linear.url.hostname.toLowerCase() !== "linear.app" ||
      !/\/issue\/[^/]+/i.test(linear.url.pathname))
  ) {
    return {
      success: false,
      error: "Linear URL must point to a Linear issue.",
    };
  }

  const preview = parseUrl(parsed.data.previewUrl, "Preview URL");
  if (preview && "error" in preview) {
    return { success: false, error: preview.error };
  }

  const changedFiles = normalizeChangedFiles(parsed.data.changedFiles);
  if ("error" in changedFiles) {
    return { success: false, error: changedFiles.error };
  }

  return {
    success: true,
    data: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      owner: parsed.data.owner,
      environment: parsed.data.environment,
      repository,
      branch: parsed.data.branch,
      commitSha: parsed.data.commitSha.toLowerCase(),
      prUrl: pr?.url.toString(),
      linearUrl: linear?.url.toString(),
      previewUrl: preview?.url.toString(),
      changedFiles: changedFiles.files,
    },
  };
}
