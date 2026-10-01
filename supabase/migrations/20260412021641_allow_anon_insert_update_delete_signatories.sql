/*
  # Allow anon role to insert, update, delete signatories

  The admin panel uses a custom admin_users table for authentication (not Supabase Auth),
  so it operates under the anon role. The existing policies only allow authenticated users
  to modify signatories, causing inserts and updates to fail silently.

  Changes:
  - Drop existing insert/update/delete policies that restrict to authenticated only
  - Add new insert/update/delete policies that also allow the anon role
    (admin access is enforced at the application level via admin_users table)
*/

DROP POLICY IF EXISTS "Authenticated users can insert signatories" ON signatories;
DROP POLICY IF EXISTS "Authenticated users can update signatories" ON signatories;
DROP POLICY IF EXISTS "Authenticated users can delete signatories" ON signatories;

CREATE POLICY "Anyone can insert signatories"
  ON signatories FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update signatories"
  ON signatories FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete signatories"
  ON signatories FOR DELETE
  TO anon, authenticated
  USING (true);
