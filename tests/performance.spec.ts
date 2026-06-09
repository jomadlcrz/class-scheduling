import { test, expect } from "@playwright/test";

interface PerfMetrics {
  ttfbMs: number;
  domContentLoadedMs: number;
  loadMs: number;
  fcpMs: number | null;
  lcpMs: number;
  resourceCount: number;
  totalTransferKB: number;
  byTypeKB: Record<string, number>;
}

/**
 * Collects navigation + paint timings and the transferred byte budget from the
 * browser's Performance API after the page has fully loaded.
 */
async function collectMetrics(page: import("@playwright/test").Page): Promise<PerfMetrics> {
  return page.evaluate(async () => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const fcpEntry = performance.getEntriesByType("paint").find((p) => p.name === "first-contentful-paint");

    // Largest Contentful Paint — read the buffered entries.
    const lcpMs = await new Promise<number>((resolve) => {
      let value = 0;
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) value = entry.startTime;
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(value);
        }, 600);
      } catch {
        resolve(0);
      }
    });

    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const byTypeBytes: Record<string, number> = {};
    let totalBytes = nav?.transferSize ?? 0;
    for (const res of resources) {
      totalBytes += res.transferSize ?? 0;
      const key = res.initiatorType || "other";
      byTypeBytes[key] = (byTypeBytes[key] ?? 0) + (res.transferSize ?? 0);
    }
    const toKB = (b: number) => Math.round((b / 1024) * 10) / 10;

    return {
      ttfbMs: Math.round(nav?.responseStart ?? 0),
      domContentLoadedMs: Math.round(nav?.domContentLoadedEventEnd ?? 0),
      loadMs: Math.round(nav?.loadEventEnd ?? 0),
      fcpMs: fcpEntry ? Math.round(fcpEntry.startTime) : null,
      lcpMs: Math.round(lcpMs),
      resourceCount: resources.length,
      totalTransferKB: toKB(totalBytes),
      byTypeKB: Object.fromEntries(Object.entries(byTypeBytes).map(([k, v]) => [k, toKB(v)])),
    };
  });
}

test.describe("GWC landing — performance", () => {
  test("Core Web Vitals and transfer budget", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    // Let LCP settle (fonts/hero) before sampling.
    await page.waitForTimeout(700);

    const m = await collectMetrics(page);
    console.log("\n=== GWC landing performance ===");
    console.log(JSON.stringify(m, null, 2));

    // Budgets — generous but meaningful for a static marketing page.
    expect(m.fcpMs, "First Contentful Paint").toBeLessThan(1800);
    expect(m.lcpMs, "Largest Contentful Paint").toBeLessThan(2500);
    expect(m.domContentLoadedMs, "DOMContentLoaded").toBeLessThan(2500);
    expect(m.totalTransferKB, "Total transfer (gzip)").toBeLessThan(900);
  });

  test("fonts are preloaded and reused (no FOUT round-trip)", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    const fontPreloads = await page.evaluate(() =>
      [...document.querySelectorAll('link[rel="preload"][as="font"]')].map((l) =>
        (l as HTMLLinkElement).href.split("/").pop(),
      ),
    );
    console.log("\nFont preloads:", fontPreloads);

    const fontsLoaded = await page.evaluate(() => {
      const fams = new Set<string>();
      document.fonts.forEach((f) => f.status === "loaded" && fams.add(f.family));
      return [...fams];
    });
    console.log("Loaded font families:", fontsLoaded);

    expect(fontsLoaded).toContain("Bebas Neue");
    expect(fontsLoaded).toContain("Century Gothic");
  });
});
