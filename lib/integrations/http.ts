export async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 8_000): Promise<T> {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try { const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" }); if (!response.ok) throw new Error(`${response.status} ${response.statusText}`); return await response.json() as T; }
  finally { clearTimeout(timeout); }
}
