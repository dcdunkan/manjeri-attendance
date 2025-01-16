DROP INDEX "account_idx";--> statement-breakpoint
DROP INDEX "enrollment_subject_id_idx";--> statement-breakpoint
DROP INDEX "enrollment_student_id_idx";--> statement-breakpoint
DROP INDEX "period_subject_id_idx";--> statement-breakpoint
DROP INDEX "account_session_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "login_idx" ON "accounts" USING btree ("login");