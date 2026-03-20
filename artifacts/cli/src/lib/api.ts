import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CONFIG_DIR = join(homedir(), ".platform");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export const API_BASE = process.env.PLATFORM_API_URL ?? "http://localhost:80/api";

interface Config {
  token?: string;
  username?: string;
  role?: string;
}

export function getConfig(): Config {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function clearConfig(): void {
  if (existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, "{}");
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (config.token) {
    headers["Authorization"] = `Bearer ${config.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      errMsg = body.error ?? errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
