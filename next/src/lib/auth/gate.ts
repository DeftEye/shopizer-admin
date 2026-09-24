/** Angular `AuthGuard`: `/pages` requires a token. */
export function shouldRedirectToAuth(
  pathname: string,
  token: string | undefined | null,
): boolean {
  const onPages = pathname === "/pages" || pathname.startsWith("/pages/");
  return onPages && !token;
}
