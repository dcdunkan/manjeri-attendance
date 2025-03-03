ALTER TABLE "sessions" ADD COLUMN "device_info" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_active" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "is_representative";--> statement-breakpoint
ALTER TABLE "absentees" ADD CONSTRAINT "absentee" UNIQUE("period_id","student_id","subject_id");--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollment" UNIQUE("student_id","subject_id");--> statement-breakpoint
ALTER TABLE "representatives" ADD CONSTRAINT "representative" UNIQUE("student_id","subject_id");--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "unique_student_roll" UNIQUE("batch_id","roll_number");--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "batch_subject" UNIQUE("batch_id","name");