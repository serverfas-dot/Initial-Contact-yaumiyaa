/*
  # Create Yaumiyya (Meeting Minutes) Table

  1. New Tables
    - `yaumiyya`
      - `id` (uuid, primary key)
      - `badhalu_vun_type` (text) - Meeting type dropdown: ބައްދަލުވުން type (އެސްއެމްޓީ، ކޯޑިނޭޝަން)
      - `thaareekh` (date) - ތާރީޚް
      - `feshunu_gadi` (time) - ފެށުނުގަޑި
      - `nimunu_gadi` (time) - ނިމުނުގަޑި
      - `na` (text) - ނ
      - `number` (text) - ނަންބަރ
      - `haaziru_vaanjehey_adadhu` (integer) - ހާޒިރުވާންޖެހޭ އަދަދު
      - `haaziru_vi_adadhu` (integer) - ހާޒިރުވީ އަދަދު
      - `hulasa` (text) - ބައްދަލުވުން ހިނގާދިޔަގޮތުގެ ޙުލާސާ
      - `hiyaalu_thah` (text) - ބައްދަލުވުނުގައި ހުށައަޅާފައިވާ ބައެއް ޙިޔާލުތަށް
      - `nimunu_kanthaithah` (text) - މަޝްވަރާކޮށް ނިމުނު ކަންތައްތަށް
      - `ninmun` (text) - ބައްދަލުވުން ނިންމުން
      - `liunu_faraath` (text) - ޔައުމިއްޔާ ލިޔުނު ފަރާތް
      - `soi` (text) - ސޮއި (signature name)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `yaumiyya` table
    - Add policy for public insert (open form submission)
    - Add policy for authenticated users to read all records
*/

CREATE TABLE IF NOT EXISTS yaumiyya (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badhalu_vun_type text NOT NULL DEFAULT '',
  thaareekh date NOT NULL,
  feshunu_gadi time NOT NULL,
  nimunu_gadi time NOT NULL,
  na text NOT NULL DEFAULT '',
  number text NOT NULL DEFAULT '',
  haaziru_vaanjehey_adadhu integer NOT NULL DEFAULT 0,
  haaziru_vi_adadhu integer NOT NULL DEFAULT 0,
  hulasa text NOT NULL DEFAULT '',
  hiyaalu_thah text NOT NULL DEFAULT '',
  nimunu_kanthaithah text NOT NULL DEFAULT '',
  ninmun text NOT NULL DEFAULT '',
  liunu_faraath text NOT NULL DEFAULT '',
  soi text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE yaumiyya ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to yaumiyya"
  ON yaumiyya
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read yaumiyya"
  ON yaumiyya
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anon to read yaumiyya"
  ON yaumiyya
  FOR SELECT
  TO anon
  USING (true);
