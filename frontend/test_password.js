const { randomBytes, pbkdf2, timingSafeEqual } = require("crypto");
const { promisify } = require("util");

const pbkdf2Async = promisify(pbkdf2);

const ITERATIONS = 210000;
const KEYLEN = 32;
const DIGEST = "sha256";

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await pbkdf2Async(
    password,
    salt,
    ITERATIONS,
    KEYLEN,
    DIGEST
  );
  return `pbkdf2-sha256$${ITERATIONS}$${salt.toString("hex")}$${key.toString("hex")}`;
}

async function verifyPassword(
  password,
  stored
) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 100000) return false;
  const salt = Buffer.from(parts[2], "hex");
  const expected = Buffer.from(parts[3], "hex");
  if (salt.length !== 16 || expected.length !== KEYLEN) return false;
  const key = await pbkdf2Async(
    password,
    salt,
    iterations,
    KEYLEN,
    DIGEST
  );
  return timingSafeEqual(key, expected);
}

async function test() {
  const p = "mysecret";
  const h = await hashPassword(p);
  console.log("hash:", h);
  const v = await verifyPassword(p, h);
  console.log("verify result:", v);
}

test().catch(console.error);
