from playwright.sync_api import sync_playwright
import re


def scrape_tender(url: str) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")

        page.wait_for_selector(".doc-title")

        def clean(text):
            if not text:
                return None
            return re.sub(r"\s+", " ", text).strip()

        meta_elements = page.query_selector_all(".meta p")

        sections = {}
        for sec in page.query_selector_all("section"):
            h2 = sec.query_selector("h2")
            title = clean(h2.inner_text()) if h2 else None

            if title:
                content = clean(sec.inner_text().replace(title, ""))
                sections[title] = content

        data = {
            "project_name": clean(page.query_selector(".doc-title").inner_text()),
            "issued_by": clean(meta_elements[0].inner_text().replace("Issued By:", "")) if len(meta_elements) > 0 else None,
            "rfp_reference": clean(meta_elements[1].inner_text().replace("RFP Reference No.:", "")) if len(meta_elements) > 1 else None,
            "date_issued": clean(meta_elements[2].inner_text().replace("Date Issued:", "")) if len(meta_elements) > 2 else None,
            "submission_deadline": clean(meta_elements[3].inner_text().replace("Submission Deadline:", "")) if len(meta_elements) > 3 else None,
            "category": clean(meta_elements[4].inner_text().replace("Category:", "")) if len(meta_elements) > 4 else None,
            "sections": sections
        }

        browser.close()
        return data