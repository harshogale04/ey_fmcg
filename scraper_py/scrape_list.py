from playwright.sync_api import sync_playwright

BASE_URL = "https://tender-frontend-eight.vercel.app"


def get_tender_links():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        page = browser.new_page()
        page.goto(BASE_URL, wait_until="networkidle")

        # wait for tender cards
        page.wait_for_selector(".card a", timeout=10000)

        anchors = page.query_selector_all(".card a")

        links = []
        for a in anchors:
            href = a.get_attribute("href")
            if href and href.startswith("/tender/"):
                links.append(BASE_URL + href)

        browser.close()

        # remove duplicates
        return list(set(links))