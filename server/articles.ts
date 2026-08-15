import { and, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import {
  debugArticleTags,
  debugArticles,
  debugComments,
  debugTags,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";

export const LANGUAGES = ["Java", "Kotlin", "TypeScript", "JavaScript", "Python", "SQL", "Bash", "Other"] as const;
export const CATEGORIES = ["Runtime", "Data", "Concurrency", "API", "Security", "Performance", "Testing", "Infrastructure"] as const;

export type ArticleFilters = {
  query?: string;
  tag?: string;
  category?: string;
  language?: string;
  limit?: number;
};

export type ArticleDraft = {
  title: string;
  content: string;
  codeSnippet?: string | null;
  language: string;
  category: string;
  status: "draft" | "published";
  tags: string[];
};

function normalizeTags(tags: string[]) {
  return Array.from(new Set(tags.map(tag => tag.trim().toLowerCase()).filter(Boolean))).slice(0, 12);
}

function collapseRows<T extends { id: number }>(rows: Array<{ article: T; tagName: string | null }>) {
  const byId = new Map<number, T & { tags: string[] }>();
  for (const row of rows) {
    const current = byId.get(row.article.id) ?? { ...row.article, tags: [] };
    if (row.tagName) current.tags.push(row.tagName);
    byId.set(row.article.id, current);
  }
  return Array.from(byId.values());
}

async function syncTags(articleId: number, tagNames: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(debugArticleTags).where(eq(debugArticleTags.articleId, articleId));

  for (const name of normalizeTags(tagNames)) {
    await db.insert(debugTags).values({ name }).onDuplicateKeyUpdate({ set: { name } });
    const tag = await db.select({ id: debugTags.id }).from(debugTags).where(eq(debugTags.name, name)).limit(1);
    if (tag[0]) {
      await db.insert(debugArticleTags).values({ articleId, tagId: tag[0].id }).onDuplicateKeyUpdate({
        set: { tagId: tag[0].id },
      });
    }
  }
}

export async function listArticles(filters: ArticleFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const conditions = [];
  const query = filters.query?.trim();

  if (query) {
    const term = `%${query}%`;
    const matchingTaggedArticles = db
      .select({ articleId: debugArticleTags.articleId })
      .from(debugArticleTags)
      .innerJoin(debugTags, eq(debugArticleTags.tagId, debugTags.id))
      .where(like(debugTags.name, term));
    conditions.push(or(
      like(debugArticles.title, term),
      like(debugArticles.content, term),
      like(debugArticles.codeSnippet, term),
      inArray(debugArticles.id, matchingTaggedArticles),
    ));
  }
  if (filters.category) conditions.push(eq(debugArticles.category, filters.category));
  if (filters.language) conditions.push(eq(debugArticles.language, filters.language));
  if (filters.tag) {
    const matchingArticles = db
      .select({ articleId: debugArticleTags.articleId })
      .from(debugArticleTags)
      .innerJoin(debugTags, eq(debugArticleTags.tagId, debugTags.id))
      .where(eq(debugTags.name, filters.tag.trim().toLowerCase()));
    conditions.push(inArray(debugArticles.id, matchingArticles));
  }

  const rows = await db
    .select({ article: debugArticles, tagName: debugTags.name })
    .from(debugArticles)
    .leftJoin(debugArticleTags, eq(debugArticles.id, debugArticleTags.articleId))
    .leftJoin(debugTags, eq(debugArticleTags.tagId, debugTags.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(debugArticles.updatedAt))
    .limit(Math.min(Math.max(filters.limit ?? 30, 1), 100));

  return collapseRows(rows);
}

export async function getArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const rows = await db
    .select({ article: debugArticles, tagName: debugTags.name })
    .from(debugArticles)
    .leftJoin(debugArticleTags, eq(debugArticles.id, debugArticleTags.articleId))
    .leftJoin(debugTags, eq(debugArticleTags.tagId, debugTags.id))
    .where(eq(debugArticles.id, id));
  return collapseRows(rows)[0] ?? null;
}

export async function createArticle(authorId: number, draft: ArticleDraft) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const inserted = await db.insert(debugArticles).values({
    authorId,
    title: draft.title.trim(),
    content: draft.content.trim(),
    codeSnippet: draft.codeSnippet?.trim() || null,
    language: draft.language,
    category: draft.category,
    status: draft.status,
  });
  const articleId = Number(inserted[0].insertId);
  await syncTags(articleId, draft.tags);
  return getArticle(articleId);
}

export async function updateArticle(id: number, draft: ArticleDraft) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(debugArticles).set({
    title: draft.title.trim(),
    content: draft.content.trim(),
    codeSnippet: draft.codeSnippet?.trim() || null,
    language: draft.language,
    category: draft.category,
    status: draft.status,
  }).where(eq(debugArticles.id, id));
  await syncTags(id, draft.tags);
  return getArticle(id);
}

export async function removeArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(debugArticles).where(eq(debugArticles.id, id));
}

export async function listComments(articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db
    .select({
      id: debugComments.id,
      articleId: debugComments.articleId,
      authorId: debugComments.authorId,
      content: debugComments.content,
      createdAt: debugComments.createdAt,
      updatedAt: debugComments.updatedAt,
      authorName: users.name,
    })
    .from(debugComments)
    .leftJoin(users, eq(debugComments.authorId, users.id))
    .where(eq(debugComments.articleId, articleId))
    .orderBy(desc(debugComments.createdAt));
}

export async function createComment(articleId: number, authorId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(debugComments).values({ articleId, authorId, content: content.trim() });
}

export async function getDashboardOverview() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [recentArticles, categoryBreakdown, popularTags, totalArticles] = await Promise.all([
    listArticles({ limit: 5 }),
    db.select({ name: debugArticles.category, value: count() }).from(debugArticles).groupBy(debugArticles.category).orderBy(desc(count())),
    db
      .select({ name: debugTags.name, value: count(debugArticleTags.articleId) })
      .from(debugTags)
      .innerJoin(debugArticleTags, eq(debugTags.id, debugArticleTags.tagId))
      .groupBy(debugTags.id, debugTags.name)
      .orderBy(desc(count(debugArticleTags.articleId)))
      .limit(8),
    db.select({ value: count() }).from(debugArticles),
  ]);

  return {
    recentArticles,
    categoryBreakdown: categoryBreakdown.map(item => ({ ...item, value: Number(item.value) })),
    popularTags: popularTags.map(item => ({ ...item, value: Number(item.value) })),
    totalArticles: Number(totalArticles[0]?.value ?? 0),
  };
}

export async function getTagOptions() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const rows = await db.select({ name: debugTags.name }).from(debugTags).orderBy(debugTags.name);
  return rows.map(row => row.name);
}
