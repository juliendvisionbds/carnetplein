/** Clés localStorage côté navigateur. */
export const QUIZ_STATE_KEY = "cp-quiz";
export const LEAD_TOKEN_KEY = "cp-lead-token";
export const UTM_KEY = "cp-utm";

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ((JSON.parse(raw) as T) ?? fallback) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
