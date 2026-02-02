import puppeteer from "puppeteer";

const BASE_URL = "https://tender-frontend-eight.vercel.app";

export async function getTenderLinks() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle2" });

  // wait for tender cards to appear
  await page.waitForSelector(".card a", { timeout: 10000 });

  const links = await page.$$eval(".card a", anchors =>
    anchors
      .map(a => a.getAttribute("href"))
      .filter(href => href && href.startsWith("/tender/"))
  );

  await browser.close();

  return [...new Set(links)].map(l => BASE_URL + l);
}