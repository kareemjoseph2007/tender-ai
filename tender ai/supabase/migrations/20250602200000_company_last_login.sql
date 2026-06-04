-- Track last dashboard visit for "new since your last login"

ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
