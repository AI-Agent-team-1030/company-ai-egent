# 削除された機能の詳細バックアップ

このドキュメントは、Version 1.0 (MVP) で削除された機能の詳細情報と復元手順を記録しています。

**削除日時**: 2025年11月24日
**理由**: MVP版として最小限の機能に絞り込むため

---

## 📂 アーカイブ構造

```
_archive/
├── v2_features/           # Version 2.0で復元する機能
│   ├── dashboard/         # ホーム/ダッシュボード
│   ├── analytics/         # アナリティクス（dashboardに統合済み）
│   ├── documents/         # ドキュメント管理
│   ├── organization/      # 組織図
│   └── notifications/     # 通知
│
└── v3_features/           # Version 3.0で復元する機能
    ├── goals/             # ゴール管理
    ├── agents/            # AIエージェント
    └── simple-agent/      # シンプルエージェント
```

---

## 🔄 Version 2.0 で復元する機能

### 1. ホーム/ダッシュボード 📊

**場所**: `_archive/v2_features/dashboard/`

**機能**:
- 組織の健康状態を一目で確認
- 主要指標（タスク完了率、稼働AI数、組織効率、KPI達成率など）
- 部門別パフォーマンスとAI稼働率のグラフ
- AIエージェントの活動状況
- 詳細なインサイトと分析結果
- 具体的な提案・アクションプラン

**復元手順**:
1. `_archive/v2_features/dashboard/` を `app/(app)/dashboard/` にコピー
2. `components/ui/Sidebar.tsx` に以下を追加:
   ```typescript
   { name: 'ホーム', href: '/dashboard', icon: HomeIcon },
   ```
3. 必要なアイコンをインポート: `HomeIcon`

**依存関係**:
- `recharts` - データ可視化
- `framer-motion` - アニメーション

---

### 2. アナリティクス 📈

**場所**: `_archive/v2_features/analytics/`

**注意**: Version 1.0でdashboardに統合済み。独立ページとして復元したい場合のみ使用。

**機能**:
- 詳細なビジネスメトリクス分析
- 主要インサイトカード
- データ可視化グラフ
- 具体的な提案・アクションプラン

**復元手順**:
1. `_archive/v2_features/analytics/` を `app/(app)/analytics/` にコピー
2. `components/ui/Sidebar.tsx` に以下を追加:
   ```typescript
   { name: 'アナリティクス', href: '/analytics', icon: ChartBarIcon },
   ```
3. 必要なアイコンをインポート: `ChartBarIcon`

---

### 3. ドキュメント管理 📄

**場所**: `_archive/v2_features/documents/`

**機能**:
- レポート、提案書、マニュアル、契約書の管理
- タイプ別フィルタリング
- 部門別の分類
- バージョン管理
- 公開/下書きのステータス管理

**復元手順**:
1. `_archive/v2_features/documents/` を `app/(app)/documents/` にコピー
2. `components/ui/Sidebar.tsx` に以下を追加:
   ```typescript
   { name: 'ドキュメント', href: '/documents', icon: DocumentTextIcon },
   ```
3. データベーステーブル `documents` が必要
4. 必要なアイコンをインポート: `DocumentTextIcon`

**データベース構造**:
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT, -- 'report', 'proposal', 'manual', 'contract'
  department TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'published'
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 4. 組織図 🏢

**場所**: `_archive/v2_features/organization/`

**機能**:
- 組織構造の可視化
- 部門とメンバーの管理
- 役割と権限の設定
- マインドマップ形式の表示

**復元手順**:
1. `_archive/v2_features/organization/` を `app/(app)/organization/` にコピー
2. `components/ui/Sidebar.tsx` に以下を追加:
   ```typescript
   { name: '組織図', href: '/organization', icon: Squares2X2Icon },
   ```
3. 必要なアイコンをインポート: `Squares2X2Icon`

**依存関係**:
- 組織図の可視化ライブラリ（必要に応じて）

---

### 5. 通知 🔔

**場所**: `_archive/v2_features/notifications/`

**機能**:
- システムからのリアルタイム通知
- 未読/既読の管理
- タイプ別アイコン表示（成功、警告、情報）

**復元手順**:
1. `_archive/v2_features/notifications/` を `app/(app)/notifications/` にコピー
2. `components/ui/Sidebar.tsx` に以下を追加:
   ```typescript
   { name: '通知', href: '/notifications', icon: BellIcon },
   ```
3. データベーステーブル `notifications` が必要
4. 必要なアイコンをインポート: `BellIcon`

**データベース構造**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT, -- 'success', 'warning', 'info'
  read BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 Version 3.0 で復元する機能

### 6. ゴール管理 🎯

**場所**: `_archive/v3_features/goals/`

**機能**:
- プロジェクトゴールの設定と追跡
- 進捗の可視化
- 関連タスクの管理
- 期限とマイルストーンの管理

**復元手順**:
1. `_archive/v3_features/goals/` を `app/(app)/goals/` にコピー
2. タスク管理機能と統合する場合は `app/(app)/tasks/` に統合
3. `components/ui/Sidebar.tsx` に以下を追加:
   ```typescript
   { name: 'タスク管理', href: '/tasks', icon: ClipboardDocumentListIcon },
   ```
4. データベーステーブル `goals` と `tasks` が必要
5. 必要なアイコンをインポート: `ClipboardDocumentListIcon`

**データベース構造**:
```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 7. AIエージェント 🤖

**場所**: `_archive/v3_features/agents/`

**機能**:
- 複数のAIエージェントの管理
- エージェント間の自動連携
- タスクの自動分配と実行
- エージェントの稼働状況モニタリング
- カスタムエージェントの作成

**復元手順**:
1. `_archive/v3_features/agents/` を `app/(app)/agents/` にコピー
2. `components/ui/Sidebar.tsx` に以下を追加:
   ```typescript
   { name: 'AIエージェント', href: '/agents', icon: SparklesIcon },
   ```
3. データベーステーブル `agents` が必要
4. エージェント実行のバックエンドロジックが必要
5. 必要なアイコンをインポート: `SparklesIcon`

**データベース構造**:
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  status TEXT DEFAULT 'idle', -- 'idle', 'active', 'error'
  model TEXT DEFAULT 'claude-3-opus-20240229',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 8. シンプルエージェント 🔮

**場所**: `_archive/v3_features/simple-agent/`

**機能**:
- 軽量なAIエージェント機能
- 特定タスクに特化したエージェント
- 素早い応答と実行

**復元手順**:
1. `_archive/v3_features/simple-agent/` を `app/(app)/simple-agent/` にコピー
2. または `agents/` に統合
3. `components/ui/Sidebar.tsx` に以下を追加:
   ```typescript
   { name: 'シンプルエージェント', href: '/simple-agent', icon: CubeTransparentIcon },
   ```
4. 必要なアイコンをインポート: `CubeTransparentIcon`

---

## 🔧 共通の復元手順

### ステップ1: アーカイブから復元
```bash
# Version 2.0の機能を復元する場合
cp -r _archive/v2_features/dashboard app/(app)/

# Version 3.0の機能を復元する場合
cp -r _archive/v3_features/goals app/(app)/
```

### ステップ2: Sidebarを更新
`components/ui/Sidebar.tsx` のnavigation配列に必要なメニュー項目を追加

### ステップ3: 必要なアイコンをインポート
```typescript
import {
  HomeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  BellIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  CubeTransparentIcon,
} from '@heroicons/react/24/outline'
```

### ステップ4: データベースマイグレーション
必要に応じて、Supabaseでテーブルを作成

### ステップ5: 動作確認
```bash
npm run dev
```

---

## 📊 機能ごとの復元優先度

### 高優先度（Version 2.0で推奨）
1. ホーム/ダッシュボード - 組織の可視化に必須
2. ドキュメント管理 - ナレッジと連携
3. 通知 - ユーザーエンゲージメント向上

### 中優先度（必要に応じて）
4. 組織図 - 大規模組織で有用
5. アナリティクス - より詳細な分析が必要な場合

### 低優先度（Version 3.0で推奨）
6. ゴール管理 - タスク管理と統合して実装
7. AIエージェント - 自動化機能が必要な場合
8. シンプルエージェント - エージェント機能と統合

---

## 🎯 復元時の注意事項

1. **依存関係の確認**: 各機能が必要とするライブラリやデータベーステーブルを確認
2. **段階的な復元**: 一度にすべて復元せず、段階的に実装
3. **テスト**: 各機能を復元後、十分にテストを実施
4. **ドキュメント更新**: README.mdとROADMAP.mdを更新

---

## 📝 復元履歴

| 日時 | 復元した機能 | バージョン | 担当者 | 備考 |
|------|------------|-----------|--------|------|
| - | - | - | - | - |

---

## 🔗 関連ドキュメント

- [VERSIONS.md](../VERSIONS.md) - バージョン管理全体像
- [RESTORATION_GUIDE.md](./RESTORATION_GUIDE.md) - 詳細な復元ガイド
- [ROADMAP.md](../../ROADMAP.md) - 開発ロードマップ

---

**最終更新**: 2025年11月24日
