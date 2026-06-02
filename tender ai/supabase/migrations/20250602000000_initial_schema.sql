-- TenderAI initial schema

CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  website TEXT,
  country TEXT,
  countries_served TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  team_size INT,
  certifications TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  years_in_business INT,
  budget_min INT,
  budget_max INT,
  alert_threshold INT DEFAULT 70,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE past_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_type TEXT NOT NULL CHECK (client_type IN ('government', 'private', 'ngo')),
  sector TEXT,
  description TEXT,
  budget INT,
  team_size_on_project INT,
  duration_months INT,
  outcome TEXT,
  technologies_used TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  years_experience INT
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company profile"
  ON company_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company profile"
  ON company_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company profile"
  ON company_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company profile"
  ON company_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own past projects"
  ON past_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = past_projects.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own past projects"
  ON past_projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = past_projects.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own past projects"
  ON past_projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = past_projects.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own past projects"
  ON past_projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = past_projects.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own team members"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = team_members.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own team members"
  ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = team_members.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own team members"
  ON team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = team_members.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own team members"
  ON team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles
      WHERE company_profiles.id = team_members.company_id
      AND company_profiles.user_id = auth.uid()
    )
  );
