# フロントエンド実装計画

## 概要

本ドキュメントは、FinanceDashboardProject2 フロントエンドの実装計画を定義する。

### 入力ドキュメント

- [user_stories.md](../../docs/user_stories.md) — ユーザーストーリーと受け入れ条件
- [units_definition.md](../../docs/units_definition.md) — フロントエンドユニットの責務
- [units_contracts.md](../../docs/units_contracts.md) — ユニット間の契約（API パス、認証方式、環境変数）
- [openapi_main.yaml](../../docs/openapi_main.yaml) — メイン API の OpenAPI 定義
- [technical_policies.md](../../docs/technical_policies.md) — 技術方針
- [reference/authentication.md](../../docs/reference/authentication.md) — 認証リファレンス
- [tmp_memo.md](../../docs/tmp_memo.md) — 設計メモ

### 参考プロジェクト

- [shogi_sample](../shogi_sample/shogi-main/) — 同アーキテクチャの別プロジェクト（**最も参考にすべき**）
- [old_sample](../../old_sample/) — 旧プロジェクト（ウィジェット実装の参考）

---

## 技術スタック

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| フレームワーク | Vue 3 + TypeScript | Composition API |
| ビルドツール | Vite | shogi_sample と同様 |
| ルーティング | Vue Router | メタデータベースの認証ガード |
| UI ライブラリ | PrimeVue 4 (Aura テーマ) | Bootstrap は使用しない（tmp_memo.md） |
| API クライアント生成 | Orval | OpenAPI → TypeScript |
| モック | MSW (Mock Service Worker) | 開発時のバックエンド不要化 |
| 認証 | Cognito Managed Login + PKCE | reference/authentication.md 準拠 |
| Cognito SDK | @aws-sdk/client-cognito-identity-provider | パスワード変更用 |
| リンター | ESLint + Prettier | shogi_sample の設定を踏襲 |
| チャートライブラリ | Lightweight Charts (TradingView 公式) | カスタムチャート (US-6.1) 用。verification/interest_rate で検証済み |

---

## プロジェクト構成

```
Frontend/
├── docs/
│   ├── implementation_plan.md    # 本ドキュメント
│   └── openapi_main.yaml        # API 定義（docs/ からコピー）
├── tmp/                          # ヒアリング・メモ用
├── finance-dashboard/            # Vue プロジェクトルート
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── env.d.ts
│   │   ├── assets/
│   │   │   └── main.css
│   │   ├── auth/
│   │   │   └── auth.ts          # Cognito PKCE 認証
│   │   ├── api/
│   │   │   ├── custom-fetch.ts   # カスタム Fetch ラッパー
│   │   │   └── generated/        # Orval 生成コード
│   │   │       └── main/
│   │   ├── router/
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── AppHeader.vue
│   │   │   ├── widgets/          # ダッシュボードウィジェット
│   │   │   │   ├── MarketSummaryWidget.vue
│   │   │   │   ├── CalendarWidget.vue
│   │   │   │   ├── ExchangeWidget.vue
│   │   │   │   ├── JP225Widget.vue
│   │   │   │   ├── M2Widget.vue
│   │   │   │   └── InterestRateWidget.vue
│   │   │   └── common/           # 共通コンポーネント（必要に応じて）
│   │   ├── pages/
│   │   │   ├── HomePage.vue      # 未ログイン時のランディング
│   │   │   ├── CallbackPage.vue  # OAuth コールバック
│   │   │   ├── DashboardPage.vue # ダッシュボード（US-3.1, 3.2）
│   │   │   ├── ProfilePage.vue   # プロフィール（US-2.1）
│   │   │   ├── ChangePasswordPage.vue  # パスワード変更（US-1.3）
│   │   │   └── DeleteAccountPage.vue   # アカウント削除（US-2.2）
│   │   ├── types/                # 手動型定義（必要な場合）
│   │   └── mocks/
│   │       └── browser.ts       # MSW セットアップ
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── orval.config.ts
│   ├── eslint.config.js
│   ├── .prettierrc
│   ├── .gitignore
│   └── package.json
```

### ウィジェットの設計方針（tmp_memo.md 対応）

- `components/widgets/` にウィジェットを格納し、チャート追加が容易な構造にする
- 各ウィジェットは独立したコンポーネントとして実装する
- ダッシュボードページでウィジェットの表示/非表示を制御する
- 将来的なチャートページの複数化に備え、ウィジェットとページを分離する

---

## ページ構成とルーティング

| パス | 名前 | 認証要 | コンポーネント | 対応 US |
|------|------|--------|--------------|---------|
| `/` | home | ✗ | HomePage | - |
| `/callback` | callback | ✗ | CallbackPage | US-1.1 |
| `/dashboard` | dashboard | ✓ | DashboardPage | US-3.1, 3.2, 4.x, 5.1, 6.1 |
| `/profile` | profile | ✓ | ProfilePage | US-2.1 |
| `/change-password` | change-password | ✓ | ChangePasswordPage | US-1.3 |
| `/delete-account` | delete-account | ✓ | DeleteAccountPage | US-2.2 |

### 認証フロー

- 未ログイン状態でアプリにアクセス → HomePage 表示 → ログインボタン → Cognito Managed Login にリダイレクト
- 認証成功 → `/callback` にリダイレクト → トークン交換 → `/dashboard` に遷移
- ルートガード: `meta.requiresAuth` が `true` のルートに未認証でアクセスした場合、`home` にリダイレクト
- ログアウト → トークン削除 → Cognito `/logout` にリダイレクト → `/` に戻る

---

## 環境変数

| 変数名 | 用途 | 備考 |
|--------|------|------|
| `VITE_COGNITO_DOMAIN` | Cognito ドメイン | UC-2.3 参照 |
| `VITE_COGNITO_CLIENT_ID` | Cognito クライアント ID | UC-2.3 参照 |
| `VITE_COGNITO_REGION` | Cognito リージョン | パスワード変更用 |
| `VITE_REDIRECT_URI` | コールバック URI | UC-2.3 参照 |
| `VITE_MAIN_API_BASE_URL` | メイン API ベース URL | デフォルト: `/api/v1/main`（本番は CloudFront 同一オリジン） |

---

## API クライアント

### Orval による自動生成

- [openapi_main.yaml](../../docs/openapi_main.yaml) から TypeScript クライアントを生成
- shogi_sample と同じ設定（`mode: 'tags-split'`, `client: 'fetch'`, MSW モック生成）
- カスタム Fetch ラッパーで認証トークンの自動付与と 401 リトライを実装

### エンドポイント（openapi_main.yaml より）

| メソッド | パス | 用途 | 対応 US |
|---------|------|------|---------|
| GET | `/users/me` | ユーザー情報取得 | US-2.1 |
| DELETE | `/users/me` | アカウント削除 | US-2.2 |
| GET | `/finance/interest-rate` | 政策金利・長期金利データ | US-6.1 |

---

## 実装フェーズ

### Phase 1: プロジェクト基盤

1. `npm create vue@latest` で Vue プロジェクト作成（TypeScript, Vue Router, ESLint + Prettier）
2. PrimeVue 4 (Aura テーマ) のインストールと設定
3. ESLint / Prettier 設定（shogi_sample 踏襲）
4. Vite 設定（パスエイリアス `@` 等）
5. TypeScript 設定（env.d.ts 含む）
6. グローバル CSS（main.css）
7. .gitignore 設定

### Phase 2: 認証基盤

1. `auth/auth.ts` — Cognito PKCE 認証（login, logout, signup, exchangeCodeForTokens, refreshTokens）
2. `api/custom-fetch.ts` — カスタム Fetch ラッパー（トークン付与、401 リトライ）
3. `pages/HomePage.vue` — 未ログイン時のランディングページ（ログインボタン）
4. `pages/CallbackPage.vue` — OAuth コールバックページ
5. `router/index.ts` — ルーティングと認証ガード
6. `App.vue` — ルートコンポーネント
7. `components/AppHeader.vue` — ヘッダー（US-7.1: ロゴ、ダッシュボード、ユーザー名、ログアウト）

### Phase 3: API クライアント生成

1. `docs/openapi_main.yaml` を配置
2. `orval.config.ts` 設定
3. Orval でクライアントコード生成
4. MSW モック設定（`mocks/browser.ts`）
5. DEV 環境でのモック有効化（main.ts）

### Phase 4: ユーザー管理ページ

1. `pages/ProfilePage.vue` — プロフィール表示（US-2.1）
2. `pages/ChangePasswordPage.vue` — パスワード変更（US-1.3）
3. `pages/DeleteAccountPage.vue` — アカウント削除（US-2.2）

### Phase 5: ダッシュボード

1. `pages/DashboardPage.vue` — ダッシュボードページ（US-3.1, 3.2）
   - ウィジェットの表示/非表示チェックボックス
   - レイアウト列数切り替え（1/2/3列）
   - レスポンシブ対応（モバイルは自動 1 列）

### Phase 6: TradingView ウィジェット

1. `components/widgets/MarketSummaryWidget.vue` — マーケット概況（US-4.1）
2. `components/widgets/CalendarWidget.vue` — 経済カレンダー（US-4.2）
3. `components/widgets/ExchangeWidget.vue` — FX チャート（US-4.3）
4. `components/widgets/JP225Widget.vue` — 日経225チャート（US-4.4）

### Phase 7: その他ウィジェット

1. `components/widgets/M2Widget.vue` — マネーサプライ M2（US-5.1）
2. `components/widgets/InterestRateWidget.vue` — 政策金利・長期金利チャート（US-6.1）

---

## 旧プロジェクト (old_sample) からの移行ポイント

| 旧 (old_sample) | 新 | 変更点 |
|-----------------|-----|-------|
| JavaScript | TypeScript | 型安全性の向上 |
| Bootstrap | PrimeVue (Aura) | UI ライブラリ変更 |
| `/accounts/status` で認証チェック | Cognito PKCE + sessionStorage | 認証方式の変更 |
| `components/Home.vue` にチャート管理 | `pages/DashboardPage.vue` + `widgets/` | ウィジェット分離 |
| グリッド: Bootstrap col クラス | CSS Grid or PrimeVue Grid | レイアウト実装変更 |
| TradingView ウィジェット埋め込み | 同様（ロジック流用可能） | コンポーネント化 |
| Trading Economics iframe | 同様（ロジック流用可能） | コンポーネント化 |
| カスタムチャートなし | Chart.js + API 連携 | 新規実装 |

### ウィジェットの流用

old_sample の以下のコンポーネントは、TypeScript 化・PrimeVue 化した上でロジックを流用する:

- `MarketSummary.vue` → `MarketSummaryWidget.vue`（TradingView スクリプト動的読み込み）
- `Calendar.vue` → `CalendarWidget.vue`（TradingView 経済カレンダー）
- `Exchange.vue` → `ExchangeWidget.vue`（通貨ペア選択、テクニカル指標、リサイズ）
- `JP225.vue` → `JP225Widget.vue`（テクニカル指標、リサイズ）
- `M2.vue` → `M2Widget.vue`（日付範囲選択、iframe）

---

## shogi_sample から踏襲するパターン

| パターン | 詳細 |
|---------|------|
| プロジェクト構成 | `src/{auth,api,router,pages,components,mocks,types,utils}` |
| 認証実装 | `auth/auth.ts` の PKCE フロー全体 |
| API クライアント | Orval + custom-fetch.ts パターン |
| ルーティング | `meta.requiresAuth` + `beforeEach` ガード |
| PrimeVue 設定 | Aura テーマ、darkModeSelector: false |
| DEV モック | MSW + Orval 生成モック + main.ts での条件付き起動 |
| ESLint/Prettier | 同一設定 |
| ビルドスクリプト | `generate:api → build` パイプライン |

### 違い（shogi_sample と異なる点）

| 項目 | shogi_sample | 本プロジェクト |
|------|-------------|--------------|
| ドメイン | 将棋棋譜管理 | 金融ダッシュボード |
| メインページ | CRUD（棋譜・タグ） | ダッシュボード（ウィジェット管理） |
| 外部ウィジェット | なし | TradingView, TradingEconomics |
| チャート | なし | Lightweight Charts（政策金利） |
| API 数 | 2つ（main, analysis） | 1つ（main） |
| ページ数 | 15 | 6 |

---

## 未決定事項

確認が必要になった場合は `Frontend/tmp/hearing_*.md` に記録する。

- [x] カスタムチャート（US-6.1）のチャートライブラリ — **Lightweight Charts** (TradingView 公式) を採用。`Frontend/verification/interest_rate/` で検証済み
- [ ] ダッシュボードのグリッドレイアウト — CSS Grid vs PrimeVue Grid の選択
- [ ] プロジェクトディレクトリ名 — `finance-dashboard` を想定

---

## buildspec.yml

CI/CD 用のビルド仕様は Phase 1 完了後に作成する。shogi_sample の buildspec.yml を参考にする。
