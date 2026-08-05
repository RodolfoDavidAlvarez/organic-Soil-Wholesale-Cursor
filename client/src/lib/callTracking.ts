/**
 * Paths where the official support number must stay fixed (no CallRail DNI).
 * Keep in sync with the early exclusion script in client/index.html.
 */
export function isCallTrackingExcludedPath(
  pathname: string,
  search: string = typeof window !== "undefined" ? window.location.search : ""
): boolean {
  const path = pathname || "/";
  const source = new URLSearchParams(search).get("source");

  return (
    path.startsWith("/rep/") ||
    path === "/free-worm-castings" ||
    (path === "/newsletter" && source === "july-community-gift") ||
    path === "/qr" ||
    path === "/check-in" ||
    path === "/yard-map" ||
    path === "/checkout" ||
    path === "/order-confirmation" ||
    path.startsWith("/pay-and-pickup") ||
    path.startsWith("/drive-through")
  );
}

export function setDocumentCallTrackingExclusion(excluded: boolean): void {
  if (typeof document === "undefined") return;

  const targets = [document.documentElement, document.body].filter(Boolean);
  for (const el of targets) {
    if (excluded) {
      el.setAttribute("data-callrail-ignore", "true");
      el.setAttribute("data-dynamic-number-ignore", "true");
      el.setAttribute("data-call-tracking-ignore", "true");
      el.classList.add("no-call-tracking");
    } else {
      el.removeAttribute("data-callrail-ignore");
      el.removeAttribute("data-dynamic-number-ignore");
      el.removeAttribute("data-call-tracking-ignore");
      el.classList.remove("no-call-tracking");
    }
  }
}
