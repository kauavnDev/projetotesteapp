CREATE TABLE IF NOT EXISTS friendships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 addressee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status varchar(12) NOT NULL DEFAULT 'pending',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_unique ON friendships(requester_id,addressee_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships(addressee_id);
