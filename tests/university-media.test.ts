import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scenarioSchools } from "../src/data/scenario-catalog.ts";

test("every school has distinct local logo and campus assets with attribution", () => {
  const media = JSON.parse(
    readFileSync(
      new URL("../src/data/university-media.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(Object.keys(media).length, scenarioSchools.length);
  for (const school of scenarioSchools) {
    const record = media[school.id];
    assert.ok(record, school.id);
    assert.notEqual(record.logo.src, record.campus.src, school.id);
    for (const kind of ["logo", "campus"]) {
      const item = record[kind];
      assert.match(
        item.src,
        /^university-media\/[a-z0-9-]+\.(svg|png|jpg|jpeg|webp)$/,
      );
      const bytes = readFileSync(
        new URL(`../public/${item.src}`, import.meta.url),
      );
      assert.ok(bytes.length > 100, `${school.id} ${kind}`);
      const validImage =
        bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
        (bytes.subarray(0, 4).toString() === "RIFF" &&
          bytes.subarray(8, 12).toString() === "WEBP") ||
        /<svg[\s>]/.test(bytes.subarray(0, 1500).toString());
      assert.ok(
        validImage,
        `${school.id} ${kind}: expected image, not an error page`,
      );
      assert.ok(item.sourceUrl.startsWith("https://"), `${school.id} source`);
      assert.ok(item.credit && item.license, `${school.id} attribution`);
    }
  }
});
