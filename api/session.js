const { getSession } = require("../lib/auth");

module.exports = (req, res) => {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const session = getSession(req);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ authenticated: Boolean(session), username: session?.username || null });
};
