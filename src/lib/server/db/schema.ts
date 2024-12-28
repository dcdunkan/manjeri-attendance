import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const accountRoleEnum = pgEnum("account_roles", ["administrator", "student"]);

export const accounts = pgTable(
	"accounts",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		login: text("login").unique().notNull(),
		passwordHash: text("password_hash").notNull(),
		role: accountRoleEnum("role")
			.$default(() => "student")
			.notNull(),
	},
	(table) => [uniqueIndex("account_idx").on(table.login)],
);

export const accountsRelations = relations(accounts, ({ one, many }) => ({
	// Single student details entry for a single account:
	student: one(students, { fields: [accounts.id], references: [students.id] }),
	// Multiple sessions can be
	sessions: many(sessions),
}));

// TODO: Limit the number of sessions that can be created for one account.
// Otherwise, it can be used to populate the database in unwanted forms.
export const sessions = pgTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id")
			.notNull()
			.references(() => accounts.id),
		expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),
	},
	(table) => [uniqueIndex("account_session_idx").on(table.accountId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
	// Multiple sessions can be linked to an account:
	account: one(accounts, { fields: [sessions.accountId], references: [accounts.id] }),
}));

export const students = pgTable("students", {
	id: integer("id").references(() => accounts.id),
	fullName: text("full_name").notNull(),
	batchId: text("batch_id")
		.notNull()
		.references(() => batches.id),
	isRep: boolean("is_representative").default(false).notNull(),
});

export const studentsRelations = relations(students, ({ one, many }) => ({
	// An account is linked with a single student. One-to-one.
	account: one(accounts, { fields: [students.id], references: [accounts.id] }),
	// A student can only be in one batch.
	batch: one(batches, { fields: [students.batchId], references: [batches.id] }),
	// Can enroll to multiple subjects:
	subjects: many(subjects),
}));

export const batches = pgTable("batches", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: text("name").notNull(),
});

export const batchesRelations = relations(batches, ({ many }) => ({
	// A batch can have many students
	students: many(students),
	// it can also have many many subjects as well
	subjects: many(subjects),
}));

export const subjects = pgTable("subjects", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: text("name").notNull(),
	batchId: integer("batch_id")
		.notNull()
		.references(() => batches.id),
});

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
	// can be linked to a single batch
	batch: one(batches, { fields: [subjects.batchId], references: [batches.id] }),
	// can have many periods, enrollements and representatives
	periods: many(periods),
	enrollments: many(enrollments),
	representatives: many(representatives),
}));

export const enrollments = pgTable(
	"enrollments",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		subjectId: integer("subject_id")
			.notNull()
			.references(() => subjects.id),
		studentId: integer("student_id")
			.notNull()
			.references(() => students.id),
	},
	(table) => [
		index("subject_id_idx").on(table.subjectId),
		index("student_id_idx").on(table.studentId),
	],
);

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
	// A student is enrolled to a single subject.
	student: one(students, { fields: [enrollments.studentId], references: [students.id] }),
	subject: one(subjects, { fields: [enrollments.subjectId], references: [subjects.id] }),
}));

export const periods = pgTable(
	"periods",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		subjectId: integer("subject_id")
			.notNull()
			.references(() => subjects.id),
		date: date("date", { mode: "date" }).notNull(),
	},
	(table) => [index("subject_id_idx").on(table.subjectId)],
);

export const periodsRelations = relations(periods, ({ one, many }) => ({
	// A period is linked to a subject
	subject: one(subjects, { fields: [periods.subjectId], references: [subjects.id] }),
	// A period can have many, bruh, absentees
	absentees: many(absentees),
}));

export const absentees = pgTable("absentees", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	studentId: integer("student_id")
		.notNull()
		.references(() => students.id),
	periodId: integer("period_id")
		.notNull()
		.references(() => periods.id),
});

export const absenteesRelations = relations(absentees, ({ one }) => ({
	// An absentee is a student and they are absent in a period.
	student: one(students, { fields: [absentees.studentId], references: [students.id] }),
	period: one(periods, { fields: [absentees.periodId], references: [periods.id] }),
}));

export const representatives = pgTable("representatives", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	subjectId: integer("subject_id")
		.notNull()
		.references(() => subjects.id),
	studentId: integer("student_id")
		.notNull()
		.references(() => students.id),
});

export const representativesRelations = relations(representatives, ({ one }) => ({
	// A representative is a student for one subject.
	student: one(students, { fields: [representatives.studentId], references: [students.id] }),
	subject: one(subjects, { fields: [representatives.subjectId], references: [subjects.id] }),
}));

export type Account = typeof accounts.$inferSelect;

export type Session = typeof sessions.$inferSelect;

export type Student = typeof students.$inferSelect;

export type Batch = typeof batches.$inferSelect;

export type Subject = typeof subjects.$inferSelect;

export type Enrollment = typeof enrollments.$inferSelect;

export type Period = typeof periods.$inferSelect;

export type Absentee = typeof absentees.$inferSelect;

export type Representative = typeof representatives.$inferSelect;
