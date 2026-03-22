# フロントエンド テクニカルポリシー

## 概要

本ドキュメントは、Vue 3 SPA フロントエンドの技術方針を定める。
プロジェクト固有の設計ではなく、**同一アーキテクチャの他プロジェクトでもそのまま適用できる汎用ポリシー**である。

上位ドキュメント: [technical_policies.md](../../docs/technical_policies.md)

---

## 技術スタック

| カテゴリ | 技術 | 備考 |
|---------|------|------|
| フレームワーク | Vue 3 + TypeScript | Composition API (`<script setup>`) |
| ビルドツール | Vite | |
| ルーティング | Vue Router | |
| UI ライブラリ | PrimeVue 4 (Aura テーマ) | Bootstrap は使用しない |
| API クライアント生成 | Orval | OpenAPI → TypeScript |
| モック | MSW (Mock Service Worker) | 開発時のバックエンド不要化 |
| 認証 | Cognito Managed Login + PKCE | [認証リファレンス](../../docs/reference/authentication.md) 準拠 |
| Cognito SDK | @aws-sdk/client-cognito-identity-provider | パスワード変更用 |
| リンター | ESLint + oxlint + Prettier | |

---

## プロジェクト構成

```
finance-dashboard/          # Vue プロジェクトルート（名前はプロジェクトに応じて変更）
├── src/
│   ├── main.ts             # エントリーポイント（PrimeVue / MSW 初期化）
│   ├── App.vue             # ルートコンポーネント
│   ├── env.d.ts            # 環境変数の型定義
│   ├── assets/
│   │   └── main.css
│   ├── auth/
│   │   └── auth.ts         # Cognito PKCE 認証
│   ├── api/
│   │   ├── custom-fetch.ts # カスタム Fetch ラッパー
│   │   └── generated/      # Orval 生成コード（Git 管理対象外を推奨）
│   ├── router/
│   │   └── index.ts
│   ├── components/         # 再利用可能なコンポーネント
│   ├── pages/              # ルーティング対象のページコンポーネント
│   ├── types/              # 手動型定義（外部ライブラリ等）
│   └── mocks/
│       ├── browser.ts      # MSW ワーカー設定
│       └── handlers.ts     # カスタムモックハンドラ
├── orval.config.ts
├── eslint.config.ts
├── .prettierrc
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## コーディング規約

### Vue コンポーネント

- `<script setup lang="ts">` を使用する（Options API は使用しない）
- 状態管理は Vue の Composition API（`ref`, `computed`, `readonly`）で行う
- Pinia / Vuex 等の状態管理ライブラリは、複雑な共有状態が発生しない限り導入しない
- コンポーネントファイル名は PascalCase とする（例: `AppHeader.vue`）
- ページコンポーネントは `pages/` に、それ以外は `components/` 配下に配置する

### TypeScript

- 厳密モード（`strict: true`）を有効にする
- 型注釈は可能な限り付与する
- `any` の使用は原則禁止。やむを得ない場合はコメントで理由を記載する
- API の型は Orval で自動生成し、手動で定義しない

### フォーマット

- Prettier で統一する
- セミコロン: なし
- クォート: シングルクォート
- 末尾カンマ: あり (`"all"`)
- インデント: 2 スペース
- 行幅: 100 文字

---

## PrimeVue 設定方針

- テーマ: Aura
- ダークモード: 無効 (`darkModeSelector: false`)
- コンポーネントは必要なものだけ個別インポートする（グローバル登録しない）
- PrimeIcons を使用する

---

## 認証方針

[認証リファレンス](../../docs/reference/authentication.md) に従う。以下はフロントエンド固有のポリシー。

### トークン管理

- トークンは **sessionStorage** に保存する（localStorage は使用しない）
- Vue の `ref` でリアクティブ状態を併せて管理する
- トークンの読み取りは専用の getter 関数（`getIdToken()`, `getAccessToken()`）経由で行う

### API リクエスト

- カスタム Fetch ラッパー（`custom-fetch.ts`）で全 API リクエストに `Authorization: Bearer {id_token}` を自動付与する
- 401 レスポンス時はリフレッシュトークンで再取得し、リトライする
- リフレッシュも失敗した場合は強制ログアウトする
- リフレッシュリクエストは直列化し、同時に複数のリフレッシュが走らないようにする

### ルーティングガード

- 認証が必要なルートには `meta: { requiresAuth: true }` を設定する
- `router.beforeEach` で認証状態を検査し、未認証の場合は未ログインページへリダイレクトする

### DEV モード

- `import.meta.env.DEV` が `true` の場合、Cognito への通信を行わない
- モックトークンを使用し、即座にログイン状態にする
- パスワード変更も Cognito SDK を呼び出さずにモック成功とする

---

## API クライアント方針

### Orval 設定

- モード: `tags-split`（タグごとにファイル分割）
- クライアント: `fetch`（axios は使用しない）
- MSW モック: 自動生成を有効にする
- Mutator: `custom-fetch.ts` の `mainFetch` を使用する

### カスタム Fetch ラッパー

- ベース URL はプロジェクトのユニット間契約に基づき環境変数で設定する
- トークン付与・401 リトライ・強制ログアウトを集約する
- レスポンスは `{ data, status, headers }` 形式に統一する

### MSW モック

- Orval が自動生成するモックをベースとする
- 自動生成モックのデータ品質が不十分な場合（日付形式など）、`mocks/handlers.ts` にカスタムハンドラを作成して上書きする
- カスタムハンドラは `browser.ts` で自動生成ハンドラより先に配置する（MSW は先にマッチしたハンドラが優先される）

---

## ビルド・スクリプト方針

| スクリプト | 内容 |
|-----------|------|
| `dev` | API コード生成 → MSW モック有効 → Vite dev server |
| `build` | API コード生成 → 型チェック → 本番ビルド |
| `generate:api` | Orval による API クライアント生成 |
| `type-check` | `vue-tsc --build` |
| `lint` | ESLint + oxlint |
| `format` | Prettier |
| `format:check` | Prettier チェック（CI 用） |

- `dev` と `build` は API コード生成を前段に含める
- `build` は型チェックを含める（CI で型エラーを検出するため）

---

## 環境変数方針

- `VITE_` プレフィックスを付け、Vite 経由でクライアントに公開する
- 型定義は `env.d.ts` で `ImportMetaEnv` インターフェースに記述する
- 秘密情報（API キー等）はクライアントに含めない
- API ベース URL はデフォルト値を持ち、環境変数で上書き可能にする

---

## 外部ウィジェット埋め込み方針

外部サービスのウィジェット（TradingView、iframe 等）を埋め込む場合のポリシー。

- 各ウィジェットは独立した Vue コンポーネントとして実装する
- 外部スクリプトは `onMounted` で動的に読み込み、`onBeforeUnmount` でクリーンアップする
- グローバルオブジェクト（`window.TradingView` 等）の型定義は `types/` に配置する
- iframe 埋め込みの場合はコンポーネント内で URL を computed で管理する

---

## チャートライブラリ方針

API から取得したデータを可視化するカスタムチャートには **Lightweight Charts**（TradingView 公式）を使用する。

- Chart.js 等の汎用チャートライブラリは使用しない
- `createChart` でチャートインスタンスを作成し、`onBeforeUnmount` で `chart.remove()` を実行する
- ウィンドウリサイズに対応する（`resize` イベントリスナー）
- チャートの配色はアプリケーション全体のテーマ（ライト）に合わせる
