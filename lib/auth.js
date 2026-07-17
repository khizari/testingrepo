const crypto = require("crypto");

const COOKIE_NAME = "restaurant_admin_session";
const TTL_SECONDS = 12 * 60 * 60;

function secret() {
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not configured");
  return process.env.SESSION_SECRET;
}

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload) {
  const encoded = encode(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", secret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verify(token) {
  try {
    const [payload, signature, extra] = String(token || "").split(".");
    if (!payload || !signature || extra) return null;
    const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Date.now() ? data : null;
  } catch (_) {
    return null;
  }
}

function parseCookies(header) {
  return String(header || "").split(";").reduce((result, part) => {
    const index = part.indexOf("=");
    if (index > -1) result[part.slice(0, index).trim()] = part.slice(index + 1).trim();
    return result;
  }, {});
}

function getSession(req) {
  return verify(parseCookies(req.headers.cookie)[COOKIE_NAME]);
}

function sessionCookie(username) {
  const token = sign({ username, exp: Date.now() + TTL_SECONDS * 1000 });
  const secure = process.env.VERCEL ? " Secure;" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly;${secure} SameSite=Strict; Path=/; Max-Age=${TTL_SECONDS}`;
}

function clearCookie() {
  const secure = process.env.VERCEL ? " Secure;" : "";
  return `${COOKIE_NAME}=; HttpOnly;${secure} SameSite=Strict; Path=/; Max-Age=0`;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function jsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

module.exports = { getSession, sessionCookie, clearCookie, safeEqual, jsonBody };
