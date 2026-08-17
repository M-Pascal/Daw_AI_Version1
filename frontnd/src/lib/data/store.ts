import "server-only";
import fs from "fs/promises";
import path from "path";
import type { Disease, DiseaseMonthlyData, Region, User } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "src", "data");

async function readJson<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson(filename: string, data: unknown): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function getRegions(): Promise<Region[]> {
  return readJson<Region[]>("regions.json");
}

export async function getDiseases(): Promise<Disease[]> {
  return readJson<Disease[]>("diseases.json");
}

export async function getDiseaseMonthlyData(): Promise<DiseaseMonthlyData> {
  return readJson<DiseaseMonthlyData>("disease-monthly-data.json");
}

export async function getUsers(): Promise<User[]> {
  try {
    return await readJson<User[]>("users.json");
  } catch {
    return [];
  }
}

export async function saveUsers(users: User[]): Promise<void> {
  await writeJson("users.json", users);
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized);
}

export async function findUserByGoogleId(googleId: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.googleId === googleId);
}

export async function createUser(user: User): Promise<void> {
  const users = await getUsers();
  users.push(user);
  await saveUsers(users);
}

export async function linkGoogleId(email: string, googleId: string): Promise<User | undefined> {
  const users = await getUsers();
  const normalized = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalized);
  if (!user) return undefined;
  user.googleId = googleId;
  await saveUsers(users);
  return user;
}

export async function updateUserPassword(
  email: string,
  passwordHash: string
): Promise<boolean> {
  const users = await getUsers();
  const normalized = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalized);
  if (!user) return false;
  user.passwordHash = passwordHash;
  await saveUsers(users);
  return true;
}
