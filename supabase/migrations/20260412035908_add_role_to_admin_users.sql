/*
  # Add role column to admin_users and seed superadmin

  ## Summary
  Adds a `role` column to `admin_users` to distinguish between regular admins
  (who can only view submissions) and superadmins (who can edit the form, manage
  signatories, and perform backup/restore).

  ## Changes
  - `admin_users` table
    - Added `role` (text) column with default 'admin'
  - Existing admin account updated to role='admin'
  - New superadmin account seeded: username=superadmin, password=super123, role=superadmin

  ## Notes
  1. role='admin' — can only view and download submissions
  2. role='superadmin' — full access: form editing, signatories, backup/restore
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'role'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN role text NOT NULL DEFAULT 'admin';
  END IF;
END $$;

INSERT INTO admin_users (username, password, role)
VALUES ('superadmin', 'super123', 'superadmin')
ON CONFLICT (username) DO UPDATE SET role = 'superadmin';
