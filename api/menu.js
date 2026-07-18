const fs = require('fs');
const path = require('path');
const { getSessionFromRequest, readJsonBody } = require('../lib/auth');

const MENU_PATHNAME = 'menu-data.json';

function loadBundledDefault() {
  const filePath = path.join(__dirname, '..', 'data', 'menu-data.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function validateMenu(data) {
  if (!data || typeof data !== 'object') return 'Menu data must be an object with categories and items';
  if (!Array.isArray(data.categories)) return 'Menu data must include a categories array';
  if (!Array.isArray(data.items)) return 'Menu data must include an items array';

  const seenCategoryIds = new Set();
  for (const category of data.categories) {
    if (!category || typeof category !== 'object') return 'Each category must be an object';
    if (typeof category.id !== 'string' || !category.id.trim()) {
      return 'Each category needs a non-empty id';
    }
    if (typeof category.label !== 'string' || !category.label.trim()) {
      return 'Each category needs a non-empty label';
    }
    if (seenCategoryIds.has(category.id)) {
      return `Duplicate category id detected: "${category.id}"`;
    }
    seenCategoryIds.add(category.id);
  }

  const seenItemIds = new Set();
  for (const item of data.items) {
    if (!item || typeof item !== 'object') return 'Each item must be an object';
    if (typeof item.id !== 'string' || !item.id.trim()) return 'Every item needs a non-empty id';
    if (typeof item.name !== 'string' || !item.name.trim()) return 'Every item needs a non-empty name';
    if (typeof item.category !== 'string' || !seenCategoryIds.has(item.category)) {
      return `Item "${item.name}" has an unknown or missing category`;
    }
    if (typeof item.price !== 'string' || !item.price.trim()) {
      return `Item "${item.name}" needs a price`;
    }
    if (item.variants != null) {
      if (!Array.isArray(item.variants)) return `Item "${item.name}" has an invalid variants list`;
      for (const variant of item.variants) {
        if (!variant || typeof variant !== 'object') return `Item "${item.name}" has an invalid size option`;
        if (typeof variant.label !== 'string' || !variant.label.trim()) {
          return `Item "${item.name}" has a size option missing a label`;
        }
      }
    }
    if (item.addons != null) {
      if (!Array.isArray(item.addons)) return `Item "${item.name}" has an invalid add-ons list`;
      for (const addon of item.addons) {
        if (!addon || typeof addon !== 'object') return `Item "${item.name}" has an invalid add-on`;
        if (typeof addon.label !== 'string' || !addon.label.trim()) {
          return `Item "${item.name}" has an add-on missing a label`;
        }
      }
    }
    if (seenItemIds.has(item.id)) {
      return `Duplicate item id detected: "${item.id}"`;
    }
    seenItemIds.add(item.id);
  }

  return null;
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Try the live, admin-edited copy in Vercel Blob first. Fall back to the
    // JSON file bundled in the deployment so the site keeps working even
    // before Blob storage has been set up or before any edits have been saved.
    try {
      const { head } = require('@vercel/blob');
      const blob = await head(MENU_PATHNAME);
      const response = await fetch(blob.url, { cache: 'no-store' });
      if (!response.ok) throw new Error('blob fetch failed');
      const data = await response.json();
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(data);
    } catch {
      try {
        const data = loadBundledDefault();
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json(data);
      } catch (err) {
        res.status(500).json({ error: 'Could not load menu data: ' + err.message });
      }
    }
    return;
  }

  if (req.method === 'PUT') {
    const session = getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const validationError = validateMenu(body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    try {
      const { put } = require('@vercel/blob');
      await put(MENU_PATHNAME, JSON.stringify(body, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error:
          'Failed to save menu. Make sure Vercel Blob storage is connected to this project (' +
          err.message +
          ')',
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
