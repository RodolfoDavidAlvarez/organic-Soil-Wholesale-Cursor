import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const repoRoot = path.resolve(import.meta.dirname, "..");
const clientRoot = path.join(repoRoot, "client");
const canonicalTel = /^tel:\+1\d{10}$/;

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    if (statSync(file).isDirectory()) return sourceFiles(file);
    return /\.(?:ts|tsx|js|jsx|html)$/.test(name) ? [file] : [];
  });
}

for (const file of sourceFiles(path.join(clientRoot, "src"))) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/href=["'](tel:[^"']+)["']/g)) {
    assert.match(match[1], canonicalTel, `${file}: noncanonical literal telephone href ${match[1]}`);
  }
  assert.doesNotMatch(source, /tel:\$\{[^}]*_TEL\}/, `${file}: telephone href prepends tel: to a TEL constant`);
}

assert.match(
  readFileSync(path.join(clientRoot, "src/config/contact.ts"), "utf8"),
  /CUSTOMER_SUPPORT_PHONE_DIAL = "\+16026370032"/,
  "official support source must remain canonical +16026370032",
);

assert.ok(existsSync(path.join(clientRoot, "dist/index.html")), "run the production build before phone-link tests");

const port = 4197;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)], {
  cwd: clientRoot,
  stdio: "ignore",
});

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("preview server did not start");
}

try {
  await waitForServer();
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (/googletagmanager|google-analytics|callrail/i.test(request.url())) request.abort();
    else request.continue();
  });

  for (const route of ["/", "/products", "/free-worm-castings", "/checkout", "/order"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle2" });
    const invalid = await page.$$eval('a[href^="tel:"]', (links) => {
      const normalize = (value) => {
        let digits = (value || "").replace(/\D/g, "");
        if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
        return digits.length === 10 ? digits : null;
      };
      return links
        .map((link) => {
          const href = link.getAttribute("href");
          const text = link.textContent?.trim() || "";
          const aria = link.getAttribute("aria-label");
          const digits = normalize(href);
          const display = digits ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : null;
          const visibleDigits = normalize(text);
          return {
            href,
            text,
            aria,
            valid:
              /^tel:\+1\d{10}$/.test(href || "") &&
              aria === `Call ${display}` &&
              (!visibleDigits || visibleDigits === digits),
          };
        })
        .filter((link) => !link.valid);
    });
    assert.deepEqual(invalid, [], `${route}: every rendered telephone link must use canonical US E.164`);
  }

  await page.goto(baseUrl, { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    const link = [...document.querySelectorAll('a[data-official-support-phone="true"]')].find((candidate) =>
      candidate.querySelector("[data-official-support-phone-text]"),
    );
    if (!link) throw new Error("CallRail fixture target not found");
    link.setAttribute("href", "tel:+(602) 313-3897");
    link.setAttribute("aria-label", "Call (623) 263-3386");
    link.querySelector("[data-official-support-phone-text]").textContent = "(602) 313-3897";
  });
  await page.waitForFunction(() => {
    const link = [...document.querySelectorAll('a[data-official-support-phone="true"]')].find((candidate) =>
      candidate.querySelector("[data-official-support-phone-text]")?.textContent?.includes("313-3897"),
    );
    return (
      link?.getAttribute("href") === "tel:+16023133897" &&
      link?.getAttribute("aria-label") === "Call (602) 313-3897"
    );
  });

  const synchronized = await page.evaluate(() => {
    const link = [...document.querySelectorAll('a[data-official-support-phone="true"]')].find((candidate) =>
      candidate.querySelector("[data-official-support-phone-text]")?.textContent?.includes("313-3897"),
    );
    return {
      text: link?.querySelector("[data-official-support-phone-text]")?.textContent,
      href: link?.getAttribute("href"),
      aria: link?.getAttribute("aria-label"),
    };
  });
  assert.deepEqual(synchronized, {
    text: "(602) 313-3897",
    href: "tel:+16023133897",
    aria: "Call (602) 313-3897",
  });

  await browser.close();
  console.log("phone links: canonical source/rendered hrefs and CallRail synchronization ok");
} finally {
  server.kill("SIGTERM");
}
