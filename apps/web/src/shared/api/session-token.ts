const STORAGE_KEY = "fanri.token";

/**
 * The CLI opens the browser at `/?t=<token>`. Keep it for this tab and drop it from the address bar.
 * sessionStorage keeps it across reloads.
 */
export function getSessionToken(): string {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get("t");
  if (fromUrl) {
    sessionStorage.setItem(STORAGE_KEY, fromUrl);
    url.searchParams.delete("t");
    window.history.replaceState(null, "", url);
    return fromUrl;
  }
  return sessionStorage.getItem(STORAGE_KEY) ?? "";
}
