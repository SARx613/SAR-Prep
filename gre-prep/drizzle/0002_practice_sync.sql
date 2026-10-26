CREATE TABLE "attempt_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"qid" text NOT NULL,
	"lesson_id" text NOT NULL,
	"type" text NOT NULL,
	"difficulty" smallint NOT NULL,
	"correct" boolean NOT NULL,
	"ms" integer NOT NULL,
	"mode" text NOT NULL,
	"ts" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_state" (
	"user_id" text PRIMARY KEY NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempt_log" ADD CONSTRAINT "attempt_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_state" ADD CONSTRAINT "user_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_log_user_q_ts" ON "attempt_log" USING btree ("user_id","qid","ts");--> statement-breakpoint
CREATE INDEX "attempt_log_user_ts" ON "attempt_log" USING btree ("user_id","ts");