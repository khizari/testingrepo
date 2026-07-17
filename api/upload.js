const { put } = require("@vercel/blob");
const { getSession, jsonBody } = require("../lib/auth");

const MAX_BYTES = 3.5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!getSession(req)) return res.status(401).json({ error: "Not authenticated" });
  try {
    const { filename, dataUrl } = await jsonBody(req);
    const match = String(dataUrl || "").match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
    if (!filename || !match || !ALLOWED_TYPES.has(match[1])) {
      return res.status(400).json({ error: "Please upload a JPG, PNG, WebP or GIF image" });
    }
    const buffer = Buffer.from(match[2], "base64");
    if (!buffer.length || buffer.length > MAX_BYTES) return res.status(400).json({ error: "Image is too large" });
    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80) || "menu-image.jpg";
    const blob = await put(`menu-images/${Date.now()}-${safeName}`, buffer, {
      access: "public",
      contentType: match[1],
      addRandomSuffix: true,
    });
    return res.status(200).json({ url: blob.url });
  } catch (error) {
    return res.status(500).json({ error: `Image upload failed: ${error.message}` });
  }
};
