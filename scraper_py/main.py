import json
from scrape_list import get_tender_links
from scrape_tender import scrape_tender


def run():
    print("🔍 Opening website...")
    links = get_tender_links()

    print(f"Found {len(links)} tenders")

    results = []

    for link in links:
        print("📄 Scraping:", link)
        tender = scrape_tender(link)
        results.append(tender)

    print("✅ FINAL OUTPUT:")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    run()