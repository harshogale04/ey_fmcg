import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const BASE_URL = "https://tender-frontend-eight.vercel.app";

/**
 * Scrapes tenders whose submission deadline
 * is at least `minMonthsAhead` months from now.
 *
 * @param {number} minMonthsAhead - default 3
 * @returns {Promise<Array<Object>>}
 */
export async function scrapeEligibleTenders(minMonthsAhead = 3) {
  const browser = await puppeteer.launch({
  args: process.env.RENDER
    ? chromium.args
    : [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process"
      ],
  executablePath: process.env.RENDER
    ? await chromium.executablePath()
    : undefined,
  headless: true
});

  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle2" });

  await page.waitForSelector(".card a", { timeout: 10000 });

  // 1️⃣ Get tender links
  const links = await page.$$eval(".card a", anchors =>
    anchors
      .map(a => a.getAttribute("href"))
      .filter(href => href && href.startsWith("/tender/"))
  );

  const uniqueLinks = [...new Set(links)].map(l => BASE_URL + l);

  const results = [];

  // Date threshold
  const today = new Date();
  const thresholdDate = new Date();
  thresholdDate.setMonth(today.getMonth() + minMonthsAhead);

  // 2️⃣ Scrape each tender
  for (const url of uniqueLinks) {
    const tenderPage = await browser.newPage();
    await tenderPage.goto(url, { waitUntil: "networkidle2" });

    try {
      await tenderPage.waitForSelector(".doc-title", { timeout: 8000 });

      const tender = await tenderPage.evaluate(() => {
        const clean = t => t?.replace(/\s+/g, " ").trim();

        const metaEls = document.querySelectorAll(".meta p");

        const sections = {};
        document.querySelectorAll("section").forEach(sec => {
          const title = clean(sec.querySelector("h2")?.innerText);
          const content = clean(sec.innerText.replace(title, ""));
          if (title) sections[title] = content;
        });

        return {
          project_name: clean(document.querySelector(".doc-title")?.innerText),
          issued_by: clean(metaEls[0]?.innerText.replace("Issued By:", "")),
          rfp_reference: clean(metaEls[1]?.innerText.replace("RFP Reference No.:", "")),
          date_issued: clean(metaEls[2]?.innerText.replace("Date Issued:", "")),
          submission_deadline: clean(
            metaEls[3]?.innerText.replace("Submission Deadline:", "")
          ),
          category: clean(metaEls[4]?.innerText.replace("Category:", "")),
          sections
        };
      });

      const deadlineDate = new Date(tender.submission_deadline);

      // 3️⃣ Apply filter
      if (!isNaN(deadlineDate) && deadlineDate <= thresholdDate) {
        results.push(tender);
      }
    } catch (err) {
      console.log(`⚠️ Skipped (error): ${url}`);
    } finally {
      await tenderPage.close();
    }
  }

  await browser.close();
  return results;
}