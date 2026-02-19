import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function scrapeEligibleTenders(baseUrl, minMonthsAhead = 3) {

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
  });

  const page = await browser.newPage();

  // ✅ React-friendly load
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  // ✅ Wait until cards REALLY appear
  await page.waitForFunction(() => {
    return document.querySelectorAll(".card a").length > 0;
  }, { timeout: 25000 });

  // ✅ Extract links safely
  const links = await page.$$eval(".card a", anchors =>
    anchors
      .map(a => a.href)
      .filter(href => href && href.includes("tender"))
  );

  const uniqueLinks = [...new Set(links)];

  const results = [];

  const today = new Date();
  const thresholdDate = new Date();
  thresholdDate.setMonth(today.getMonth() + minMonthsAhead);

  for (const url of uniqueLinks) {
    const tenderPage = await browser.newPage();
    await tenderPage.goto(url, { waitUntil: "domcontentloaded" });

    try {
      await tenderPage.waitForSelector(".doc-title", { timeout: 10000 });

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
          submission_deadline: clean(metaEls[3]?.innerText.replace("Submission Deadline:", "")),
          category: clean(metaEls[4]?.innerText.replace("Category:", "")),
          sections
        };
      });

      const deadlineDate = new Date(tender.submission_deadline);

      if (!isNaN(deadlineDate) && deadlineDate <= thresholdDate) {
        results.push(tender);
      }

    } catch {
      console.log("Skipped:", url);
    } finally {
      await tenderPage.close();
    }
  }

  await browser.close();
  return results;
}