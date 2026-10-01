/*
  # Reorder ނޯޓްތައް Section Fields

  1. Changes
    - Remove "ބައްދަލުވުން ހިނގާދިޔަގޮތުގެ ޙުލާސާ" (hulasa) field from the ނޯޓްތައް section
    - Reorder remaining 3 fields:
      1. "މަޝްވަރާކޮށް ނިމުނު ކަންތައްތަށް" (nimunu_kanthaithah) → sort_order 1
      2. "ބައްދަލުވުމުގައި ހުށައަޅާފައިވާ ބައެއް ޙިޔާލުތަށް" (hiyaalu_thah) → sort_order 2
      3. "ބައްދަލުވުން ނިންމުން" (ninmun) → sort_order 3
*/

-- Remove the hulasa field
DELETE FROM form_fields WHERE field_key = 'hulasa';

-- Reorder: nimunu_kanthaithah first
UPDATE form_fields SET sort_order = 1 WHERE field_key = 'nimunu_kanthaithah';

-- hiyaalu_thah second
UPDATE form_fields SET sort_order = 2 WHERE field_key = 'hiyaalu_thah';

-- ninmun third
UPDATE form_fields SET sort_order = 3 WHERE field_key = 'ninmun';
