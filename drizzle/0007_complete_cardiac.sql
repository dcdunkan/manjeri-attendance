CREATE TYPE "public"."device_types" AS ENUM('laptop', 'mobile', 'unknown');--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "device_type" "device_types" DEFAULT 'unknown' NOT NULL;