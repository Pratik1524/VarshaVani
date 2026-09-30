/**
 * CLIENT-SIDE MOCK AUTH for the prototype only.
 * There is no server and no real session; demo sign-ups live in this browser.
 * Do not reuse this for production; replace with a real identity provider
 * (e.g. OTP login).
 */
export type Role = "farmer" | "officer";

export interface MockUser {
  email: string;
  name: string;
  role: Role;
  /** Home block for farmers; jurisdiction label for officers. */
  blockId?: string;
  jurisdiction?: string;
}

const DEMO_ACCOUNTS: (MockUser & { password: string })[] = [
  { email: "farmer@demo.com", password: "demo123", name: "Sunil Jadhav", role: "farmer", blockId: "latur" },
  { email: "officer@demo.com", password: "demo123", name: "A. Kulkarni (TAO)", role: "officer", jurisdiction: "Maharashtra (demo)" },
];

export const DEMO_CREDENTIALS = DEMO_ACCOUNTS.map(({ email, password, role }) => ({ email, password, role }));

export function authenticate(email: string, password: string): MockUser | null {
  const acc = DEMO_ACCOUNTS.find((a) => a.email === email.trim().toLowerCase() && a.password === password);
  if (!acc) return null;
  const { password: _pw, ...user } = acc; // eslint-disable-line @typescript-eslint/no-unused-vars
  return user;
}

export function demoUser(role: Role): MockUser {
  const acc = DEMO_ACCOUNTS.find((a) => a.role === role)!;
  return authenticate(acc.email, acc.password)!;
}

/** Mirror the role in a cookie so a future proxy/middleware could read it. */
export function setRoleCookie(role: Role | null) {
  if (typeof document === "undefined") return;
  document.cookie = role
    ? `mm_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    : "mm_role=; path=/; max-age=0; SameSite=Lax";
}

/* ---------------- Demo sign-up (browser only) ----------------
 * Accounts created on the sign-up form are kept in this browser's
 * localStorage, with a SHA-256 hash of the password (never the password
 * itself). This is a PROTOTYPE convenience only: there is no server, no
 * salting and no rate limiting. Replace with a real identity provider
 * (e.g. OTP login) before any real use.
 */

const ACCOUNTS_KEY = "mausammitra-accounts";

interface StoredAccount {
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
}

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readAccounts(): StoredAccount[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((a) => a && typeof a.email === "string" && typeof a.passwordHash === "string") : [];
  } catch {
    return [];
  }
}

const normEmail = (email: string) => email.trim().toLowerCase();
const toUser = (a: StoredAccount): MockUser =>
  a.role === "officer" ? { email: a.email, name: a.name, role: "officer", jurisdiction: "Maharashtra (demo)" } : { email: a.email, name: a.name, role: "farmer" };

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

export type RegisterResult = { ok: true; user: MockUser } | { ok: false; reason: "exists" };

/** Create a browser-local demo account. */
export async function registerAccount(input: { name: string; email: string; password: string; role: Role }): Promise<RegisterResult> {
  const email = normEmail(input.email);
  if (DEMO_ACCOUNTS.some((a) => a.email === email) || readAccounts().some((a) => a.email === email)) return { ok: false, reason: "exists" };
  const account: StoredAccount = {
    email,
    name: input.name.trim().replace(/\s+/g, " ").slice(0, 80),
    role: input.role,
    passwordHash: await sha256(input.password),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...readAccounts(), account]));
  return { ok: true, user: toUser(account) };
}

/** Sign in with a demo account or a browser-local registered account. */
export async function signInWithPassword(email: string, password: string): Promise<MockUser | null> {
  const demo = authenticate(email, password);
  if (demo) return demo;
  const account = readAccounts().find((a) => a.email === normEmail(email));
  if (!account) return null;
  return (await sha256(password)) === account.passwordHash ? toUser(account) : null;
}
