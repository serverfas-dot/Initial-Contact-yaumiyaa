/*
  # Allow anon role to write to form_config, form_sections, form_fields

  The admin panel uses a custom admin_users table for authentication, not Supabase Auth.
  So all admin operations run under the anon role. The existing INSERT/UPDATE policies
  only allow authenticated users, causing all admin edits to silently fail.

  Changes:
  - Replace authenticated-only INSERT/UPDATE policies on form_config, form_sections,
    and form_fields with policies that also allow the anon role
*/

-- form_config
DROP POLICY IF EXISTS "Authenticated can insert form_config" ON form_config;
DROP POLICY IF EXISTS "Authenticated can update form_config" ON form_config;

CREATE POLICY "Anyone can insert form_config"
  ON form_config FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update form_config"
  ON form_config FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- form_sections
DROP POLICY IF EXISTS "Authenticated can insert form_sections" ON form_sections;
DROP POLICY IF EXISTS "Authenticated can update form_sections" ON form_sections;

CREATE POLICY "Anyone can insert form_sections"
  ON form_sections FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update form_sections"
  ON form_sections FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- form_fields
DROP POLICY IF EXISTS "Authenticated can insert form_fields" ON form_fields;
DROP POLICY IF EXISTS "Authenticated can update form_fields" ON form_fields;

CREATE POLICY "Anyone can insert form_fields"
  ON form_fields FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update form_fields"
  ON form_fields FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
