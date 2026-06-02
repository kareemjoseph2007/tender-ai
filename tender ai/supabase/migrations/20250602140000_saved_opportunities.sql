-- Saved opportunities: user pipeline tracking

CREATE TABLE saved_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'spotted' CHECK (
    status IN ('spotted', 'reviewing', 'writing', 'submitted', 'won', 'lost')
  ),
  notes TEXT,
  assigned_to TEXT,
  reminder_date TIMESTAMPTZ,
  outcome_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id)
);

CREATE INDEX saved_opportunities_user_id_idx ON saved_opportunities (user_id);
CREATE INDEX saved_opportunities_company_id_idx ON saved_opportunities (company_id);
CREATE INDEX saved_opportunities_opportunity_id_idx ON saved_opportunities (opportunity_id);

ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved opportunities"
  ON saved_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved opportunities"
  ON saved_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved opportunities"
  ON saved_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved opportunities"
  ON saved_opportunities FOR DELETE
  USING (auth.uid() = user_id);
