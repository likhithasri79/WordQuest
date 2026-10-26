CREATE TYPE "public"."match_status" AS ENUM(
  'WAITING_FOR_PLAYERS',
  'AWAITING_SUBMISSIONS',
  'RESOLVING_ROUND',
  'STUDYING',
  'COMPLETED',
  'CANCELLED'
);

CREATE TABLE IF NOT EXISTS "players" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "guest_token_hash" varchar(64) NOT NULL,
  "nickname" varchar(50) NOT NULL,
  "avatar_id" varchar(50) DEFAULT 'avatar-01' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "players_guest_token_hash_unique" UNIQUE("guest_token_hash")
);

CREATE TABLE IF NOT EXISTS "matches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "player_a_id" uuid NOT NULL,
  "player_b_id" uuid NOT NULL,
  "status" "match_status" DEFAULT 'AWAITING_SUBMISSIONS' NOT NULL,
  "current_round" integer DEFAULT 1 NOT NULL,
  "mismatch_count" integer DEFAULT 0 NOT NULL,
  "study_ends_at" timestamp with time zone,
  "winner_word" varchar(100),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  CONSTRAINT "matches_players_different_check" CHECK ("player_a_id" != "player_b_id")
);

CREATE TABLE IF NOT EXISTS "rounds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL,
  "round_number" integer NOT NULL,
  "player_a_word" varchar(100),
  "player_b_word" varchar(100),
  "player_a_submitted_at" timestamp with time zone,
  "player_b_submitted_at" timestamp with time zone,
  "is_match" boolean,
  "resolved_at" timestamp with time zone
);

ALTER TABLE "matches" ADD CONSTRAINT "matches_player_a_id_players_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_b_id_players_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "players_last_seen_idx" ON "players" USING btree ("last_seen_at");
CREATE INDEX IF NOT EXISTS "matches_status_idx" ON "matches" USING btree ("status");
CREATE INDEX IF NOT EXISTS "matches_player_a_idx" ON "matches" USING btree ("player_a_id");
CREATE INDEX IF NOT EXISTS "matches_player_b_idx" ON "matches" USING btree ("player_b_id");
CREATE INDEX IF NOT EXISTS "matches_study_ends_at_idx" ON "matches" USING btree ("study_ends_at");
CREATE UNIQUE INDEX IF NOT EXISTS "rounds_match_round_idx" ON "rounds" USING btree ("match_id","round_number");
CREATE INDEX IF NOT EXISTS "rounds_match_id_idx" ON "rounds" USING btree ("match_id");
