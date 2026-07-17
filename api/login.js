const { sessionCookie, safeEqual, jsonBody } = require("../lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || !process.env.SESSION_SECRET) {
    return res.status(500).json({ error: "Admin login is not configured" });
  }
  try {
    const body = await jsonBody(req);
    if (!safeEqual(body.username, username) || !safeEqual(body.password, password)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    res.setHeader("Set-Cookie", sessionCookie(username));
    return res.status(200).json({ ok: true });
  } catch (_) {
    return res.status(400).json({ error: "Invalid request body" });
  }
};
