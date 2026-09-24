/**
 * Angular `ConnectionStatusService`: strip last 3 chars (`api`) from the
 * Shopizer base and hit `actuator/health/ping`.
 */
export function healthPingUrl(): string {
  const apiUrl = process.env.SHOPIZER_API_URL || "/api";
  return `${apiUrl.substring(0, apiUrl.length - 3)}actuator/health/ping`;
}

export async function pingHealth(): Promise<boolean> {
  try {
    const response = await fetch(healthPingUrl());
    if (!response.ok) {
      return false;
    }
    const body = (await response.json()) as { status?: string };
    return body.status === "UP";
  } catch {
    return false;
  }
}
