CREATE TABLE IF NOT EXISTS finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(10) NOT NULL,
  amount numeric(12,2) NOT NULL,
  category varchar(40) NOT NULL,
  description varchar(240),
  occurred_at date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finance_transactions_user_date_idx ON finance_transactions(user_id,occurred_at);
