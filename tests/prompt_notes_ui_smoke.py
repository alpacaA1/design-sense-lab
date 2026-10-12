import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)
URL = "http://127.0.0.1:4317"
KEY = "design-sense-prompt-notes-v1"

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1000}, permissions=["clipboard-read", "clipboard-write"])
    page = context.new_page()
    errors = []
    requests = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("request", lambda request: requests.append(request.url))
    page.goto(URL)
    expect(page.locator("#workspace")).to_be_visible()
    assert not any("prompt-notes.js" in url for url in requests), "notes JS is lazy loaded"
    page.get_by_role("button", name="提示词笔记", exact=True).click()
    expect(page.get_by_role("heading", name="提示词笔记", exact=True)).to_be_visible()
    assert page.url.endswith("#prompts")
    expect(page.locator(".prompt-note-row")).to_have_count(1)
    page.screenshot(path=str(ARTIFACTS / "prompt-notes-desktop.png"))
    page.get_by_role("searchbox", name="搜索提示词笔记").fill("晕染")
    expect(page.locator(".prompt-note-row")).to_have_count(1)
    page.get_by_role("searchbox", name="搜索提示词笔记").fill("没有这个关键词")
    expect(page.get_by_role("heading", name="没有找到匹配的笔记")).to_be_visible()
    page.get_by_role("button", name="清除筛选").click()
    page.get_by_role("button", name="从参考画生成水彩动画", exact=True).click()
    expect(page.locator(".prompt-original")).to_contain_text("p5.brush 2.2.2")
    expect(page.locator(".prompt-understanding-text a")).to_have_count(2)
    page.get_by_role("button", name="复制提示词", exact=True).click()
    copied = page.evaluate("navigator.clipboard.readText()")
    assert copied == page.locator(".prompt-original").inner_text()
    page.screenshot(path=str(ARTIFACTS / "prompt-note-detail-desktop.png"))
    page.get_by_role("button", name="查找技术：p5.js", exact=True).click()
    expect(page.locator(".prompt-tag-filters .is-active")).to_have_text("p5.js")
    page.get_by_role("button", name="新建笔记", exact=True).click()
    page.get_by_label("标题 必填", exact=True).fill("技术演示")
    page.get_by_label("提示词原文 必填", exact=True).fill("   ")
    page.get_by_role("button", name="保存笔记", exact=True).click()
    expect(page.locator("#prompt-form-error")).to_contain_text("请填写")
    prompt = "  生成画布动画\n<img src=x onerror=alert(1)>\n  "
    page.get_by_label("提示词原文 必填", exact=True).fill(prompt)
    page.get_by_label("我的理解 选填", exact=True).fill("字面代码应保留。文档：https://p5js.org/reference/")
    page.get_by_label("涉及技术 选填，用逗号分隔", exact=True).fill("Canvas, canvas, p5.js")
    page.get_by_role("button", name="保存笔记", exact=True).click()
    expect(page.get_by_role("heading", name="技术演示", exact=True)).to_be_visible()
    assert page.locator(".prompt-original").text_content() == prompt
    expect(page.locator(".prompt-original img")).to_have_count(0)
    page.get_by_role("button", name="编辑", exact=True).click()
    page.get_by_label("标题 必填", exact=True).fill("暂未保存的标题")
    page.once("dialog", lambda dialog: dialog.dismiss())
    page.get_by_role("button", name="文档排版", exact=True).click()
    expect(page.get_by_label("标题 必填", exact=True)).to_have_value("暂未保存的标题")
    page.once("dialog", lambda dialog: dialog.accept())
    page.get_by_role("button", name="文档排版", exact=True).click()
    expect(page.locator("#workspace")).to_be_visible()
    page.get_by_role("button", name="组件训练", exact=True).click()
    expect(page.locator("#component-lab")).to_be_visible()
    page.get_by_role("button", name="提示词笔记", exact=True).click()
    expect(page.get_by_role("heading", name="技术演示", exact=True)).to_be_visible()
    page.get_by_role("button", name="返回笔记列表", exact=True).click()
    page.get_by_role("button", name="全部", exact=True).click()
    expect(page.locator(".prompt-note-row")).to_have_count(2)
    with page.expect_download() as download_info:
        page.get_by_role("button", name="导出备份", exact=True).click()
    backup = Path(download_info.value.path()).read_text()
    assert len(json.loads(backup)["notes"]) == 2
    file_input = page.locator("#prompt-note-import")
    file_input.set_input_files({"name": "backup.json", "mimeType": "application/json", "buffer": backup.encode()})
    expect(page.locator("#toast")).to_contain_text("跳过 2 条")
    expect(page.locator(".prompt-note-row")).to_have_count(2)
    incoming = json.loads(backup)
    incoming["notes"] = [incoming["notes"][0]]
    incoming["notes"][0]["title"] = "技术演示（另一台设备）"
    incoming["notes"][0]["prompt"] = "从另一设备导入的修改"
    file_input.set_input_files({"name": "conflict.json", "mimeType": "application/json", "buffer": json.dumps(incoming).encode()})
    expect(page.locator("#toast")).to_contain_text("冲突内容已另存")
    expect(page.locator(".prompt-note-row")).to_have_count(3)
    file_input.set_input_files({"name": "invalid.json", "mimeType": "application/json", "buffer": b"invalid"})
    expect(page.locator("#toast")).to_contain_text("不是有效的 JSON")
    expect(page.locator(".prompt-note-row")).to_have_count(3)
    page.reload()
    expect(page.locator(".prompt-note-row")).to_have_count(3)
    page.get_by_role("button", name="技术演示", exact=True).click()
    assert page.locator(".prompt-original").text_content() == prompt

    mobile = context.new_page()
    mobile.set_viewport_size({"width": 375, "height": 844})
    mobile.on("pageerror", lambda error: errors.append(str(error)))
    mobile.goto(URL + "/#prompts")
    expect(mobile.get_by_role("heading", name="提示词笔记", exact=True)).to_be_visible()
    assert mobile.evaluate("document.documentElement.scrollWidth <= innerWidth")
    mobile.screenshot(path=str(ARTIFACTS / "prompt-notes-mobile.png"))
    mobile.get_by_role("button", name="从参考画生成水彩动画", exact=True).click()
    expect(mobile.locator(".prompt-original")).to_be_visible()
    assert mobile.evaluate("document.documentElement.scrollWidth <= innerWidth")
    mobile.screenshot(path=str(ARTIFACTS / "prompt-note-detail-mobile.png"))
    mobile.get_by_role("button", name="编辑", exact=True).click()
    expect(mobile.locator("#prompt-note-form")).to_be_visible()
    assert mobile.evaluate("document.documentElement.scrollWidth <= innerWidth")
    mobile.get_by_label("我的理解 选填", exact=True).fill("旧页面的编辑内容仍应保留")
    page.get_by_role("button", name="编辑", exact=True).click()
    page.get_by_label("标题 必填", exact=True).fill("来自另一个标签页的更新")
    page.get_by_role("button", name="保存笔记", exact=True).click()
    expect(page.get_by_role("heading", name="来自另一个标签页的更新", exact=True)).to_be_visible()
    mobile.get_by_role("button", name="保存笔记", exact=True).click()
    expect(mobile.locator("#prompt-form-error")).to_contain_text("另一窗口更新")
    expect(mobile.get_by_label("我的理解 选填", exact=True)).to_have_value("旧页面的编辑内容仍应保留")
    assert not errors, errors
    browser.close()

print("prompt notes UI passed: lazy loading, search, tags, exact copy, save/reload, draft protection, safe backup merge, desktop/mobile, no script execution")
