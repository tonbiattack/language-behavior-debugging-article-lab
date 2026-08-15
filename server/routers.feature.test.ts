import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const article = {
  id: 7,
  authorId: 1,
  title: "Redis timeout diagnosis",
  content: "Observe connection saturation before changing timeouts.",
  codeSnippet: "public class PoolConfig {}",
  language: "Java",
  category: "Performance",
  status: "published" as const,
  tags: ["redis", "lettuce"],
  createdAt: new Date("2026-08-15T00:00:00.000Z"),
  updatedAt: new Date("2026-08-15T00:00:00.000Z"),
};

const articleMocks = vi.hoisted(() => ({
  getCachedArticle: vi.fn(),
  cacheArticle: vi.fn(),
  evictArticle: vi.fn(),
  getRedisStatus: vi.fn(),
  flushRedisArticleCache: vi.fn(),
  getArticle: vi.fn(),
  createArticle: vi.fn(),
  listArticles: vi.fn(),
  updateArticle: vi.fn(),
  removeArticle: vi.fn(),
  listComments: vi.fn(),
  createComment: vi.fn(),
  getDashboardOverview: vi.fn(),
  getTagOptions: vi.fn(),
}));

vi.mock("./articles", () => ({
  LANGUAGES: ["Java"],
  CATEGORIES: ["Performance"],
  ...articleMocks,
}));
vi.mock("./cacheGateway", () => ({
  getCachedArticle: articleMocks.getCachedArticle,
  cacheArticle: articleMocks.cacheArticle,
  evictArticle: articleMocks.evictArticle,
  getRedisStatus: articleMocks.getRedisStatus,
  flushRedisArticleCache: articleMocks.flushRedisArticleCache,
}));

const { appRouter } = await import("./routers");

function context(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: { id: 1, openId: "test-user", name: "Test User", email: "test@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("article and cache routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    articleMocks.getCachedArticle.mockResolvedValue(null);
    articleMocks.getArticle.mockResolvedValue(article);
    articleMocks.createArticle.mockResolvedValue(article);
    articleMocks.getRedisStatus.mockResolvedValue({ connected: true, articleEntries: 2, sessionEntries: 1, provider: "spring-boot-lettuce", checkedAt: new Date().toISOString() });
    articleMocks.flushRedisArticleCache.mockResolvedValue({ deleted: 2, status: { connected: true } });
  });

  it("returns a cached article before consulting the article store", async () => {
    articleMocks.getCachedArticle.mockResolvedValue(article);
    const result = await appRouter.createCaller(context()).articles.get({ id: 7 });
    expect(result?.title).toBe("Redis timeout diagnosis");
    expect(articleMocks.getArticle).not.toHaveBeenCalled();
  });

  it("creates an article and populates the cache", async () => {
    await appRouter.createCaller(context()).articles.create({ title: article.title, content: article.content, codeSnippet: article.codeSnippet, language: article.language, category: article.category, status: "published", tags: article.tags });
    expect(articleMocks.createArticle).toHaveBeenCalledWith(1, expect.objectContaining({ title: article.title }));
    expect(articleMocks.cacheArticle).toHaveBeenCalledWith(article);
  });

  it("allows only an administrator to flush the Redis article cache", async () => {
    const adminResult = await appRouter.createCaller(context("admin")).cache.flush();
    expect(adminResult.deleted).toBe(2);
    await expect(appRouter.createCaller(context()).cache.flush()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("exposes Spring Boot Redis telemetry through the cache status route", async () => {
    const result = await appRouter.createCaller(context()).cache.status();
    expect(result).toMatchObject({ connected: true, provider: "spring-boot-lettuce" });
  });
});
