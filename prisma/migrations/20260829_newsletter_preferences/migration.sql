ALTER TABLE "users" ADD COLUMN "newsletter_opt_in" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "newsletter_opt_in_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "newsletter_opt_out_at" TIMESTAMP(3);
