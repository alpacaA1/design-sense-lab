import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)
URL = "http://127.0.0.1:4317"

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1440, "height": 1000},
        permissions=["clipboard-read", "clipboard-write"],
    )
    page = context.new_page()
    errors = []
    requests = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("request", lambda request: requests.append(request.url))

    page.goto(URL)
    expect(page.locator("#workspace")).to_be_visible()
    assert not any("color-palettes.js" in url for url in requests), "color palettes JS is lazy loaded"

    # 1. Save a document template with note in My Styles
    page.locator("#save-style-button").click()
    expect(page.locator("#save-style-dialog")).to_be_visible()
    page.locator("#style-name").fill("双栏研究长文模版")
    page.locator("#style-note").fill("适合深度报告，正文16px配暖纸底色")
    page.locator("#save-style-form button[type='submit']").click()
    expect(page.locator("#style-count")).to_have_text("1")

    page.locator("#library-trigger").click()
    expect(page.locator("#styles-view")).to_be_visible()
    expect(page.locator(".style-card h2")).to_have_text("双栏研究长文模版")
    expect(page.locator(".style-card-note")).to_have_text("适合深度报告，正文16px配暖纸底色")

    # Export template backup
    with page.expect_download() as style_dl_info:
        page.locator("#export-styles-button").click()
    style_backup = Path(style_dl_info.value.path()).read_text()
    assert len(json.loads(style_backup)["styles"]) == 1

    # Transfer template colors to Color Palettes
    page.locator("[data-save-style-palette]").first.click()
    expect(page.get_by_role("heading", name="新建配色", exact=True)).to_be_visible()
    assert page.url.endswith("#colors")
    expect(page.locator("#palette-title")).to_have_value("双栏研究长文模版")
    page.locator("#palette-notes").fill("从文档模版转存的基准四色")
    page.get_by_role("button", name="保存配色", exact=True).click()
    expect(page.get_by_role("heading", name="双栏研究长文模版", level=1, exact=True)).to_be_visible()

    # Return to list and verify 3 palettes (2 starter + 1 saved)
    page.get_by_role("button", name="返回配色列表", exact=True).click()
    expect(page.locator(".palette-row")).to_have_count(3)
    page.screenshot(path=str(ARTIFACTS / "color-palettes-desktop.png"))

    # Search and filter palettes
    page.get_by_role("searchbox", name="搜索配色积累").fill("#9A4B26")
    expect(page.locator(".palette-row")).to_have_count(1)
    page.get_by_role("searchbox", name="搜索配色积累").fill("")
    expect(page.locator(".palette-row")).to_have_count(3)

    # Apply "冷杉灰纸与赭石重点" to current document
    page.locator('[data-apply-palette="fir-gray-ochre-example"]').click()
    expect(page.locator("#workspace")).to_be_visible()
    assert "--doc-accent:#9A4B26" in page.locator(".paper-page").first.get_attribute("style")

    # Open Color category in Document Studio and click "将当前四色存入配色积累"
    page.locator('[data-category="color"]').click()
    page.locator("[data-save-doc-palette]").click()
    expect(page.get_by_role("heading", name="新建配色", exact=True)).to_be_visible()
    expect(page.locator('[data-color-hex="accentColor"]')).to_have_value("#9A4B26")
    page.get_by_role("button", name="取消", exact=True).click()

    # Test Screenshot Inspector in Component Lab
    page.get_by_role("button", name="组件训练", exact=True).click()
    expect(page.locator("#component-lab")).to_be_visible()
    page.locator("[data-open-inspector]").click()
    expect(page.locator("#inspector-title")).to_be_visible()
    expect(page.locator("[data-inspected-size]")).to_have_text("140 × 44px")
    expect(page.locator("[data-inspected-radius]")).to_contain_text("8px")
    expect(page.locator("[data-inspected-padding]")).to_contain_text("左右 18px")
    page.screenshot(path=str(ARTIFACTS / "screenshot-inspector-desktop.png"))

    # Apply inspected component to sandbox
    page.locator("[data-apply-inspector-sandbox]").click()
    expect(page.locator('input[type="number"][data-training-param="height"]')).to_have_value("44")
    expect(page.locator('input[type="number"][data-training-param="paddingX"]')).to_have_value("18")

    # Return to Color Palettes
    page.get_by_role("button", name="配色积累", exact=True).click()

    # Test Website Style Extractor
    page.locator('[data-palette-action="site-extractor"]').click()
    expect(page.get_by_role("heading", name="拆解网站配色与样式", exact=True)).to_be_visible()
    page.locator('[data-site-action="load-demo"]').click()
    expect(page.locator(".site-report-head h2")).to_have_text("Linear / Editorial Docs 示例站点")
    page.screenshot(path=str(ARTIFACTS / "site-extractor-desktop.png"))

    # Generate & apply document template from extracted website
    page.locator('[data-site-action="save-doc-template"]').click()
    expect(page.locator("#workspace")).to_be_visible()
    expect(page.locator("#style-count")).to_have_text("2")

    # Re-open Website Style Extractor and send Button specs to Component Lab sandbox
    page.get_by_role("button", name="配色积累", exact=True).click()
    page.locator('[data-palette-action="site-extractor"]').click()
    page.locator('[data-site-action="apply-component"][data-comp-type="button"]').click()
    expect(page.locator("#component-lab")).to_be_visible()
    expect(page.locator('input[type="number"][data-training-param="height"]')).to_have_value("36")
    expect(page.locator('input[type="number"][data-training-param="paddingX"]')).to_have_value("14")

    # Return to Color Palettes list
    page.get_by_role("button", name="配色积累", exact=True).click()

    # Export and re-import palettes backup
    with page.expect_download() as palette_dl_info:
        page.get_by_role("button", name="导出备份", exact=True).click()
    palette_backup = Path(palette_dl_info.value.path()).read_text()
    assert len(json.loads(palette_backup)["palettes"]) == 3
    page.locator("#color-palette-import").set_input_files({
        "name": "palettes.json",
        "mimeType": "application/json",
        "buffer": palette_backup.encode(),
    })
    expect(page.locator("#toast")).to_contain_text("跳过 3 组")

    # Mobile 390px layout check
    mobile = context.new_page()
    mobile.set_viewport_size({"width": 390, "height": 844})
    mobile.on("pageerror", lambda error: errors.append(str(error)))
    mobile.goto(URL + "/#colors")
    expect(mobile.get_by_role("heading", name="配色积累", exact=True)).to_be_visible()
    assert mobile.evaluate("document.documentElement.scrollWidth <= innerWidth")
    mobile.screenshot(path=str(ARTIFACTS / "color-palettes-mobile.png"))

    assert not errors, errors
    browser.close()

print("color palettes & document templates UI smoke passed")
