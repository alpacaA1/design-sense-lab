from pathlib import Path
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    errors = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))

    page.goto("http://127.0.0.1:4317")
    page.wait_for_load_state("networkidle")
    assert page.locator(".type-tab").count() == 4
    assert page.locator(".paper-page").count() == 2
    assert page.locator('.type-tab[aria-current="page"]').inner_text() == "长文档"
    page.get_by_role("button", name="Hierarchy 层级").click()
    page.get_by_label("标题行宽精确数值").fill("14")
    assert "--doc-title-width:14em" in page.locator(".paper-page").first.get_attribute("style")

    page.get_by_role("button", name="一页纸", exact=True).click()
    assert page.locator(".paper-page").count() == 1
    assert page.locator(".metrics-bar").count() == 0

    page.get_by_role("button", name="简历", exact=True).click()
    assert page.locator("#workspace-title").inner_text() == "林悦 · 产品设计师"

    page.get_by_role("button", name="正式信件", exact=True).click()
    page_group = page.get_by_role("button", name="Page 页面")
    assert page_group.get_attribute("aria-expanded") == "true"
    page_group.click()
    assert page.get_by_role("button", name="Page 页面").get_attribute("aria-expanded") == "false"
    assert page.locator(".group-panel").count() == 0
    page.get_by_role("button", name="Page 页面").click()
    assert page.get_by_role("button", name="Page 页面").get_attribute("aria-expanded") == "true"
    page.get_by_role("button", name="Typography 文字").click()
    page.get_by_role("button", name="正文中文字体").click()
    page.get_by_role("option", name="现代黑体 · 清晰").click()
    assert page.get_by_role("button", name="正文中文字体").inner_text().strip() == "现代黑体 · 清晰"
    page.get_by_label("正文字号精确数值").fill("18")
    assert "--doc-body-size:18px" in page.locator(".paper-page").get_attribute("style")

    page.get_by_role("button", name="保存为样式").click()
    page.get_by_label("样式名称").fill("正式信件 · 大留白")
    page.get_by_role("button", name="保存样式").click()
    assert page.locator("#style-count").inner_text() == "1"

    page.locator("#library-trigger").click()
    assert page.locator(".style-card").count() == 1
    page.get_by_role("button", name="应用到工作台").click()
    assert page.locator('.type-tab[aria-current="page"]').inner_text() == "正式信件"
    page.screenshot(path=str(ARTIFACTS / "document-studio-desktop.png"), full_page=True)

    page.get_by_role("button", name="组件训练", exact=True).click()
    assert page.locator("#component-lab").is_visible()
    assert page.locator(".document-typebar").is_hidden()
    assert page.locator(".component-rail button").count() == 7
    assert page.locator(".training-button").count() == 2
    assert page.get_by_role("button", name="猜尺寸", exact=True).get_attribute("aria-pressed") == "true"
    assert page.get_by_label("训练进度").locator(".is-active").inner_text().find("观察目标") >= 0
    assert 2 <= page.locator(".training-parameter").count() <= 3
    assert page.locator(".training-question").is_visible()
    assert page.locator('.training-number input[type="number"]').first.is_disabled()
    first_question = page.locator(".training-question")
    first_preset = first_question.get_attribute("data-preset-id")
    first_group = first_question.get_attribute("data-group-id")
    assert page.get_by_role("button", name="恢复百分之一百").inner_text() == "100%"
    page.get_by_role("button", name="放大预览").click()
    assert page.get_by_role("button", name="恢复百分之一百").inner_text() == "125%"
    assert "--training-zoom: 1.25" in page.locator(".training-stage").get_attribute("style")
    assert "仅改变显示倍率" in page.locator(".stage-scale").inner_text()
    page.get_by_role("button", name="恢复百分之一百").click()
    assert page.get_by_role("button", name="恢复百分之一百").inner_text() == "100%"
    assert "--training-zoom: 1" in page.locator(".training-stage").get_attribute("style")
    page.get_by_role("button", name="缩小预览").click()
    page.get_by_role("button", name="缩小预览").click()
    assert page.get_by_role("button", name="恢复百分之一百").inner_text() == "50%"
    assert page.get_by_role("button", name="缩小预览").is_disabled()
    page.get_by_role("button", name="恢复百分之一百").click()
    page.get_by_role("button", name="换一题").click()
    assert page.locator(".training-question").get_attribute("data-preset-id") != first_preset
    assert page.locator(".training-question").get_attribute("data-group-id") != first_group
    active_parameter_count = page.locator(".training-parameter").count()
    assert 2 <= active_parameter_count <= 3
    page.get_by_role("button", name="开始作答").click()
    assert page.locator(".training-parameter").first.inner_text().find("目标已隐藏") >= 0
    first_answer = page.locator('.training-number input[type="number"]').first
    assert not first_answer.is_disabled()
    first_parameter = first_answer.get_attribute("data-training-param")
    first_max = first_answer.get_attribute("max")
    first_answer.fill(first_max)
    assert f"--lab-{first_parameter}:{first_max}px" in page.locator(".stage-current .training-button").get_attribute("style")
    assert page.get_by_role("button", name="提交并揭晓").is_disabled()
    page.get_by_text("我已确认以上尺寸判断").click()
    assert not page.get_by_role("button", name="提交并揭晓").is_disabled()
    page.get_by_role("button", name="提交并揭晓").click()
    assert 1 <= page.locator(".training-priorities li").count() <= active_parameter_count
    assert page.locator(".measurement-frame").count() == 1
    assert "你的高度" in page.locator("[data-measure-height]").inner_text()
    assert page.locator(".measurement-relations").count() == 1
    assert "左右内边距" in page.locator(".measurement-relations").inner_text()
    assert "图文间距" in page.locator(".measurement-relations").inner_text()
    assert "边框" in page.locator("[data-button-formula]").inner_text()
    relation_columns = page.locator(".relation-track").evaluate("el => getComputedStyle(el).gridTemplateColumns")
    assert len(relation_columns.split()) == 5
    relation_widths = page.locator("[data-button-anatomy]").evaluate("el => ({ anatomy: el.offsetWidth, track: el.querySelector('.relation-track').offsetWidth })")
    assert abs(relation_widths["anatomy"] - relation_widths["track"]) <= 1
    assert page.get_by_label("叠加视图图例").is_visible()
    assert "原始尺寸" in page.locator(".stage-scale").inner_text()
    assert page.locator(".training-stage").get_attribute("data-stage-view") == "overlay"
    page.get_by_role("button", name="保存结果").click()
    assert page.evaluate("JSON.parse(localStorage.getItem('design-sense-component-sessions-v1')).length") == 1
    saved_question = page.evaluate("JSON.parse(localStorage.getItem('design-sense-component-sessions-v1'))[0].question")
    assert saved_question["presetId"]
    assert saved_question["groupId"]
    assert 2 <= len(saved_question["parameterIds"]) <= 3
    page.screenshot(path=str(ARTIFACTS / "component-lab-desktop.png"), full_page=True)
    page.get_by_role("button", name="换一个组件").click()
    assert page.locator(".component-rail button.is-active span").inner_text() == "Input"
    page.get_by_role("button", name="临摹匹配", exact=True).click()
    assert page.locator(".preview-switch").is_visible()
    assert page.get_by_role("button", name="检查误差").is_enabled()

    page.get_by_role("button", name="文档排版", exact=True).click()
    assert page.locator(".document-typebar").is_visible()
    assert page.locator("#workspace").is_visible()

    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile.goto("http://127.0.0.1:4317")
    mobile.wait_for_load_state("networkidle")
    assert mobile.locator(".type-tab").count() == 4
    assert mobile.locator(".document-scroll").evaluate("el => el.scrollWidth > el.clientWidth")
    mobile.screenshot(path=str(ARTIFACTS / "document-studio-mobile.png"), full_page=True)
    mobile.get_by_role("button", name="组件训练", exact=True).click()
    assert mobile.locator("#component-lab").is_visible()
    assert mobile.locator(".training-stage-wrap").evaluate("el => el.scrollWidth > el.clientWidth")
    mobile.screenshot(path=str(ARTIFACTS / "component-lab-mobile.png"), full_page=True)

    assert not errors, f"Browser errors: {errors}"
    browser.close()

print("UI smoke test passed: documents, Component Lab training, local saves, and mobile canvases")
