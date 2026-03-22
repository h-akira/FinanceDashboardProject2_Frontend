# finance-dashboard

## セットアップ

```bash
npm install
```

## 開発

```bash
# API 自動生成 + MSW モック + Vite dev server
npm run dev
```

## ビルド

```bash
# API コード生成 + 型チェック + 本番ビルド
npm run build
```

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run preview` | ビルド成果物のプレビュー |
| `npm run generate:api` | OpenAPI → TypeScript クライアント生成 |
| `npm run type-check` | TypeScript 型チェック |
| `npm run lint` | ESLint + oxlint（自動修正あり） |
| `npm run format` | Prettier フォーマット |
| `npm run format:check` | フォーマットチェック |
