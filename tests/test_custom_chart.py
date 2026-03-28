"""カスタムチャートページの E2E テスト

前提: dev サーバーが localhost:5173 で起動していること
  cd Frontend/finance-dashboard && npm run dev

実行:
  cd Frontend/tests
  source env/bin/activate
  python test_custom_chart.py
"""

import sys

from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"

passed = 0
failed = 0


def check(name: str, condition: bool) -> None:
    global passed, failed
    if condition:
        print(f"  ✅ {name}")
        passed += 1
    else:
        print(f"  ❌ {name}")
        failed += 1


def login(page):
    page.goto(BASE_URL)
    page.wait_for_timeout(1000)
    btn = page.locator('button:has-text("ログイン")').first
    if btn.is_visible():
        btn.click()
        page.wait_for_timeout(500)


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        login(page)

        # --- F2: ナビバーからカスタムチャートに遷移 ---
        print("F2: ナビバーからカスタムチャートに遷移")
        nav_link = page.locator("text=カスタムチャート").first
        check("ナビバーに「カスタムチャート」リンクがある", nav_link.is_visible())
        nav_link.click()
        page.wait_for_timeout(2500)
        check("URLが /custom-chart", "/custom-chart" in page.url)

        # --- F1: ソース一覧表示 (7 items in grouped layout) ---
        print("F1: ソース一覧表示")
        items = page.locator(".source-item")
        count = items.count()
        check("7つのソースが表示される", count == 7)

        # --- ENH-002 F2: グループ化表示 ---
        print("ENH-002 F2: グループ化表示")
        headers = page.locator(".source-group-header")
        header_count = headers.count()
        check("5つのグループヘッダーが表示される", header_count == 5)
        first_header = headers.nth(0).text_content() or ""
        check("最初のグループは「金利・スプレッド」", "金利・スプレッド" in first_header)
        last_header = headers.nth(header_count - 1).text_content() or ""
        check("最後のグループは「その他」", "その他" in last_header)

        # --- ENH-002 F1: デフォルト選択＋自動描画 ---
        print("ENH-002 F1: デフォルト選択＋自動描画")
        check("チャートが自動描画されている (canvas要素あり)", page.locator(".chart-container canvas").count() > 0)
        check("凡例が2つ表示される (デフォルト2ソース)", page.locator(".legend-item").count() == 2)
        # Verify default sources are checked
        checked_count = 0
        for i in range(count):
            cb = items.nth(i).locator('input[type="checkbox"]')
            if cb.is_checked():
                checked_count += 1
        check("デフォルトで2つチェック済み", checked_count == 2)

        # --- ENH-002 F4: レイアウト (チャートが上、操作パネルが下) ---
        print("ENH-002 F4: レイアウト確認")
        chart_box = page.locator(".chart-container").bounding_box()
        controls_box = page.locator(".controls").bounding_box()
        if chart_box and controls_box:
            check("チャートが操作パネルより上に配置", chart_box["y"] < controls_box["y"])
        else:
            check("チャートと操作パネルのバウンディングボックス取得", False)

        # --- F3: ソース追加選択 → 反映 → チャート更新 ---
        print("F3: ソース追加選択 → 反映 → チャート更新")
        # Uncheck all first, then select specific sources
        for i in range(count):
            cb = items.nth(i).locator('input[type="checkbox"]')
            if cb.is_checked():
                items.nth(i).locator("label").click()
                page.wait_for_timeout(100)
        # Select target_rate and sp500
        items.nth(0).locator("label").click()
        page.wait_for_timeout(100)
        items.nth(3).locator("label").click()  # S&P 500 (different axis group)
        page.wait_for_timeout(100)
        page.locator('button:has-text("反映")').click()
        page.wait_for_timeout(2000)
        check("チャートが描画される (canvas要素あり)", page.locator(".chart-container canvas").count() > 0)
        check("凡例が2つ表示される", page.locator(".legend-item").count() == 2)

        # --- F4: 軸グループ3種以上で警告 ---
        print("F4: 軸グループ3種以上で警告")
        items.nth(4).locator("label").click()  # S&P 500 YoY (3rd axis group)
        page.wait_for_timeout(100)
        page.locator('button:has-text("反映")').click()
        page.wait_for_timeout(1000)
        check("警告メッセージが表示される", page.locator("text=Y軸は最大").is_visible())

        # --- ENH-002 F5: 警告メッセージがチャートと操作パネルの間 ---
        print("ENH-002 F5: 警告メッセージ配置")
        warn_box = page.locator("text=Y軸は最大").bounding_box()
        if chart_box and warn_box and controls_box:
            check("警告がチャートと操作パネルの間", chart_box["y"] < warn_box["y"] < controls_box["y"])
        else:
            check("警告メッセージのバウンディングボックス取得", False)

        # --- BUG-002: 凡例は反映ボタン押下時のみ更新 ---
        print("BUG-002: 凡例は反映ボタン押下時のみ更新")
        items.nth(4).locator("label").click()  # uncheck
        page.wait_for_timeout(100)
        page.locator('button:has-text("反映")').click()
        page.wait_for_timeout(2000)
        check("反映後、凡例が2つ", page.locator(".legend-item").count() == 2)
        items.nth(2).locator("label").click()  # add without apply
        page.wait_for_timeout(500)
        check("反映ボタン未押下で凡例が変わらない", page.locator(".legend-item").count() == 2)
        page.locator('button:has-text("反映")').click()
        page.wait_for_timeout(2000)
        check("反映後、凡例が3つに更新", page.locator(".legend-item").count() == 3)

        # --- ENH-002 F7: 独立軸ソース1つ + 通常1グループ = 2軸OK ---
        print("ENH-002 F7: 独立軸ソース + 通常グループの軸数カウント")
        for i in range(count):
            cb = items.nth(i).locator('input[type="checkbox"]')
            if cb.is_checked():
                items.nth(i).locator("label").click()
                page.wait_for_timeout(100)
        # Select target_rate (rate_pct1) + score (other)
        items.nth(0).locator("label").click()
        page.wait_for_timeout(100)
        items.nth(6).locator("label").click()  # score (other)
        page.wait_for_timeout(100)
        page.locator('button:has-text("反映")').click()
        page.wait_for_timeout(2000)
        check("通常1グループ + other1つ = 2軸で描画される", page.locator(".legend-item").count() == 2)

        # --- ENH-002 F8: 独立軸ソース + 通常2グループ = 3軸で警告 ---
        print("ENH-002 F8: 軸数超過 (other + 通常2グループ)")
        items.nth(3).locator("label").click()  # sp500 (price_usd1)
        page.wait_for_timeout(100)
        page.locator('button:has-text("反映")').click()
        page.wait_for_timeout(1000)
        check("3軸で警告表示", page.locator("text=Y軸は最大").is_visible())

        # --- F6: 選択なしで反映 → チャートクリア ---
        print("F6: 選択なしで反映 → チャートクリア")
        for i in range(count):
            cb = items.nth(i).locator('input[type="checkbox"]')
            if cb.is_checked():
                items.nth(i).locator("label").click()
                page.wait_for_timeout(100)
        page.locator('button:has-text("反映")').click()
        page.wait_for_timeout(1000)
        check("選択なし反映後、凡例が消える", page.locator(".legend-item").count() == 0)

        # --- ENH-002 F6: デフォルト選択を解除して反映 → チャートクリア ---
        print("ENH-002 F6: デフォルト選択解除確認")
        # Re-navigate to get defaults
        page.goto(f"{BASE_URL}/custom-chart")
        page.wait_for_timeout(2500)
        check("再訪時にデフォルトでチャート描画", page.locator(".legend-item").count() == 2)
        # Uncheck all defaults
        items = page.locator(".source-item")
        for i in range(items.count()):
            cb = items.nth(i).locator('input[type="checkbox"]')
            if cb.is_checked():
                items.nth(i).locator("label").click()
                page.wait_for_timeout(100)
        page.locator('button:has-text("反映")').click()
        page.wait_for_timeout(1000)
        check("デフォルト解除後、凡例が消える", page.locator(".legend-item").count() == 0)

        # --- F5: 未認証時にリダイレクト ---
        print("F5: 未認証時リダイレクト")
        page.evaluate("() => sessionStorage.clear()")
        page.goto(f"{BASE_URL}/custom-chart")
        page.wait_for_timeout(1500)
        check("未認証時にホームにリダイレクトされる", "/custom-chart" not in page.url)

        # --- Summary ---
        print(f"\n=== 結果: {passed} passed, {failed} failed ===")
        browser.close()

    sys.exit(1 if failed > 0 else 0)


if __name__ == "__main__":
    run()
