/*
  # Add Submissions Table for Dynamic Form Data

  1. New Tables
    - `submissions`
      - `id` (uuid, primary key)
      - `form_data` (jsonb) - All dynamic form field values as key-value pairs
      - `signature_data` (jsonb) - Signature image data URLs keyed by field_key
      - `submitted_at` (timestamptz) - When the form was submitted

  2. Security
    - Enable RLS on `submissions` table
    - Allow anon to insert (public form submission)
    - Allow anon and authenticated to read (admin dashboard)

  This replaces the rigid yaumiyya table columns with a flexible JSONB approach
  that works with any dynamic form configuration.
*/

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_data jsonb NOT NULL DEFAULT '{}',
  signature_data jsonb NOT NULL DEFAULT '{}',
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to submissions"
  ON submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anon to read submissions"
  ON submissions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow authenticated to read submissions"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (true);
