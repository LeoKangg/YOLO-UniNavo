import { readFile, writeFile } from "node:fs/promises";
const files = ["west", "east", "iowa", "planning", "pathways"];
const entries = [];
for (const file of files) {
  const data = JSON.parse(await readFile(`research/${file}.json`, "utf8"));
  for (const item of Array.isArray(data) ? data : [data])
    entries.push(...item.sources);
}
const urls = [...new Set(entries.map((s) => s.url))];
const results = [];
let next = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (next < urls.length) {
      const url = urls[next++];
      try {
        const response = await fetch(url, {
          redirect: "follow",
          signal: AbortSignal.timeout(20000),
          headers: { "User-Agent": "UniNavo source-link validation/1.0" },
        });
        results.push({
          url,
          status: response.status,
          finalUrl: response.url,
          ok: response.ok,
        });
        await response.body?.cancel();
      } catch (e) {
        results.push({
          url,
          status: "network-error",
          message: e.message,
          ok: false,
        });
      }
    }
  }),
);
results.sort((a, b) => a.url.localeCompare(b.url));
await writeFile(
  "research/link-check.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      note: "HTTP reachability only. A 403/405 or timeout can be bot protection, not a broken URL; HTTP 200 does not prove claim accuracy.",
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `${results.filter((r) => r.ok).length}/${results.length} URLs returned 2xx. Non-2xx results:`,
  results.filter((r) => !r.ok),
);
if (results.some((r) => r.status === 404 || r.status === 410))
  process.exitCode = 1;
