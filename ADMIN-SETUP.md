# Menu Admin Panel — Setup Guide

Your site now has a password-protected admin panel at **`/admin.html`** for
editing the menu (categories, items, prices, descriptions, sizes/variants,
add-ons, ratings, "Popular" tag, and photos) without touching any code.
Edits only go live on the site after you click **Save Changes** — no
redeploy needed.

## How it works

- `/admin.html` — login screen + the menu editor (same page; the editor is
  hidden until you log in)
- `/api/*` — small serverless functions (already included, run automatically
  on Vercel) that handle login/session/logout and reading/writing the menu
- Menu data is stored in **Vercel Blob** storage, so edits persist across
  deployments. Photos you upload in the panel are stored there too.
- If Blob storage isn't set up yet, or nothing has been saved yet, the site
  falls back to the menu bundled in `data/menu-data.json` (the menu you
  already have today), so the public site never breaks.

## One-time setup on Vercel

### 1. Add environment variables
In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `ADMIN_USERNAME` | the login username you want, e.g. `admin` |
| `ADMIN_PASSWORD` | a strong password |
| `SESSION_SECRET` | any long random string (e.g. generate one at randomkeygen.com) — this signs the login session, keep it secret |

Apply them to the **Production** environment (and Preview if you want admin
access on preview deployments too).

### 2. Add Vercel Blob storage
1. In your Vercel project, go to the **Storage** tab.
2. Click **Create Database → Blob**.
3. Connect it to this project.

Vercel automatically adds the required token to your project — no extra
env var needed on your end.

### 3. Redeploy
Trigger a new deployment (push a commit, or click **Redeploy** in Vercel) so
the new environment variables and the `/api` folder take effect.

## Using the panel

1. Go to `https://yourdomain.com/admin.html`.
2. Log in with the username/password you set above.
3. Add/edit/delete categories and items — name, price, description,
   size/variant options, add-ons, rating, and the "Popular" checkbox.
4. Use **Upload Image** on any item to add a photo — it's resized
   automatically client-side before upload, so it stays small and fast.
5. Click **Save Changes** at the top once you're happy with your edits. The
   public menu (`index.html`, `menu.html`, `cart.html`) updates right away —
   nothing is saved to the server until you click this button.

## Notes & limits

- Sessions last 12 hours, then you'll need to log in again.
- Photo uploads are capped at a few MB after automatic compression — plenty
  for menu photos.
- Only one admin account is supported (shared username/password). If you
  need multiple staff logins later, that's a bigger change — just ask.
- Consider changing `ADMIN_PASSWORD` periodically, especially if staff turn
  over.
