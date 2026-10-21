// Use the configured public origin behind a reverse proxy, never forwarded headers.
export function sameApplicationOrigin(origin: string | null, requestOrigin: string, configuredUrl?: string): boolean {
 if (!origin) return false;
 try {
  const expected = new URL(configuredUrl || requestOrigin);
  const supplied = new URL(origin);
  return ["http:", "https:"].includes(expected.protocol)
   && !expected.username && !expected.password
   && !supplied.username && !supplied.password
   && supplied.origin === expected.origin;
 } catch { return false; }
}
