import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), ".dev");
const USERS_FILE = path.join(DATA_DIR, "users.json");

type DevUser = {
  id: string;
  email: string;
  name: string;
  password: string; // hashed
  lockedUntil?: string | null;
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]), { encoding: "utf8" });
  }
}

function readUsers(): DevUser[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(USERS_FILE, { encoding: "utf8" });
    return JSON.parse(raw) as DevUser[];
  } catch (e) {
    return [];
  }
}

function writeUsers(users: DevUser[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), { encoding: "utf8" });
}

export async function findUserByEmail(email: string) {
  const users = readUsers();
  return users.find((u) => u.email === email) || null;
}

export async function createUser(email: string, password: string, displayName?: string) {
  const users = readUsers();
  const existing = users.find((u) => u.email === email);
  if (existing) {
    throw new Error("User already exists");
  }
  const hashed = await bcrypt.hash(password, 10);
  const id = `dev-${Date.now()}`;
  const user: DevUser = {
    id,
    email,
    name: displayName || email.split("@")[0],
    password: hashed,
    lockedUntil: null,
  };
  users.push(user);
  writeUsers(users);
  return user;
}

export async function comparePassword(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return false;
  return bcrypt.compare(password, user.password);
}
