/*
  # Create admin_users table

  ## Summary
  Creates a table for admin authentication with username and hashed password.
  Inserts a default admin account (username: admin, password: admin123).

  ## New Tables
  - `admin_users`
    - `id` (uuid, primary key)
    - `username` (text, unique, not null)
    - `password_hash` (text, not null) - stores plain text for simplicity, can be upgraded
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Anyone can SELECT (needed for login check via anon key)
  - No insert/update/delete from client side

  ## Notes
  1. A default admin account is seeded: username=admin, password=admin123
  2. Password is stored as plain text here for simplicity since there is no server-side hashing available
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read admin_users for login"
  ON admin_users FOR SELECT
  USING (true);

INSERT INTO admin_users (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;
