# Frontend

金融ダッシュボードアプリのフロントエンド。Vue 3 SPA。

> **Note**: 本リポジトリは[親リポジトリ（FinanceDashboardProject2）](https://github.com/h-akira/FinenceDashboardProject2)の Git サブモジュールとして管理されている。AI エージェントは親リポジトリのルートから起動する前提で構成されており、`.dir.md` 等のパス表記も親リポジトリ基準となっている。

## 構成

- `finance-dashboard/` - メインアプリケーション
- `tests/` - E2E テスト（Playwright, Python）
- `docs/` - OpenAPI 定義（親リポジトリの `docs/` からコピー）

## セットアップ

```bash
# OpenAPI 定義をコピー（親リポジトリのルートから）
cp docs/openapi_main.yaml Frontend/docs/

# 依存インストール
cd Frontend/finance-dashboard
npm install
```

## 開発

```bash
cd Frontend/finance-dashboard

# 開発サーバー起動（API 自動生成 + MSW モック + Vite dev server）
npm run dev
```

DEV モードでは MSW によるモックが有効になり、バックエンド不要で開発できる。
認証もモック化されるため、ログインボタンで即座にログイン状態になる。

## ビルド

```bash
cd Frontend/finance-dashboard

# API コード生成 + 型チェック + 本番ビルド
npm run build

# 成果物は dist/ に出力される
```

## API コード生成

OpenAPI 定義から API クライアントを自動生成する（orval）。

```bash
cd Frontend/finance-dashboard
npm run generate:api
```

`docs/openapi_main.yaml` を参照するため、事前にコピーしておくこと。

## リント・フォーマット

```bash
cd Frontend/finance-dashboard

# リント（自動修正あり）
npm run lint

# フォーマット
npm run format

# フォーマットチェック（CI 用）
npm run format:check
```

## 環境変数

本番ビルド時に以下の環境変数が必要（CI/CD の buildspec で注入される）。

| 変数名 | 用途 |
|--------|------|
| `VITE_COGNITO_DOMAIN` | Cognito ドメイン |
| `VITE_COGNITO_CLIENT_ID` | Cognito クライアント ID |
| `VITE_COGNITO_REGION` | Cognito リージョン |
| `VITE_REDIRECT_URI` | OAuth コールバック URI |

## E2E テスト

Playwright（Python）によるブラウザテスト。dev サーバーの MSW モック環境で動作する。

```bash
# セットアップ（初回のみ）
cd Frontend/tests
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
python -m playwright install chromium

# 実行（dev サーバー起動中に別ターミナルで）
cd Frontend/tests
source env/bin/activate
python test_custom_chart.py
```
