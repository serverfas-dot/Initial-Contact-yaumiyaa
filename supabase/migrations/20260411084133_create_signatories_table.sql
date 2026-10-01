/*
  # Create signatories table

  1. New Tables
    - `signatories`
      - `id` (uuid, primary key)
      - `name` (text, the person's display name in Dhivehi/English)
      - `signature_data` (text, base64 data URL of the signature image)
      - `sort_order` (integer, display order)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `signatories` table
    - Authenticated users (admins) can do all operations
    - Anonymous users can SELECT (needed to populate the dropdown in the public form)
*/

CREATE TABLE IF NOT EXISTS signatories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  signature_data text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE signatories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view signatories"
  ON signatories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert signatories"
  ON signatories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update signatories"
  ON signatories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete signatories"
  ON signatories FOR DELETE
  TO authenticated
  USING (true);
