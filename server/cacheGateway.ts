import type { DebugArticle } from "../drizzle/schema";

type CachedArticle = DebugArticle & { tags: string[] };

export type RedisStatus = {
  connected: boolean;
  articleEntries: number;
  sessionEntries: number;
  provider: "spring-boot-lettuce" | "unavailable";
  checkedAt: string;
  message?: string;
};

const serviceUrl = (process.env.REDIS_SERVICE_URL ?? (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8081" : undefined))?.replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!serviceUrl) return null;
  try {
    const response = await fetch(`${serviceUrl}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

function reviveArticle(article: CachedArticle): CachedArticle {
  return {
    ...article,
    createdAt: new Date(article.createdAt),
    updatedAt: new Date(article.updatedAt),
  };
}

export async function getCachedArticle(articleId: number) {
  const article = await request<CachedArticle>(`/internal/cache/articles/${articleId}`);
  return article ? reviveArticle(article) : null;
}

export async function cacheArticle(article: CachedArticle) {
  await request(`/internal/cache/articles/${article.id}`, {
    method: "PUT",
    body: JSON.stringify(article),
  });
}

export async function evictArticle(articleId: number) {
  await request(`/internal/cache/articles/${articleId}`, { method: "DELETE" });
}

export async function getRedisStatus(): Promise<RedisStatus> {
  const status = await request<RedisStatus>("/internal/cache/status");
  return status ?? {
    connected: false,
    articleEntries: 0,
    sessionEntries: 0,
    provider: "unavailable",
    checkedAt: new Date().toISOString(),
    message: serviceUrl ? "Spring Boot cache service is unreachable." : "REDIS_SERVICE_URL is not configured.",
  };
}

export async function flushRedisArticleCache() {
  const result = await request<{ deleted: number; status: RedisStatus }>("/internal/cache/flush", { method: "POST" });
  if (!result) throw new Error("Redis cache service is unavailable.");
  return result;
}
