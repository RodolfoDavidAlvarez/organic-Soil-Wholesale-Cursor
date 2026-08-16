import {
  CUSTOMER_SUPPORT_PHONE_DISPLAY,
  CUSTOMER_SUPPORT_PHONE_TEL,
} from "@/config/contact";

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
    path === "/fall-garden-workshop" ||
    path === "/classes" ||
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

/** Force official support tel links back if CallRail swaps them on excluded routes. */
export function enforceOfficialSupportPhones(root: ParentNode = document): void {
  root.querySelectorAll<HTMLAnchorElement>("[data-official-support-phone]").forEach((link) => {
    if (link.getAttribute("href") !== CUSTOMER_SUPPORT_PHONE_TEL) {
      link.setAttribute("href", CUSTOMER_SUPPORT_PHONE_TEL);
    }

    const textNode = link.querySelector<HTMLElement>("[data-official-support-phone-text]");
    if (textNode && textNode.textContent !== CUSTOMER_SUPPORT_PHONE_DISPLAY) {
      textNode.textContent = CUSTOMER_SUPPORT_PHONE_DISPLAY;
    } else if (!textNode) {
      // Icon-only or plain-text links: restore visible phone text when present.
      const text = (link.textContent || "").replace(/\s+/g, " ").trim();
      if (/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text) && text !== CUSTOMER_SUPPORT_PHONE_DISPLAY) {
        link.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && /\d/.test(node.textContent || "")) {
            node.textContent = ` ${CUSTOMER_SUPPORT_PHONE_DISPLAY}`;
          }
        });
      }
    }
  });
}
