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
        page.wait_for_timeout(1500)
        check("URLが /custom-chart", "/custom-chart" in page.url)

        # --- F1: ソース一覧表示 ---
        print("F1: ソース一覧表示")
        items = page.locator(".source-item")
        count = items.count()
        check("7つのソースが表示される", count == 7)

        # --- F3: ソース選択 → 反映 → チャート描画 ---
        print("F3: ソース選択 → 反映 → チャート描画")
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
        items.nth(4).locator("label").click()
        page.wait_for_timeout(100)
        page.locator('button:has-text("反映")').click()
        page.wait_for_timeout(1000)
        check("警告メッセージが表示される", page.locator("text=Y軸は最大").is_visible())

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
