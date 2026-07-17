const fs = require("fs");
const path = require("path");
const { head, put } = require("@vercel/blob");
const { getSession, jsonBody } = require("../lib/auth");

const MENU_FILE = "domino-fazilpur-menu.json";

function bundledMenu() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "menu-data.json"), "utf8"));
}

function validate(data) {
  if (!data || !Array.isArray(data.categories) || !Array.isArray(data.items)) return "Menu needs categories and items arrays";
  const categoryIds = new Set();
  for (const category of data.categories) {
    if (!category || typeof category.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(category.id)) return "Every category needs a safe unique id";
    if (categoryIds.has(category.id)) return `Duplicate category id: ${category.id}`;
    if (typeof category.label !== "string" || !category.label.trim() || category.label.length > 100) return "Every category needs a valid name";
    categoryIds.add(category.id);
  }
  const itemIds = new Set();
  for (const item of data.items) {
    if (!item || typeof item.id !== "string" || !item.id.trim() || item.id.length > 150) return "Every item needs a valid id";
    if (itemIds.has(item.id)) return `Duplicate item id: ${item.id}`;
    if (!categoryIds.has(item.category)) return `Item ${item.name || item.id} has an invalid category`;
    if (typeof item.name !== "string" || !item.name.trim() || item.name.length > 150) return "Every item needs a valid name";
    if (typeof item.price !== "string" || !item.price.trim() || item.price.length > 50) return `Item ${item.name} needs a valid price`;
    if (typeof item.description !== "string" || item.description.length > 1000) return `Item ${item.name} has an invalid description`;
    if (typeof item.image !== "string" || !item.image.trim() || item.image.length > 1000) return `Item ${item.name} needs an image`;
    if (!Number.isFinite(Number(item.rating)) || Number(item.rating) < 0 || Number(item.rating) > 5) return `Item ${item.name} has an invalid rating`;
    for (const option of [...(item.variants || []), ...(item.addons || [])]) {
      if (!option || typeof option.label !== "string" || !option.label.trim() || String(option.price || "").length > 50) return `Item ${item.name} has an invalid option`;
    }
    itemIds.add(item.id);
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      const blob = await head(MENU_FILE);
      const response = await fetch(blob.url, { cache: "no-store" });
      if (!response.ok) throw new Error("Live menu unavailable");
      const data = await response.json();
      if (validate(data)) throw new Error("Live menu is invalid");
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(data);
    } catch (_) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(bundledMenu());
    }
  }
  if (req.method === "PUT") {
    if (!getSession(req)) return res.status(401).json({ error: "Not authenticated" });
    try {
      const data = await jsonBody(req);
      const validationError = validate(data);
      if (validationError) return res.status(400).json({ error: validationError });
      await put(MENU_FILE, JSON.stringify(data, null, 2), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: `Menu could not be saved: ${error.message}` });
    }
  }
  return res.status(405).json({ error: "Method not allowed" });
};
