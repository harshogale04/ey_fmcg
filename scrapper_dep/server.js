import express from "express";
import { scrapeEligibleTenders } from "./new.js";

const app = express();

app.get("/scrape", async (req, res) => {
  const months = Number(req.query.months) || 3;
  const baseUrl = req.query.url.replace(/\/$/, "");

  if (!baseUrl) {
    return res.status(400).json({
      success: false,
      message: "Missing required query param: url"
    });
  }

  try {
    const tenders = await scrapeEligibleTenders(baseUrl, months);
    res.json({
      success: true,
      count: tenders.length,
      data: tenders
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Scraping failed"
    });
  }
});

app.get("/", (_, res) => {
  res.send("✅ Tender Scraper API is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API running on", PORT));