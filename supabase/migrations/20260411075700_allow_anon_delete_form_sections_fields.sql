
/*
  # Allow anonymous delete on form_sections and form_fields

  ## Changes
  - Drop existing DELETE policies that require authentication on form_sections and form_fields
  - Replace with policies that allow any user (including anonymous) to delete

  ## Reason
  The admin panel uses the anon key without authentication, so delete was silently blocked.
*/

DROP POLICY IF EXISTS "Authenticated can delete form_sections" ON form_sections;
DROP POLICY IF EXISTS "Authenticated can delete form_fields" ON form_fields;

CREATE POLICY "Anyone can delete form_sections"
  ON form_sections FOR DELETE
  USING (true);

CREATE POLICY "Anyone can delete form_fields"
  ON form_fields FOR DELETE
  USING (true);
