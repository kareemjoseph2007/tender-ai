-- Alert email delivery log

CREATE TABLE alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  match_score INT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  channel TEXT NOT NULL DEFAULT 'email',
  opened BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (user_id, opportunity_id, channel)
);

CREATE INDEX alert_logs_user_id_idx ON alert_logs (user_id);
CREATE INDEX alert_logs_opportunity_id_idx ON alert_logs (opportunity_id);
CREATE INDEX alert_logs_sent_at_idx ON alert_logs (sent_at);

ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert logs"
  ON alert_logs FOR SELECT
  USING (auth.uid() = user_id);
