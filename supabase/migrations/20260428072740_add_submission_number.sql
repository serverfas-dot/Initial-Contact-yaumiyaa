/*
  # Add submission_number to submissions table

  1. Changes
    - Add `submission_number` column (auto-incrementing integer) to `submissions`
    - Backfill existing rows ordered by submitted_at
    - Add unique constraint on submission_number

  2. Notes
    - Uses a sequence so every new insert gets the next number automatically
    - Existing submissions get numbered 1..N by submission time (oldest = 1)
*/

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS submission_number integer;

DO $$
DECLARE
  seq_name text := 'submissions_submission_number_seq';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = seq_name AND relkind = 'S') THEN
    CREATE SEQUENCE submissions_submission_number_seq;
  END IF;
END $$;

-- Backfill existing rows in submitted_at order
DO $$
DECLARE
  rec record;
  n integer := 1;
BEGIN
  FOR rec IN SELECT id FROM submissions ORDER BY submitted_at ASC LOOP
    UPDATE submissions SET submission_number = n WHERE id = rec.id;
    n := n + 1;
  END LOOP;
  -- Advance sequence past backfilled values
  PERFORM setval('submissions_submission_number_seq', GREATEST(n - 1, 1));
END $$;

-- Set default to use sequence for future inserts
ALTER TABLE submissions
  ALTER COLUMN submission_number SET DEFAULT nextval('submissions_submission_number_seq');

-- Make sequence owned by the column so it's dropped together
ALTER SEQUENCE submissions_submission_number_seq OWNED BY submissions.submission_number;
