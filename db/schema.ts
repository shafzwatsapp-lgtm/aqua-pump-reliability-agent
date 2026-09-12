// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const caseEvents=sqliteTable('case_events',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),scenario:text('scenario').notNull(),kind:text('kind').notNull(),body:text('body').notNull(),created:text('created').notNull(),
},t=>[index('case_events_owner_scenario').on(t.owner,t.scenario)]);
