-- AI proposal drafts

CREATE TABLE proposal_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  saved_opportunity_id UUID REFERENCES saved_opportunities(id) ON DELETE SET NULL,
  pre_generation_answers JSONB NOT NULL DEFAULT '{}',
  confirmed_projects UUID[] NOT NULL DEFAULT '{}',
  confirmed_team_members UUID[] NOT NULL DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'final')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id)
);

CREATE INDEX proposal_drafts_user_id_idx ON proposal_drafts (user_id);
CREATE INDEX proposal_drafts_opportunity_id_idx ON proposal_drafts (opportunity_id);

ALTER TABLE proposal_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proposal drafts"
  ON proposal_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proposal drafts"
  ON proposal_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proposal drafts"
  ON proposal_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own proposal drafts"
  ON proposal_drafts FOR DELETE
  USING (auth.uid() = user_id);
