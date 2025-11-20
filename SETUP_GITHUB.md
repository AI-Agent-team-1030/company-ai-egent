# GitHubへのプッシュ手順

このドキュメントでは、確実にGitHubリポジトリにプッシュする手順を説明します。

## 前提条件

- GitHubアカウントを持っていること
- リポジトリ `AI-Agent-team-1030/company-ai-egent` への書き込み権限があること

## 手順

### Step 1: Personal Access Token (PAT) の作成

1. 以下のURLにアクセス:
   ```
   https://github.com/settings/tokens/new
   ```

2. 以下の項目を入力:
   - **Note (名前)**: `company-ai-agent-push`
   - **Expiration (有効期限)**: `90 days` または `No expiration`
   - **Select scopes (権限)**:
     - ✅ `repo` (すべてのrepo関連にチェックが入ります)

3. 一番下の **Generate token** ボタンをクリック

4. 表示されたトークン（`ghp_` で始まる長い文字列）を**コピー**
   ⚠️ このページを離れると二度と見れないので必ずコピーしてください

5. トークンを安全な場所に保存（例: パスワードマネージャー）

### Step 2: リモートURLの設定

ターミナルで以下のコマンドを実行（`YOUR_TOKEN` を実際のトークンに置き換える）:

```bash
cd "/Users/kurosakiyuto/法人AI素案"

# トークンを含むURLを設定
git remote set-url origin https://YOUR_TOKEN@github.com/AI-Agent-team-1030/company-ai-egent.git
```

**実行例:**
```bash
# トークンが ghp_abc123xyz789 の場合
git remote set-url origin https://ghp_abc123xyz789@github.com/AI-Agent-team-1030/company-ai-egent.git
```

### Step 3: プッシュ

```bash
git push -u origin main
```

これで完了です！

---

## トラブルシューティング

### エラー: `fatal: could not read Username`

→ Step 2のリモートURL設定でトークンが正しく含まれているか確認してください

### エラー: `Permission denied`

→ トークンの権限に `repo` が含まれているか確認してください

### エラー: `invalid credentials`

→ トークンの有効期限が切れていないか、正しくコピーされているか確認してください

---

## セキュリティ上の注意

⚠️ **トークンは絶対にコミットしないでください**

もしトークンをコミットしてしまった場合:
1. GitHubでそのトークンを削除
2. 新しいトークンを生成
3. git履歴を修正（または新しいリポジトリを作成）

---

## 今後のプッシュ

一度設定すれば、次回からは以下だけでOK:

```bash
cd "/Users/kurosakiyuto/法人AI素案"
git add .
git commit -m "コミットメッセージ"
git push
```


















