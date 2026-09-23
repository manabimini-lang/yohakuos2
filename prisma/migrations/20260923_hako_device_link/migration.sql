CREATE TABLE "hako_link_codes" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hako_link_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hako_devices" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "display_name" TEXT NOT NULL DEFAULT 'わたしのHAKO',
  "token_hash" TEXT NOT NULL,
  "scopes" JSONB NOT NULL DEFAULT '{}',
  "last_seen_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hako_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hako_link_codes_code_hash_key" ON "hako_link_codes"("code_hash");
CREATE INDEX "hako_link_codes_user_id_expires_at_idx" ON "hako_link_codes"("user_id", "expires_at");
CREATE UNIQUE INDEX "hako_devices_token_hash_key" ON "hako_devices"("token_hash");
CREATE INDEX "hako_devices_user_id_idx" ON "hako_devices"("user_id");

ALTER TABLE "hako_link_codes" ADD CONSTRAINT "hako_link_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hako_devices" ADD CONSTRAINT "hako_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
