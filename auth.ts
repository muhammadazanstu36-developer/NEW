import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import type { User } from "@/types";

/**
 * Account system. Passwords are hashed with scrypt. Sessions are signed cookies (HMAC-SHA256).
 * Storage: if SUPABASE_URL and SUPABASE_SERVICE_KEY are set, accounts live in a Supabase table
 * (needed on Vercel). Otherwise they are saved in data/users.json (fine for your own computer).
 */

/** A problem with how the server is set up (shown to the site owner, not a bug). */
export class SetupError extends Error {}

const FILE = process.env.USERS_FILE || path.join(process.cwd(), "data", "users.json");
export const COOKIE = "jt_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface StoredUser extends User {
  salt: string;
  hash: string;
  createdAt: string;
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new SetupError("The server is missing AUTH_SECRET. The site owner must add it in the hosting settings (at least 16 random characters).");
  }
  return "dev-only-secret-change-me-please";
}

/* ---------- storage ---------- */
interface Store {
  findByEmail(email: string): Promise<StoredUser | undefined>;
  findById(id: string): Promise<StoredUser | undefined>;
  /** returns false when the email is already taken */
  create(u: StoredUser): Promise<boolean>;
  /** changes the name and/or the password hash of one account */
  update(id: string, patch: Partial<Pick<StoredUser, "name" | "salt" | "hash">>): Promise<void>;
}

// file store (local use)
let queue: Promise<unknown> = Promise.resolve();
const serial = <T,>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
};
async function readAll(): Promise<StoredUser[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as StoredUser[];
  } catch {
    return [];
  }
}
const fileStore: Store = {
  findByEmail: async (email) => (await readAll()).find((u) => u.email === email),
  findById: async (id) => (await readAll()).find((u) => u.id === id),
  create: (u) =>
    serial(async () => {
      const users = await readAll();
      if (users.some((x) => x.email === u.email)) return false;
      users.push(u);
      await fs.mkdir(path.dirname(FILE), { recursive: true });
      await fs.writeFile(FILE, JSON.stringify(users, null, 2), "utf8");
      return true;
    }),
  update: (id, patch) =>
    serial(async () => {
      const users = await readAll();
      const i = users.findIndex((x) => x.id === id);
      if (i < 0) return;
      users[i] = { ...users[i], ...patch };
      await fs.writeFile(FILE, JSON.stringify(users, null, 2), "utf8");
    })
};

// Supabase store (works on Vercel). Uses the REST API directly, so no extra npm package is needed.
interface Row {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  created_at: string;
}
const fromRow = (r: Row): StoredUser => ({ id: r.id, name: r.name, email: r.email, salt: r.salt, hash: r.hash, createdAt: r.created_at });

function supabaseStore(url: string, key: string): Store {
  const call = (pathQuery: string, init: RequestInit = {}) =>
    fetch(`${url.replace(/\/+$/, "")}/rest/v1/${pathQuery}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
        // legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys do not
        ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}),
        ...((init.headers as Record<string, string>) ?? {})
      }
    });
  const one = async (query: string) => {
    const r = await call(`users?${query}&select=*&limit=1`);
    if (!r.ok) throw new SetupError(`The database rejected the request (HTTP ${r.status}). Check SUPABASE_URL, SUPABASE_SERVICE_KEY and that the users table exists.`);
    const rows = (await r.json()) as Row[];
    return rows[0] ? fromRow(rows[0]) : undefined;
  };
  return {
    findByEmail: (email) => one(`email=eq.${encodeURIComponent(email)}`),
    findById: (id) => one(`id=eq.${encodeURIComponent(id)}`),
    create: async (u) => {
      const r = await call("users", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ id: u.id, name: u.name, email: u.email, salt: u.salt, hash: u.hash })
      });
      if (r.status === 409) return false; // unique email violation
      if (!r.ok) throw new SetupError(`The database rejected the new account (HTTP ${r.status}). Check the users table and your service key.`);
      return true;
    },
    update: async (id, patch) => {
      const r = await call(`users?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch)
      });
      if (!r.ok) throw new SetupError(`The database rejected the change (HTTP ${r.status}). Check the users table and your service key.`);
    }
  };
}

function store(): Store {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (url && key) return supabaseStore(url, key);
  if (process.env.VERCEL) {
    throw new SetupError("Accounts need a database on this host. The site owner must add SUPABASE_URL and SUPABASE_SERVICE_KEY in the Vercel settings and redeploy.");
  }
  return fileStore;
}
/* ------------------------------------------------------------------------ */

const hashPw = (pw: string, salt: string) => crypto.scryptSync(pw, salt, 64).toString("hex");
const pub = (u: StoredUser): User => ({ id: u.id, name: u.name, email: u.email });

export const normEmail = (e: string) => e.trim().toLowerCase();

export async function createUser(name: string, email: string, password: string): Promise<User | "exists"> {
  const salt = crypto.randomBytes(16).toString("hex");
  const u: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email,
    salt,
    hash: hashPw(password, salt),
    createdAt: new Date().toISOString()
  };
  const ok = await store().create(u);
  return ok ? pub(u) : "exists";
}

export async function checkLogin(email: string, password: string): Promise<User | null> {
  const u = await store().findByEmail(email);
  // Always hash, so the response time does not reveal whether the email exists.
  const salt = u?.salt ?? "0".repeat(32);
  const got = Buffer.from(hashPw(password, salt), "hex");
  const want = Buffer.from(u?.hash ?? "0".repeat(128), "hex");
  const ok = got.length === want.length && crypto.timingSafeEqual(got, want);
  return u && ok ? pub(u) : null;
}

/** Saves a new display name. Returns the updated user, or null when the account no longer exists. */
export async function updateName(userId: string, name: string): Promise<User | null> {
  const st = store();
  const u = await st.findById(userId);
  if (!u) return null;
  await st.update(userId, { name });
  return pub({ ...u, name });
}

/** Checks the current password, then saves a new one. */
export async function changePassword(userId: string, current: string, next: string): Promise<"ok" | "wrong" | "missing"> {
  const st = store();
  const u = await st.findById(userId);
  if (!u) return "missing";
  const got = Buffer.from(hashPw(current, u.salt), "hex");
  const want = Buffer.from(u.hash, "hex");
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return "wrong";
  const salt = crypto.randomBytes(16).toString("hex");
  await st.update(userId, { salt, hash: hashPw(next, salt) });
  return "ok";
}

/* ---------- sessions ---------- */
const sign = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export function makeToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid?: string; exp?: number };
    return uid && typeof exp === "number" && exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}

export async function getUser(req: NextRequest): Promise<User | null> {
  try {
    const uid = readToken(req.cookies.get(COOKIE)?.value);
    if (!uid) return null;
    const u = await store().findById(uid);
    return u ? pub(u) : null;
  } catch (e) {
    console.error("getUser failed:", e);
    return null;
  }
}

export const cookieHeader = (token: string, clear = false) =>
  `${COOKIE}=${clear ? "" : token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : MAX_AGE}${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;

/* ---------- small in-memory throttle for login attempts ---------- */
const tries = new Map<string, number[]>();
export function throttled(key: string, max = 10, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const arr = (tries.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  tries.set(key, arr);
  return arr.length > max;
}
