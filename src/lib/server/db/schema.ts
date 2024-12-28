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

export const students = pgTable("students", {
	id: integer("id").references(() => accounts.id),
	fullName: text("full_name").notNull(),
	batch: text("batch")
		.notNull()
		.references(() => batches.id),
	isRep: boolean("is_representative").default(false).notNull(),
});

export const batches = pgTable("batches", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: text("name").notNull(),
});

export const subjects = pgTable("subjects", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: text("name").notNull(),
	batchId: integer("batch_id")
		.notNull()
		.references(() => batches.id),
});

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

export const absentees = pgTable("absentees", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	studentId: integer("student_id")
		.notNull()
		.references(() => students.id),
	periodId: integer("period_id")
		.notNull()
		.references(() => periods.id),
});

export const representatives = pgTable("representatives", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	subjectId: integer("subject_id")
		.notNull()
		.references(() => subjects.id),
	studentId: integer("student_id")
		.notNull()
		.references(() => students.id),
});
