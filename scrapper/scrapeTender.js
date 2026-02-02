import puppeteer from "puppeteer";

export async function scrapeTender(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  await page.waitForSelector(".doc-title");

  const data = await page.evaluate(() => {
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

  await browser.close();
  return data;
}