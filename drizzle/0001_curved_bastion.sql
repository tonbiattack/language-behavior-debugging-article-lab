CREATE TABLE `debug_article_tags` (
	`articleId` int NOT NULL,
	`tagId` int NOT NULL,
	CONSTRAINT `debug_article_tags_articleId_tagId_pk` PRIMARY KEY(`articleId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `debug_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`content` text NOT NULL,
	`codeSnippet` text,
	`language` varchar(64) NOT NULL,
	`category` varchar(96) NOT NULL,
	`status` enum('draft','published') NOT NULL DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debug_articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debug_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debug_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `debug_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `debug_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `debug_tags_name_idx` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `debug_article_tags` ADD CONSTRAINT `debug_article_tags_articleId_debug_articles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `debug_articles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debug_article_tags` ADD CONSTRAINT `debug_article_tags_tagId_debug_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `debug_tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debug_articles` ADD CONSTRAINT `debug_articles_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debug_comments` ADD CONSTRAINT `debug_comments_articleId_debug_articles_id_fk` FOREIGN KEY (`articleId`) REFERENCES `debug_articles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debug_comments` ADD CONSTRAINT `debug_comments_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `debug_articles_author_idx` ON `debug_articles` (`authorId`);--> statement-breakpoint
CREATE INDEX `debug_articles_category_language_idx` ON `debug_articles` (`category`,`language`);--> statement-breakpoint
CREATE INDEX `debug_articles_created_at_idx` ON `debug_articles` (`createdAt`);--> statement-breakpoint
CREATE INDEX `debug_comments_article_created_idx` ON `debug_comments` (`articleId`,`createdAt`);