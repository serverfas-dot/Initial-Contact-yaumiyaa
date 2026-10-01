# GitHub Pages Setup Guide

## One-time setup steps

### 1. Push code to GitHub
Create a new GitHub repository (e.g. `yaumiyya-meeting-system`) and push this code.

### 2. Add repository secrets
Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add these exact secret names:

| Secret name | What it is for |
|---|---|
| `VITE_SUPABASE_URL` | The public Supabase project address |
| `VITE_SUPABASE_ANON_KEY` | The public browser access key |

The deployment workflow reads these names automatically. Never add `SUPABASE_SERVICE_ROLE_KEY`, a database password, or any private signing key to GitHub Pages because browser code is public.

Do not commit local environment files or paste secret values into source code.

### 3. Enable GitHub Pages
Go to your repository → **Settings** → **Pages**
- Source: **GitHub Actions**
- Click **Save**

### 4. Deploy
Push any change to the `main` branch, or go to **Actions** → **Deploy to GitHub Pages** → **Run workflow**.

Your site will be live at:
`https://<your-github-username>.github.io/<repository-name>/`

---

## Admin login
Default credentials (change these in your Supabase `admin_users` table):
- Username: `admin`
- Password: `admin123`

Click the small **Admin** button at the bottom of the form to log in.
