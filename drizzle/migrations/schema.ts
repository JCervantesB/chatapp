import { pgTable, foreignKey, text, timestamp, unique, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const chatMessages = pgTable("chat_messages", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	content: text().notNull(),
	role: text().notNull(),
	agentId: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "chat_messages_agentId_fkey"
		}).onDelete("cascade"),
]);

export const agents = pgTable("agents", {
	id: text().default((gen_random_uuid())).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	systemPrompt: text().notNull(),
	role: text(),
	tone: text(),
	scenario: text(),
	enhancers: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	imageStyle: text(),
	initialStory: text(),
	photoUrl: text(),
	imagePromptMaster: text(),
	firstMessage: text(),
	appearancePrompt: text(),
	gender: text(),
	characterName: text(),
});

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: boolean().default(false).notNull(),
	image: text(),
	role: text().default('user').notNull(),
	banned: boolean().default(false).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("user_email_key").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_fkey"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	updatedAt: timestamp({ mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onDelete("cascade"),
	unique("session_token_key").on(table.token),
]);
