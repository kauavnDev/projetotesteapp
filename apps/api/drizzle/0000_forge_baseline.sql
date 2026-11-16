CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(60) NOT NULL,
  email varchar(254) NOT NULL UNIQUE, password_hash text NOT NULL,
  role varchar(10) NOT NULL DEFAULT 'user', height_cm integer, weight_kg numeric(5,2),
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(80) NOT NULL, frequency varchar(12) NOT NULL, days jsonb NOT NULL DEFAULT '[]'::jsonb,
  time varchar(5), color varchar(7) NOT NULL, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, log_date date NOT NULL,
  completed boolean NOT NULL DEFAULT true, points integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS habit_logs_user_habit_day ON habit_logs(user_id,habit_id,log_date);
CREATE TABLE IF NOT EXISTS savings_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(12) NOT NULL, amount numeric(12,2) NOT NULL, reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(100) NOT NULL, target_amount numeric(12,2) NOT NULL, deadline date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source varchar(30) NOT NULL, source_id uuid, points integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), text varchar(300) NOT NULL, color varchar(7) NOT NULL,
  animation varchar(12) NOT NULL, author varchar(80) NOT NULL, active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS body_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  view varchar(12) NOT NULL, storage_key text NOT NULL UNIQUE, mime_type varchar(40) NOT NULL DEFAULT 'image/jpeg',
  file_size integer NOT NULL DEFAULT 0, taken_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS body_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_ids jsonb NOT NULL, summary text NOT NULL, disclaimer text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS alarms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_alarm_id uuid REFERENCES alarms(id) ON DELETE CASCADE, habit_id uuid REFERENCES habits(id) ON DELETE SET NULL, time varchar(5) NOT NULL,
  days jsonb NOT NULL DEFAULT '[]'::jsonb, enabled boolean NOT NULL DEFAULT true, override_date date
);
CREATE UNIQUE INDEX IF NOT EXISTS alarms_parent_override_unique ON alarms(parent_alarm_id,override_date);
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS body_photos_user_taken_idx ON body_photos(user_id,taken_at);
CREATE INDEX IF NOT EXISTS points_ledger_user_id_idx ON points_ledger(user_id);

CREATE TABLE IF NOT EXISTS mind_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood integer NOT NULL, content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mind_entries_user_created_idx ON mind_entries(user_id,created_at);
