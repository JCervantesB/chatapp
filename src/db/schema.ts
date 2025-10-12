import { pgTable, text, timestamp, boolean, unique, foreignKey } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Better Auth default-compatible schema for Postgres
export const users = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("user").notNull(),
  banned: boolean("banned").default(false).notNull(),
  createdAt: timestamp("createdAt", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  unique("user_email_key").on(table.email),
]);

export const sessions = pgTable("session", {
  id: text("id").primaryKey().notNull(),
  expiresAt: timestamp("expiresAt", { mode: "string" }).notNull(),
  token: text("token").notNull(),
  createdAt: timestamp("createdAt", { mode: "string" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "string" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull(),
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "session_userId_fkey",
  }).onDelete("cascade"),
  unique("session_token_key").on(table.token),
]);

export const accounts = pgTable("account", {
  id: text("id").primaryKey().notNull(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "string" }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { mode: "string" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { mode: "string" }).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "string" }).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "account_userId_fkey",
  }).onDelete("cascade"),
]);

export const verifications = pgTable("verification", {
  id: text("id").primaryKey().notNull(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "string" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

// Application-specific tables
export const agents = pgTable("agents", {
  id: text("id").primaryKey().notNull().default(sql`gen_random_uuid()::text`),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("systemPrompt").notNull(),
  role: text("role"),
  tone: text("tone"),
  scenario: text("scenario"),
  enhancers: text("enhancers"),
  imageStyle: text("imageStyle"),
  // URL de la imagen/avatar del agente en Cloudinary
  photoUrl: text("photoUrl"),
  // Prompt maestro para la generación de imagen del agente
  imagePromptMaster: text("imagePromptMaster"),
  // Historia inicial para arrancar la narrativa del agente
  initialStory: text("initialStory"),
  // Primer mensaje: escena inicial y primera frase del personaje
  firstMessage: text("firstMessage"),
  // Apariencia del personaje (prompt descriptivo)
  appearancePrompt: text("appearancePrompt"),
  // Género del personaje: 'male' | 'female' | 'other'
  gender: text("gender"),
  // Personaje opcional seleccionado desde la lista (nombre)
  characterName: text("characterName"),
  createdAt: timestamp("createdAt", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updatedAt", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey().notNull().default(sql`gen_random_uuid()::text`),
  content: text("content").notNull(),
  role: text("role").notNull(),
  agentId: text("agentId").notNull(),
  createdAt: timestamp("createdAt", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.agentId],
    foreignColumns: [agents.id],
    name: "chat_messages_agentId_fkey",
  }).onDelete("cascade"),
]);

export const agentsRelations = relations(agents, ({ many }) => ({
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  agent: one(agents, {
    fields: [chatMessages.agentId],
    references: [agents.id],
  }),
}));