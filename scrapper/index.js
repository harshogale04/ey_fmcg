import { getTenderLinks } from "./scrapeList.js";
import { scrapeTender } from "./scrapeTender.js";

async function run() {
  console.log("🔍 Opening website...");
  const links = await getTenderLinks();

  console.log(`Found ${links.length} tenders`);

  const results = [];

  for (const link of links) {
    console.log("📄 Scraping:", link);
    const tender = await scrapeTender(link);
    results.push(tender);
  }

  console.log("✅ FINAL OUTPUT:");
  console.log(JSON.stringify(results, null, 2));
}

run();