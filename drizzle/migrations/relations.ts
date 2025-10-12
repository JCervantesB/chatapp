import { relations } from "drizzle-orm/relations";
import { agents, chatMessages, user, account, session } from "./schema";

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	agent: one(agents, {
		fields: [chatMessages.agentId],
		references: [agents.id]
	}),
}));

export const agentsRelations = relations(agents, ({many}) => ({
	chatMessages: many(chatMessages),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));