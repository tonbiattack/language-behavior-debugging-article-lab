import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as articles from "./articles";
import * as cacheGateway from "./cacheGateway";

const draftInput = z.object({
  title: z.string().trim().min(3).max(240),
  content: z.string().trim().min(1).max(60000),
  codeSnippet: z.string().max(60000).optional().nullable(),
  language: z.string().min(1).max(64),
  category: z.string().min(1).max(96),
  status: z.enum(["draft", "published"]).default("published"),
  tags: z.array(z.string().trim().min(1).max(80)).max(12),
});

async function assertArticleAccess(articleId: number, user: { id: number; role: "user" | "admin" }) {
  const article = await articles.getArticle(articleId);
  if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "記事が見つかりません。" });
  if (article.authorId !== user.id && user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "この記事を変更する権限がありません。" });
  }
  return article;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    options: publicProcedure.query(async () => ({
      languages: articles.LANGUAGES,
      categories: articles.CATEGORIES,
      tags: await articles.getTagOptions(),
    })),
  }),
  articles: router({
    list: publicProcedure.input(z.object({
      query: z.string().max(160).optional(),
      tag: z.string().max(80).optional(),
      category: z.string().max(96).optional(),
      language: z.string().max(64).optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }).optional()).query(({ input }) => articles.listArticles(input)),
    get: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const cached = await cacheGateway.getCachedArticle(input.id);
      if (cached) return cached;
      const article = await articles.getArticle(input.id);
      if (article) await cacheGateway.cacheArticle(article);
      return article;
    }),
    create: protectedProcedure.input(draftInput).mutation(async ({ ctx, input }) => {
      const article = await articles.createArticle(ctx.user.id, input);
      if (article) await cacheGateway.cacheArticle(article);
      return article;
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), draft: draftInput })).mutation(async ({ ctx, input }) => {
      await assertArticleAccess(input.id, ctx.user);
      const article = await articles.updateArticle(input.id, input.draft);
      if (article) await cacheGateway.cacheArticle(article);
      return article;
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await assertArticleAccess(input.id, ctx.user);
      await articles.removeArticle(input.id);
      await cacheGateway.evictArticle(input.id);
      return { success: true } as const;
    }),
  }),
  comments: router({
    list: publicProcedure.input(z.object({ articleId: z.number().int().positive() })).query(({ input }) => articles.listComments(input.articleId)),
    create: protectedProcedure.input(z.object({ articleId: z.number().int().positive(), content: z.string().trim().min(1).max(6000) }))
      .mutation(async ({ ctx, input }) => {
        const article = await articles.getArticle(input.articleId);
        if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "記事が見つかりません。" });
        await articles.createComment(input.articleId, ctx.user.id, input.content);
        return { success: true } as const;
      }),
  }),
  dashboard: router({
    overview: publicProcedure.query(() => articles.getDashboardOverview()),
  }),
  cache: router({
    status: publicProcedure.query(() => cacheGateway.getRedisStatus()),
    flush: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "キャッシュ管理は管理者に限定されています。" });
      return cacheGateway.flushRedisArticleCache();
    }),
  }),
});

export type AppRouter = typeof appRouter;
