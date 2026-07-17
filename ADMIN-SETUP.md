# Admin Panel Setup

The public menu and `admin.html` now use the same server-backed menu data.

## Vercel configuration

Add these environment variables in **Project Settings → Environment Variables**:

- `ADMIN_USERNAME`: the admin username used on `admin.html`
- `ADMIN_PASSWORD`: a strong admin password
- `SESSION_SECRET`: a long random secret used to sign the 12-hour login session

Then create and connect a **Vercel Blob** store to the project and redeploy it.

## Admin workflow

1. Open `/admin.html` and log in.
2. Add, edit, delete or reorder categories and menu items.
3. Upload item images when needed.
4. Each successful action saves the complete menu to shared Blob storage.
5. Refreshing the public home/menu page loads the latest saved data on every device.

If no live menu has been saved yet, the project uses `data/menu-data.json` as its safe default.
