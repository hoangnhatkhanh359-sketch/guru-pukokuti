# メッセージサイト

コードベースのアクセス制御付きメッセージボードシステム（サーバーベース版）

## 機能

- **コードベースのアクセス制御**: アクセスコードを入力してメッセージボードにアクセス
- **メッセージ投稿**: 名前とメッセージを投稿して共有
- **管理者パネル**: アクセスコードの変更
- **グループ追加申告**: 新しいグループの追加申告
- **申告管理**: 管理者が申告を承認・拒否
- **リアルタイム同期**: 全ユーザーが同じデータを共有

## インストール

```bash
npm install
```

## 起動

```bash
npm start
```

サーバーは `http://localhost:8000` で起動します

## 初期コード

- **アクセスコード**: `group2026`
- **管理者コード**: `admin2026`

## 使い方

### 一般ユーザー

1. `http://localhost:8000/index.html` にアクセス
2. アクセスコードを入力
3. メッセージを投稿・閲覧
4. グループ追加申告を送信

### 管理者

1. `http://localhost:8000/admin.html` にアクセス
2. 管理者コードを入力
3. アクセスコードを変更可能
4. グループ追加申告一覧を確認・承認・拒否

## ファイル構成

- `server.js` - Node.js/Expressサーバー
- `index.html` - アクセスコード入力ページ
- `messages.html` - メッセージボードページ
- `admin.html` - 管理者設定ページ
- `group-request.html` - グループ追加申告ページ
- `script.js` - フロントエンドロジック
- `style.css` - スタイリング
- `data.json` - データ保存（自動生成）
- `package.json` - 依存関係

## APIエンドポイント

- `GET /api/check-code/:code` - アクセスコード確認
- `POST /api/check-admin` - 管理者コード確認
- `GET /api/current-code` - 現在のアクセスコード取得
- `POST /api/update-code` - アクセスコード更新
- `GET /api/messages` - メッセージ取得
- `POST /api/messages` - メッセージ投稿
- `GET /api/group-requests` - グループ申告取得
- `POST /api/group-requests` - グループ申告投稿
- `POST /api/group-requests/:id/status` - グループ申告ステータス更新

## 注意事項

- アクセスコードを変更すると、全ユーザーが新しいコードを入力する必要があります
- データは `data.json` に保存されます
- サーバーを起動するにはNode.jsが必要です
