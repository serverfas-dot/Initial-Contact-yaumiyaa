/*
  # Allow delete on submissions table

  1. Changes
    - Add DELETE policy on `submissions` table for anon and authenticated roles
      so that super admin can delete submission records from the dashboard
*/

CREATE POLICY "Allow anon and authenticated to delete submissions"
  ON submissions
  FOR DELETE
  TO anon, authenticated
  USING (true);
