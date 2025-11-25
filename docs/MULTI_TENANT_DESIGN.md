# マルチテナント設計

**Version**: 1.0
**最終更新**: 2025年11月24日

---

## 🎯 目的

複数の会社（法人）が同じシステムを利用できるようにし、各社のデータを完全に分離する。

---

## 📊 データ構造の設計

### 階層構造

```
┌─────────────────────────────────────┐
│  複数の会社が利用                      │
├─────────────────────────────────────┤
│                                     │
│  Company A (会社A)                  │
│  ├─ 営業部                          │
│  │  ├─ ユーザー1                    │
│  │  ├─ ユーザー2                    │
│  │  └─ ナレッジ（営業部専用）       │
│  ├─ 総務部                          │
│  │  ├─ ユーザー3                    │
│  │  └─ ナレッジ（総務部専用）       │
│  └─ 全社共有ナレッジ                │
│                                     │
│  Company B (会社B)                  │
│  ├─ 開発部                          │
│  │  ├─ ユーザー4                    │
│  │  └─ ナレッジ（開発部専用）       │
│  └─ 全社共有ナレッジ                │
│                                     │
└─────────────────────────────────────┘
```

---

## 🗄️ データベース設計

### 1. companies テーブル（新規作成）

会社（法人）の情報を管理

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE, -- 例: company-a, company-b
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**例**:
- Company A: `subdomain = 'company-a'` → `https://company-a.yourapp.com`
- Company B: `subdomain = 'company-b'` → `https://company-b.yourapp.com`

---

### 2. departments テーブル（新規作成）

部署の情報を管理

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 例: 営業部、総務部、開発部
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 3. users テーブル（拡張）

既存のSupabase Authのusersテーブルに、会社と部署の情報を追加

```sql
-- Supabase Authのusersテーブルは変更できないため、
-- プロフィール情報を格納する profiles テーブルを作成

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 4. knowledge_items テーブル（拡張）

ナレッジベースに会社と部署の情報を追加

```sql
ALTER TABLE knowledge_items
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
ADD COLUMN visibility TEXT DEFAULT 'company';
-- 'company': 全社共有, 'department': 部署内共有, 'private': 個人
```

**visibility（公開範囲）**:
- `company`: 同じ会社の全員が閲覧可能
- `department`: 同じ部署のメンバーのみ閲覧可能
- `private`: 作成者のみ閲覧可能

---

### 5. chat_conversations & chat_messages テーブル（拡張）

チャット履歴に会社情報を追加

```sql
ALTER TABLE chat_conversations
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE chat_messages
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
```

---

### 6. folders テーブル（拡張）

フォルダーに会社と部署の情報を追加

```sql
ALTER TABLE folders
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
```

---

## 🔐 Row Level Security (RLS) ポリシー

各テーブルに、会社単位でデータを分離するRLSポリシーを設定

### knowledge_items のRLSポリシー例

```sql
-- ユーザーは自分の会社のナレッジのみ閲覧可能
CREATE POLICY "Users can view knowledge items in their company"
ON knowledge_items
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
  AND (
    visibility = 'company'
    OR (visibility = 'department' AND department_id IN (
      SELECT department_id FROM profiles WHERE id = auth.uid()
    ))
    OR (visibility = 'private' AND user_id = auth.uid())
  )
);

-- ユーザーは自分の会社にナレッジを作成可能
CREATE POLICY "Users can create knowledge items in their company"
ON knowledge_items
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- ユーザーは自分が作成したナレッジを更新可能
CREATE POLICY "Users can update their own knowledge items"
ON knowledge_items
FOR UPDATE
USING (user_id = auth.uid());

-- ユーザーは自分が作成したナレッジを削除可能
CREATE POLICY "Users can delete their own knowledge items"
ON knowledge_items
FOR DELETE
USING (user_id = auth.uid());
```

---

## 🔄 実装の流れ

### Phase 1: データベース構造の変更（Version 2.0で実装予定）

1. **テーブル作成**
   - `companies` テーブル
   - `departments` テーブル
   - `profiles` テーブル

2. **既存テーブルの拡張**
   - `knowledge_items` に `company_id`, `department_id`, `visibility` を追加
   - `chat_conversations` に `company_id` を追加
   - `chat_messages` に `company_id` を追加
   - `folders` に `company_id`, `department_id` を追加

3. **RLSポリシーの設定**
   - 各テーブルにRLSポリシーを追加

---

### Phase 2: 認証フローの変更（Version 2.0で実装予定）

#### 現在の認証フロー
```
ユーザー登録 → ログイン → システム利用
```

#### 新しい認証フロー
```
1. 会社登録（管理者）
   ↓
2. 会社のサブドメイン作成
   例: company-a.yourapp.com
   ↓
3. 社員がそのサブドメインでユーザー登録
   ↓
4. 管理者が社員を部署に割り当て
   ↓
5. 社員がログイン → 自分の会社のデータのみ閲覧可能
```

---

### Phase 3: UI/UX の変更（Version 2.0で実装予定）

#### 1. 会社登録画面の追加
- 会社名、サブドメインを入力
- 管理者アカウントを作成

#### 2. 部署管理画面の追加
- 部署の作成、編集、削除
- 社員を部署に割り当て

#### 3. ナレッジ作成時に公開範囲を選択
- 全社共有
- 部署内共有
- 個人（非公開）

#### 4. ナレッジ一覧に公開範囲を表示
- アイコンで視覚的に表示
  - 🏢 全社共有
  - 👥 部署内共有
  - 🔒 個人

---

## 💡 使用例

### 例1: 営業部のナレッジを部署内共有

```
1. 営業部のユーザーAがナレッジを作成
2. 公開範囲を「部署内共有」に設定
3. 営業部のメンバー全員が閲覧可能
4. 他の部署（総務部など）は閲覧不可
```

### 例2: 全社共有のナレッジ

```
1. 管理者がナレッジを作成
2. 公開範囲を「全社共有」に設定
3. 同じ会社の全員が閲覧可能
4. 他の会社のユーザーは閲覧不可
```

### 例3: AIチャットでの検索

```
ユーザーA（営業部）が質問:
「契約書のテンプレートはありますか？」

AIの動作:
1. ユーザーAの会社IDを取得
2. 会社内のナレッジを検索
   - 全社共有のナレッジ
   - 営業部のナレッジ
   - ユーザーAの個人ナレッジ
3. 関連するナレッジを参照して回答
```

---

## 🎯 メリット

### 1. データの完全分離
- 各会社のデータは完全に分離
- セキュリティとプライバシーを確保

### 2. 柔軟なアクセス制御
- 全社共有、部署内共有、個人のナレッジを柔軟に管理
- 必要な人だけが必要な情報にアクセス

### 3. スケーラビリティ
- 新しい会社を簡単に追加可能
- 1つのシステムで複数の会社を管理

### 4. SaaS化
- サブドメインで各会社を識別
- SaaSビジネスモデルに最適

---

## 🚧 注意事項

### 1. データ移行
現在のユーザーデータを新しい構造に移行する必要がある

```sql
-- 既存ユーザーをデフォルト会社に割り当て
INSERT INTO companies (id, name, subdomain)
VALUES ('default-company-id', 'Default Company', 'default');

INSERT INTO profiles (id, company_id, user_name)
SELECT id, 'default-company-id', email
FROM auth.users;
```

### 2. パフォーマンス
- RLSポリシーによりクエリが複雑化
- インデックスを適切に設定する必要がある

```sql
CREATE INDEX idx_knowledge_items_company_id ON knowledge_items(company_id);
CREATE INDEX idx_knowledge_items_department_id ON knowledge_items(department_id);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
```

### 3. テスト
- 会社間のデータ分離が正しく機能するか徹底的にテスト
- 異なる会社のユーザーで動作確認

---

## 📅 実装スケジュール

### Version 2.0（予定）
- データベース構造の変更
- RLSポリシーの設定
- 認証フローの変更
- UI/UXの変更

### テストフェーズ
- 複数の会社でテスト
- データ分離の確認
- パフォーマンスの確認

---

## 🔗 関連ドキュメント

- [VERSIONS.md](./VERSIONS.md) - バージョン管理
- [ROADMAP.md](../ROADMAP.md) - 開発ロードマップ
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

---

**最終更新**: 2025年11月24日
