import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const accountRoleEnum = pgEnum("account_roles", ["administrator", "student"]);

export type AccountRole = (typeof accountRoleEnum.enumValues)[number];

export const accounts = pgTable(
	"accounts",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity({ startWith: 1000 }),
		login: text("login").unique().notNull(),
		passwordHash: text("password_hash").notNull(),
		role: accountRoleEnum("role").notNull(),
	},
	(table) => [uniqueIndex("login_idx").on(table.login)],
);

export const accountsRelations = relations(accounts, ({ one, many }) => ({
	// Single student details entry for a single account:
	student: one(students, {
		fields: [accounts.id],
		references: [students.id],
		relationName: "account_student",
	}),
	// Multiple sessions can be linked to an account:
	sessions: many(sessions, { relationName: "account_sessions" }),
}));

// TODO: Limit the number of sessions that can be created for one account.
// Otherwise, it can be used to populate the database in unwanted ways.
export const sessions = pgTable("sessions", {
	id: text("id").primaryKey(),
	accountId: integer("account_id")
		.notNull()
		.references(() => accounts.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }).notNull(),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
	// Multiple sessions can be linked to an account:
	account: one(accounts, {
		fields: [sessions.accountId],
		references: [accounts.id],
		relationName: "account_sessions",
	}),
}));

export const batches = pgTable("batches", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: text("name").notNull().unique(),
});

export const batchesRelations = relations(batches, ({ many }) => ({
	// A batch can have many students
	students: many(students, { relationName: "batch_students" }),
	// it can also have many many subjects as well
	subjects: many(subjects, { relationName: "batch_subjects" }),
}));

export const students = pgTable("students", {
	id: integer("id")
		.primaryKey()
		.references(() => accounts.id, { onDelete: "cascade" }),
	fullName: text("full_name").notNull(),
	rollNumber: integer("roll_number").notNull(),
	batchId: integer("batch_id")
		.notNull()
		.references(() => batches.id, { onDelete: "cascade" }),
	// POSSIBLY REMOVE THIS? COUNT REPRESENTATIONS INSTEAD.
	isRep: boolean("is_representative").default(false).notNull(),
});

export const studentsRelations = relations(students, ({ one, many }) => ({
	// An account is linked with a single student. One-to-one.
	account: one(accounts, {
		fields: [students.id],
		references: [accounts.id],
		relationName: "account_student",
	}),
	// A student can only be in one batch.
	batch: one(batches, {
		fields: [students.batchId],
		references: [batches.id],
		relationName: "batch_students",
	}),
	// Can enroll to multiple subjects:
	enrollments: many(enrollments, { relationName: "student_enrollments" }),
	// can be absent from multiple periods:
	absents: many(absentees, { relationName: "student_absents" }),
	// or be the representative to many subjects:
	representations: many(representatives, { relationName: "student_representations" }),
}));

export const subjects = pgTable("subjects", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	name: text("name").notNull(),
	batchId: integer("batch_id")
		.notNull()
		.references(() => batches.id, { onDelete: "cascade" }),
});

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
	// can be linked to a single batch
	batch: one(batches, {
		fields: [subjects.batchId],
		references: [batches.id],
		relationName: "batch_subjects",
	}),
	// can have many periods, enrollements and representatives
	periods: many(periods, { relationName: "subject_periods" }),
	enrollments: many(enrollments, { relationName: "subject_enrollments" }),
	representatives: many(representatives, { relationName: "subject_representatives" }),
	absents: many(absentees, { relationName: "subject_absents" }),
}));

export const enrollments = pgTable("enrollments", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	subjectId: integer("subject_id")
		.notNull()
		.references(() => subjects.id, { onDelete: "cascade" }),
	studentId: integer("student_id")
		.notNull()
		.references(() => students.id, { onDelete: "cascade" }),
});

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
	// A student is enrolled to a single subject.
	student: one(students, {
		fields: [enrollments.studentId],
		references: [students.id],
		relationName: "student_enrollments",
	}),
	subject: one(subjects, {
		fields: [enrollments.subjectId],
		references: [subjects.id],
		relationName: "subject_enrollments",
	}),
}));

export const periods = pgTable("periods", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	subjectId: integer("subject_id")
		.notNull()
		.references(() => subjects.id, { onDelete: "cascade" }),
	date: date("date", { mode: "date" }).notNull(),
});

export const periodsRelations = relations(periods, ({ one, many }) => ({
	// A period is linked to a subject
	subject: one(subjects, {
		fields: [periods.subjectId],
		references: [subjects.id],
		relationName: "subject_periods",
	}),
	// A period can have many, bruh, absentees
	absentees: many(absentees, { relationName: "period_absentees" }),
}));

export const absentees = pgTable("absentees", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	studentId: integer("student_id")
		.notNull()
		.references(() => students.id, { onDelete: "cascade" }),
	subjectId: integer("subject_id")
		.notNull()
		.references(() => subjects.id, { onDelete: "cascade" }),
	periodId: integer("period_id")
		.notNull()
		.references(() => periods.id, { onDelete: "cascade" }),
});

export const absenteesRelations = relations(absentees, ({ one }) => ({
	// An absentee is a student and they are absent in a period.
	student: one(students, {
		fields: [absentees.studentId],
		references: [students.id],
		relationName: "student_absents",
	}),
	period: one(periods, {
		fields: [absentees.periodId],
		references: [periods.id],
		relationName: "period_absentees",
	}),
	subject: one(subjects, {
		fields: [absentees.subjectId],
		references: [subjects.id],
		relationName: "subject_absents",
	}),
}));

export const representatives = pgTable("representatives", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
	subjectId: integer("subject_id")
		.notNull()
		.references(() => subjects.id, { onDelete: "cascade" }),
	studentId: integer("student_id")
		.notNull()
		.references(() => students.id, { onDelete: "cascade" }),
});

export const representativesRelations = relations(representatives, ({ one }) => ({
	// A representative is a student for one subject.
	student: one(students, {
		fields: [representatives.studentId],
		references: [students.id],
		relationName: "student_representations",
	}),
	subject: one(subjects, {
		fields: [representatives.subjectId],
		references: [subjects.id],
		relationName: "subject_representatives",
	}),
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
