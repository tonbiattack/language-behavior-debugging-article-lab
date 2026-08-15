import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing the authentication flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const debugArticles = mysqlTable(
  "debug_articles",
  {
    id: int("id").autoincrement().primaryKey(),
    authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 240 }).notNull(),
    content: text("content").notNull(),
    codeSnippet: text("codeSnippet"),
    language: varchar("language", { length: 64 }).notNull(),
    category: varchar("category", { length: 96 }).notNull(),
    status: mysqlEnum("status", ["draft", "published"]).default("published").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    authorIndex: index("debug_articles_author_idx").on(table.authorId),
    categoryLanguageIndex: index("debug_articles_category_language_idx").on(table.category, table.language),
    createdAtIndex: index("debug_articles_created_at_idx").on(table.createdAt),
  }),
);

export const debugTags = mysqlTable(
  "debug_tags",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({ nameIndex: uniqueIndex("debug_tags_name_idx").on(table.name) }),
);

export const debugArticleTags = mysqlTable(
  "debug_article_tags",
  {
    articleId: int("articleId").notNull().references(() => debugArticles.id, { onDelete: "cascade" }),
    tagId: int("tagId").notNull().references(() => debugTags.id, { onDelete: "cascade" }),
  },
  table => ({ pk: primaryKey({ columns: [table.articleId, table.tagId] }) }),
);

export const debugComments = mysqlTable(
  "debug_comments",
  {
    id: int("id").autoincrement().primaryKey(),
    articleId: int("articleId").notNull().references(() => debugArticles.id, { onDelete: "cascade" }),
    authorId: int("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    articleCreatedIndex: index("debug_comments_article_created_idx").on(table.articleId, table.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type DebugArticle = typeof debugArticles.$inferSelect;
export type InsertDebugArticle = typeof debugArticles.$inferInsert;
export type DebugComment = typeof debugComments.$inferSelect;
