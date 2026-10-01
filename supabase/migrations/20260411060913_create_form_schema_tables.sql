/*
  # Create Dynamic Form Schema Tables

  This migration creates a system that allows admins to fully customize the Yaumiyya form structure.

  1. New Tables
    - `form_config`
      - `id` (uuid, primary key)
      - `title` (text) - Main form heading
      - `subtitle` (text) - Form subtitle
      - `logo_text` (text) - Logo circle character
      - `submit_label` (text) - Submit button text
      - `updated_at` (timestamptz)

    - `form_sections`
      - `id` (uuid, primary key)
      - `label` (text) - Section heading displayed on form
      - `sort_order` (integer) - Position order
      - `style` (text) - 'default' or 'signature' for color variant
      - `created_at` (timestamptz)

    - `form_fields`
      - `id` (uuid, primary key)
      - `section_id` (uuid, FK to form_sections)
      - `field_key` (text) - DB column / JSON key identifier
      - `label` (text) - Field label shown to user
      - `field_type` (text) - 'text', 'number', 'date', 'time', 'textarea', 'select'
      - `placeholder` (text) - Placeholder text
      - `options` (text) - Comma-separated options for select fields
      - `required` (boolean)
      - `full_width` (boolean) - Span full row width
      - `sort_order` (integer) - Position within section
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Anon can read (to render the form)
    - Authenticated can read and write (admin management)

  3. Seed Data
    - Inserts the default Yaumiyya form structure matching the existing hardcoded form
*/

CREATE TABLE IF NOT EXISTS form_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'ޔައުމިއްޔާ ސިސްޓަމް',
  subtitle text NOT NULL DEFAULT 'Meeting Minutes System',
  logo_text text NOT NULL DEFAULT 'ޔ',
  submit_label text NOT NULL DEFAULT 'ޔައުމިއްޔާ ހުށަހަޅާ',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  style text NOT NULL DEFAULT 'default',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES form_sections(id) ON DELETE CASCADE,
  field_key text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  field_type text NOT NULL DEFAULT 'text',
  placeholder text NOT NULL DEFAULT '',
  options text NOT NULL DEFAULT '',
  required boolean NOT NULL DEFAULT true,
  full_width boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE form_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read form_config"
  ON form_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can insert form_config"
  ON form_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update form_config"
  ON form_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read form_sections"
  ON form_sections FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can insert form_sections"
  ON form_sections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update form_sections"
  ON form_sections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete form_sections"
  ON form_sections FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read form_fields"
  ON form_fields FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated can insert form_fields"
  ON form_fields FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update form_fields"
  ON form_fields FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete form_fields"
  ON form_fields FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO form_config (title, subtitle, logo_text, submit_label)
VALUES ('ޔައުމިއްޔާ ސިސްޓަމް', 'Meeting Minutes System', 'ޔ', 'ޔައުމިއްޔާ ހުށަހަޅާ');

WITH s1 AS (
  INSERT INTO form_sections (label, sort_order, style)
  VALUES ('ބައްދަލުވުމުގެ މަޢުލޫމާތު', 1, 'default')
  RETURNING id
),
s2 AS (
  INSERT INTO form_sections (label, sort_order, style)
  VALUES ('ހާޒިރީ', 2, 'default')
  RETURNING id
),
s3 AS (
  INSERT INTO form_sections (label, sort_order, style)
  VALUES ('ނޯޓްތައް', 3, 'default')
  RETURNING id
),
s4 AS (
  INSERT INTO form_sections (label, sort_order, style)
  VALUES ('ސޮއި', 4, 'signature')
  RETURNING id
)
INSERT INTO form_fields (section_id, field_key, label, field_type, placeholder, options, required, full_width, sort_order)
SELECT id, 'badhalu_vun_type', 'ބައްދަލުވުމުގެ ބާވަތް', 'select', 'ހިޔާރުކޮށްލާ...', 'އެސްއެމްޓީ,ކޯޑިނޭޝަން', true, false, 1 FROM s1
UNION ALL
SELECT id, 'thaareekh', 'ތާރީޚް', 'date', '', '', true, false, 2 FROM s1
UNION ALL
SELECT id, 'feshunu_gadi', 'ފެށުނު ގަޑި', 'time', '', '', true, false, 3 FROM s1
UNION ALL
SELECT id, 'nimunu_gadi', 'ނިމުނު ގަޑި', 'time', '', '', true, false, 4 FROM s1
UNION ALL
SELECT id, 'na', 'ނ', 'text', 'ނ ލިޔޭ...', '', true, false, 5 FROM s1
UNION ALL
SELECT id, 'number', 'ނަންބަރ', 'text', 'ނަންބަރ ލިޔޭ...', '', true, false, 6 FROM s1
UNION ALL
SELECT id, 'haaziru_vaanjehey_adadhu', 'ހާޒިރުވާންޖެހޭ އަދަދު', 'number', '', '', true, false, 1 FROM s2
UNION ALL
SELECT id, 'haaziru_vi_adadhu', 'ހާޒިރުވީ އަދަދު', 'number', '', '', true, false, 2 FROM s2
UNION ALL
SELECT id, 'hulasa', 'ބައްދަލުވުން ހިނގާދިޔަގޮތުގެ ޙުލާސާ', 'textarea', 'ކުރު ނޯޓެއް ލިޔޭ...', '', true, true, 1 FROM s3
UNION ALL
SELECT id, 'hiyaalu_thah', 'ބައްދަލުވުނުގައި ހުށައަޅާފައިވާ ބައެއް ޙިޔާލުތަށް', 'textarea', 'ކުރު ނޯޓެއް ލިޔޭ...', '', true, true, 2 FROM s3
UNION ALL
SELECT id, 'nimunu_kanthaithah', 'މަޝްވަރާކޮށް ނިމުނު ކަންތައްތަށް', 'textarea', 'ކުރު ނޯޓެއް ލިޔޭ...', '', true, true, 3 FROM s3
UNION ALL
SELECT id, 'ninmun', 'ބައްދަލުވުން ނިންމުން', 'textarea', 'ކުރު ނޯޓެއް ލިޔޭ...', '', true, true, 4 FROM s3
UNION ALL
SELECT id, 'liunu_faraath', 'ޔައުމިއްޔާ ލިޔުނު ފަރާތް', 'text', 'ނަން ލިޔޭ...', '', true, false, 1 FROM s4
UNION ALL
SELECT id, 'soi', 'ސޮއި', 'text', 'ސޮއި ލިޔޭ...', '', true, false, 2 FROM s4;
