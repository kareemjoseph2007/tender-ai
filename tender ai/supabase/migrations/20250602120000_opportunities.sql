-- Tender discovery: opportunities from EU TED and UK Find a Tender

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_portal TEXT NOT NULL CHECK (source_portal IN ('EU_TED', 'UK_FTS')),
  source_url TEXT,
  source_id TEXT NOT NULL,
  title TEXT,
  buyer_name TEXT,
  country TEXT,
  deadline TIMESTAMPTZ,
  budget_min INT,
  budget_max INT,
  raw_text TEXT,
  plain_summary TEXT,
  requirements TEXT[] DEFAULT '{}',
  eligibility_requirements TEXT[] DEFAULT '{}',
  evaluation_criteria TEXT[] DEFAULT '{}',
  match_score INT,
  match_breakdown JSONB,
  eligibility_result TEXT CHECK (eligibility_result IN ('eligible', 'partial', 'not_eligible')),
  eligibility_notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_portal, source_id)
);

CREATE INDEX opportunities_source_portal_idx ON opportunities (source_portal);
CREATE INDEX opportunities_deadline_idx ON opportunities (deadline);
CREATE INDEX opportunities_status_idx ON opportunities (status);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read opportunities"
  ON opportunities FOR SELECT
  TO authenticated
  USING (true);
