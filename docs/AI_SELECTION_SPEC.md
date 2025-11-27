# AI選択機能 仕様書（2025年11月最新版）

## 📋 概要

ユーザーが使用するAIモデルを選択できる機能。コスト、速度、精度のバランスを考慮して最適なモデルを選べるようにする。

**優先度**: 🔥 **高**
**実装難易度**: ⭐⭐ (比較的簡単、すぐできる)
**ビジネス価値**: 顧客の選択肢を増やし、コスト最適化を実現

---

## 🎯 目的

1. **コスト最適化**: 用途に応じて安価なモデルを選択可能に
2. **速度重視**: 日常的なチャットには最速のClaude Haiku 4.5を使用
3. **精度重視**: 重要なタスクにはClaude Opus 4.1やGPT-5を使用
4. **ベンダーロックイン回避**: 複数のLLMプロバイダーに対応

---

## 🏗️ アーキテクチャ

### データベース設計

#### 1. `company_settings` テーブル（拡張）

```sql
-- 既存テーブルに列を追加
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100) DEFAULT 'claude-sonnet-4-5';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50) DEFAULT 'anthropic';

-- company_settings テーブル構造
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ai_model VARCHAR(100) DEFAULT 'claude-sonnet-4-5',
  ai_provider VARCHAR(50) DEFAULT 'anthropic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);
```

#### 2. `api_keys` テーブル（新規作成）

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'anthropic', 'openai', 'google'
  api_key_encrypted TEXT NOT NULL, -- 暗号化されたAPIキー
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, provider)
);

-- RLS (Row Level Security) ポリシー
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 会社管理者のみ閲覧・編集可能
CREATE POLICY "Company admins can view api_keys"
  ON api_keys FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE id = auth.uid() AND role = 'company_admin'
    )
  );

CREATE POLICY "Company admins can update api_keys"
  ON api_keys FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users
      WHERE id = auth.uid() AND role = 'company_admin'
    )
  );
```

---

## 🎨 UI設計

### 設定画面 (`/settings`)

#### レイアウト

```
┌─────────────────────────────────────────────────────┐
│ 設定                                                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─ AI設定 ──────────────────────────────────┐   │
│  │                                             │   │
│  │  使用するAIモデル                           │   │
│  │  ┌──────────────────────────────────┐     │   │
│  │  │ Claude Sonnet 4.5 (推奨)          │ ▼   │   │
│  │  └──────────────────────────────────┘     │   │
│  │                                             │   │
│  │  【Anthropic (Claude)】                    │   │
│  │  👑 Claude Opus 4.1                        │   │
│  │     最高性能、SWE-bench 74.5%              │   │
│  │     💰 コスト: 高（$15/1M入力）            │   │
│  │                                             │   │
│  │  ⚡ Claude Sonnet 4.5                      │   │
│  │     世界最高のコーディングモデル            │   │
│  │     💰 コスト: 中（$3/1M入力）             │   │
│  │                                             │   │
│  │  🚀 Claude Haiku 4.5 (推奨)                │   │
│  │     最速、Sonnet 4レベル、1/3コスト        │   │
│  │     💰 コスト: 低（$1/1M入力）             │   │
│  │                                             │   │
│  │  【OpenAI】                                 │   │
│  │  🌟 GPT-5.1                                │   │
│  │     最新、アダプティブ推論                  │   │
│  │     💰 コスト: 中（$1.25/1M入力）          │   │
│  │                                             │   │
│  │  🔸 GPT-5                                  │   │
│  │     最高の知能、94.6% AIME 2025            │   │
│  │     💰 コスト: 中（$1.25/1M入力）          │   │
│  │                                             │   │
│  │  🔹 GPT-5 Mini                             │   │
│  │     軽量、高速                              │   │
│  │     💰 コスト: 低（$0.25/1M入力）          │   │
│  │                                             │   │
│  │  📦 GPT-5 Nano                             │   │
│  │     超軽量、超低コスト                      │   │
│  │     💰 コスト: 超低（$0.05/1M入力）        │   │
│  │                                             │   │
│  │  【Google】                                 │   │
│  │  💎 Gemini 3                               │   │
│  │     最新、SOTA推論、1487 Elo WebDev        │   │
│  │     💰 コスト: 中（$2/1M入力）             │   │
│  │                                             │   │
│  │  💎 Gemini 2.5 Pro                         │   │
│  │     思考機能付き、最高性能                  │   │
│  │     💰 コスト: 高                          │   │
│  │                                             │   │
│  │  ⚡ Gemini 2.5 Flash                       │   │
│  │     低遅延、コスト効率、54% SWE-bench      │   │
│  │     💰 コスト: 低                          │   │
│  │                                             │   │
│  └─────────────────────────────────────────┘   │
│                                                      │
│  ┌─ APIキー設定 ───────────────────────────┐   │
│  │                                             │   │
│  │  Anthropic (Claude)                         │   │
│  │  ┌──────────────────────────────────┐     │   │
│  │  │ sk-ant-api03-••••••••              │ 👁   │   │
│  │  └──────────────────────────────────┘     │   │
│  │  [テスト接続]                              │   │
│  │                                             │   │
│  │  OpenAI (GPT)                               │   │
│  │  ┌──────────────────────────────────┐     │   │
│  │  │ 未設定                              │      │   │
│  │  └──────────────────────────────────┘     │   │
│  │  [テスト接続]                              │   │
│  │                                             │   │
│  │  Google (Gemini)                            │   │
│  │  ┌──────────────────────────────────┐     │   │
│  │  │ 未設定                              │      │   │
│  │  └──────────────────────────────────┘     │   │
│  │  [テスト接続]                              │   │
│  │                                             │   │
│  └─────────────────────────────────────────┘   │
│                                                      │
│  [保存]                                              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 バックエンド実装

### 1. LLMプロバイダー抽象化レイヤー

```typescript
// lib/ai/types.ts
export type AIProvider = 'anthropic' | 'openai' | 'google';

export type AIModel =
  // Anthropic (Claude)
  | 'claude-opus-4-1'
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5'
  | 'claude-sonnet-4'
  | 'claude-opus-4'
  // OpenAI (GPT)
  | 'gpt-5.1'
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  // Google (Gemini)
  | 'gemini-3'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite';

export interface AIConfig {
  provider: AIProvider;
  model: AIModel;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
```

### 2. ベースAIクライアント

```typescript
// lib/ai/base-client.ts
export abstract class BaseAIClient {
  protected config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  abstract chat(messages: AIMessage[]): Promise<AIResponse>;
  abstract streamChat(messages: AIMessage[]): AsyncGenerator<string>;
  abstract testConnection(): Promise<boolean>;
}
```

### 3. Anthropic クライアント

```typescript
// lib/ai/anthropic-client.ts
import Anthropic from '@anthropic-ai/sdk';
import { BaseAIClient } from './base-client';

export class AnthropicClient extends BaseAIClient {
  private client: Anthropic;

  constructor(config: AIConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature || 0.7,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    });

    return {
      content: response.content[0].type === 'text'
        ? response.content[0].text
        : '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async *streamChat(messages: AIMessage[]): AsyncGenerator<string> {
    const stream = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens || 4096,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.chat([{ role: 'user', content: 'test' }]);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 4. OpenAI クライアント

```typescript
// lib/ai/openai-client.ts
import OpenAI from 'openai';
import { BaseAIClient } from './base-client';

export class OpenAIClient extends BaseAIClient {
  private client: OpenAI;

  constructor(config: AIConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: messages,
      max_tokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature || 0.7,
    });

    return {
      content: response.choices[0].message.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }

  async *streamChat(messages: AIMessage[]): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: messages,
      max_tokens: this.config.maxTokens || 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.chat([{ role: 'user', content: 'test' }]);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 5. Google クライアント

```typescript
// lib/ai/google-client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIClient } from './base-client';

export class GoogleClient extends BaseAIClient {
  private client: GoogleGenerativeAI;

  constructor(config: AIConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
    });

    const prompt = messages.map(m => m.content).join('\n\n');
    const result = await model.generateContent(prompt);
    const response = result.response;

    return {
      content: response.text(),
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }

  async *streamChat(messages: AIMessage[]): AsyncGenerator<string> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
    });

    const prompt = messages.map(m => m.content).join('\n\n');
    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.chat([{ role: 'user', content: 'test' }]);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 6. AIクライアント ファクトリー

```typescript
// lib/ai/client-factory.ts
import { BaseAIClient } from './base-client';
import { AnthropicClient } from './anthropic-client';
import { OpenAIClient } from './openai-client';
import { GoogleClient } from './google-client';
import { AIConfig } from './types';

export class AIClientFactory {
  static create(config: AIConfig): BaseAIClient {
    switch (config.provider) {
      case 'anthropic':
        return new AnthropicClient(config);
      case 'openai':
        return new OpenAIClient(config);
      case 'google':
        return new GoogleClient(config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }
}
```

### 7. 設定取得ヘルパー

```typescript
// lib/ai/get-ai-config.ts
import { createClient } from '@/lib/supabase/server';
import { AIConfig } from './types';
import { decryptAPIKey } from '@/lib/crypto/encryption';

export async function getAIConfig(companyId: string): Promise<AIConfig> {
  const supabase = createClient();

  // 会社設定を取得
  const { data: settings } = await supabase
    .from('company_settings')
    .select('ai_model, ai_provider')
    .eq('company_id', companyId)
    .single();

  const provider = settings?.ai_provider || 'anthropic';
  const model = settings?.ai_model || 'claude-sonnet-4-5';

  // APIキーを取得（復号化）
  const { data: keyData } = await supabase
    .from('api_keys')
    .select('api_key_encrypted')
    .eq('company_id', companyId)
    .eq('provider', provider)
    .eq('is_active', true)
    .single();

  if (!keyData?.api_key_encrypted) {
    throw new Error('API key not configured');
  }

  const apiKey = await decryptAPIKey(keyData.api_key_encrypted);

  return {
    provider,
    model,
    apiKey,
  };
}
```

---

## 🔐 セキュリティ

### APIキーの暗号化

```typescript
// lib/crypto/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32バイトの秘密鍵

export function encryptAPIKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // IV + AuthTag + 暗号化データ を結合
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decryptAPIKey(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

---

## 💰 コスト比較表（2025年11月最新版）

| モデル | プロバイダー | 入力単価 (1M tokens) | 出力単価 (1M tokens) | 速度 | 推奨用途 |
|--------|--------------|----------------------|----------------------|------|----------|
| **Claude Opus 4.1** | Anthropic | $15 | $75 | 中速 | 最高性能、SWE-bench 74.5% |
| **Claude Sonnet 4.5** | Anthropic | $3 | $15 | 中速 | 世界最高のコーディング |
| **Claude Haiku 4.5** ⭐ | Anthropic | **$1** | **$5** | **最速** | **日常チャット、コスパ最強** |
| **GPT-5.1** | OpenAI | $1.25 | $10 | 中速 | アダプティブ推論 |
| **GPT-5** | OpenAI | $1.25 | $10 | 中速 | 最高の知能、AIME 94.6% |
| **GPT-5 Mini** | OpenAI | $0.25 | $2 | 高速 | 軽量、高速 |
| **GPT-5 Nano** | OpenAI | **$0.05** | **$0.40** | 超高速 | 超低コスト |
| **Gemini 3** 🆕 | Google | $2 | $12 | 中速 | SOTA推論、WebDev 1487 Elo |
| **Gemini 2.5 Pro** | Google | 未公開 | 未公開 | 中速 | 思考機能付き |
| **Gemini 2.5 Flash** | Google | 未公開 | 未公開 | 高速 | SWE-bench 54%、低コスト |

**推奨設定**:
- **日常的な社内チャット** → **Claude Haiku 4.5**（最速 + コスト効率◎）
- **重要な経営判断、分析** → **Claude Opus 4.1** または **GPT-5**
- **コーディング** → **Claude Sonnet 4.5**（世界最高）
- **超低コスト大量処理** → **GPT-5 Nano**（$0.05/1M）
- **最新技術、推論** → **Gemini 3**（SOTA）

---

## 📊 モデル選択ガイド

### ユースケース別推奨モデル

```typescript
// lib/ai/model-recommendations.ts
export const MODEL_RECOMMENDATIONS = {
  // 日常的な社内チャットボット（最優先）
  daily_chat: {
    primary: 'claude-haiku-4-5',
    alternative: 'gpt-5-mini',
    reason: '最速で低コスト、日常会話に最適',
  },

  // 重要な経営判断、戦略立案
  strategic_analysis: {
    primary: 'claude-opus-4-1',
    alternative: 'gpt-5',
    reason: '最高性能、SWE-bench 74.5%',
  },

  // コーディング、技術タスク
  coding: {
    primary: 'claude-sonnet-4-5',
    alternative: 'gemini-3',
    reason: '世界最高のコーディングモデル',
  },

  // 最新技術、推論
  reasoning: {
    primary: 'gemini-3',
    alternative: 'gpt-5.1',
    reason: 'SOTA推論、アダプティブ思考',
  },

  // 大規模テキスト処理、バッチ処理
  bulk_processing: {
    primary: 'gpt-5-nano',
    alternative: 'gemini-2.5-flash',
    reason: '超低コスト（$0.05/1M）',
  },
};
```

---

## ✅ 実装チェックリスト

### Week 1-2: 基本実装

- [ ] **データベース**
  - [ ] `company_settings` テーブルに `ai_model`, `ai_provider` 列を追加
  - [ ] `api_keys` テーブルを作成
  - [ ] RLSポリシーを設定

- [ ] **暗号化**
  - [ ] 暗号化/復号化関数を実装 (`lib/crypto/encryption.ts`)
  - [ ] `.env` に `ENCRYPTION_KEY` を追加（32バイトのランダムキー）

- [ ] **AI抽象化レイヤー**
  - [ ] `BaseAIClient` 抽象クラス作成
  - [ ] `AnthropicClient` 実装（Claude Opus 4.1, Sonnet 4.5, Haiku 4.5対応）
  - [ ] `OpenAIClient` 実装（GPT-5.1, GPT-5, GPT-5 Mini, GPT-5 Nano対応）
  - [ ] `GoogleClient` 実装（Gemini 3, Gemini 2.5 Pro, 2.5 Flash対応）
  - [ ] `AIClientFactory` 実装
  - [ ] `getAIConfig()` ヘルパー実装

- [ ] **API Routes**
  - [ ] `GET /api/settings/ai` - AI設定取得
  - [ ] `POST /api/settings/ai` - AI設定更新
  - [ ] `POST /api/settings/api-key` - APIキー保存
  - [ ] `POST /api/settings/test-connection` - 接続テスト

- [ ] **UI**
  - [ ] 設定ページに AI モデル選択ドロップダウン追加（全モデル対応）
  - [ ] APIキー入力フォーム作成（Anthropic, OpenAI, Google）
  - [ ] テスト接続ボタン実装
  - [ ] 保存ボタン実装

### Week 3: 統合とテスト

- [ ] **既存機能との統合**
  - [ ] AIチャット (`/api/chat`) で選択されたモデルを使用
  - [ ] エージェント実行で選択されたモデルを使用

- [ ] **テスト（全プロバイダー）**
  - [ ] Claude Opus 4.1 で接続テスト
  - [ ] Claude Sonnet 4.5 で接続テスト
  - [ ] Claude Haiku 4.5 で接続テスト
  - [ ] GPT-5.1 で接続テスト
  - [ ] GPT-5 で接続テスト
  - [ ] GPT-5 Mini で接続テスト
  - [ ] GPT-5 Nano で接続テスト
  - [ ] Gemini 3 で接続テスト
  - [ ] Gemini 2.5 Pro で接続テスト
  - [ ] Gemini 2.5 Flash で接続テスト
  - [ ] 暗号化/復号化のテスト
  - [ ] 権限テスト（一般ユーザーは設定変更不可）

- [ ] **ドキュメント**
  - [ ] README に AI モデル選択機能を追加
  - [ ] 環境変数の設定方法をドキュメント化

---

## 🚀 将来的な拡張

1. **ユーザーレベルでの選択**
   - 会社全体ではなく、ユーザーごとにモデルを選択可能に

2. **自動切り替え**
   - タスクの種類によって自動的に最適なモデルを選択
   - 例: 簡単な質問 → Haiku、複雑な分析 → Opus 4.1、コーディング → Sonnet 4.5

3. **Fine-tuned モデル対応**
   - カスタムチューニングされたモデルの利用

4. **使用量ダッシュボード**
   - モデルごとの使用量、コストを可視化
   - 月次レポート生成
   - コスト予測

5. **マルチモーダル対応**
   - GPT-5の画像/音声入力対応
   - Gemini 3の動画分析機能

---

## 📝 注意事項

1. **APIキーのセキュリティ**
   - APIキーは必ず暗号化して保存
   - `.env` の `ENCRYPTION_KEY` は絶対に外部に漏らさない
   - GitHub にコミットしない

2. **権限管理**
   - AI設定の変更は会社管理者のみ
   - RLSポリシーで確実に制限

3. **エラーハンドリング**
   - APIキーが無効な場合の適切なエラーメッセージ
   - レート制限に対する処理

4. **パフォーマンス**
   - AIクライアントのインスタンスをキャッシュ
   - 不要なAPI呼び出しを避ける

---

## 🎯 成功指標

- ✅ 会社管理者がUIから簡単にAIモデルを切り替え可能
- ✅ APIキーが安全に暗号化されて保存される
- ✅ Claude、OpenAI、Google全て正常に動作
- ✅ ストリーミングレスポンスが正常に機能
- ✅ 設定変更が即座に反映される
- ✅ コスト最適化が実現できる（日常利用でHaiku 4.5、重要タスクでOpus 4.1）

---

## 📚 参考資料（2025年11月最新）

### Anthropic (Claude)
- [Claude Opus 4.1 - Anthropic](https://www.anthropic.com/news/claude-opus-4-1)
- [Claude Sonnet 4.5 - Anthropic](https://www.anthropic.com/news/claude-sonnet-4-5)
- [Claude Haiku 4.5 - Anthropic](https://www.anthropic.com/news/claude-haiku-4-5)
- [Models overview - Claude Docs](https://docs.anthropic.com/en/docs/about-claude/models/overview)

### OpenAI (GPT)
- [Introducing GPT-5 - OpenAI](https://openai.com/index/introducing-gpt-5/)
- [Introducing GPT-5.1 for developers - OpenAI](https://openai.com/index/gpt-5-1-for-developers/)
- [Models - OpenAI API](https://platform.openai.com/docs/models)

### Google (Gemini)
- [Gemini 3: Latest Gemini AI model - Google](https://blog.google/products/gemini/gemini-3/)
- [Gemini models - Google AI](https://ai.google.dev/gemini-api/docs/models)
- [Gemini 2.5 Flash updates - Google Developers](https://developers.googleblog.com/en/continuing-to-bring-you-our-latest-models-with-an-improved-gemini-2-5-flash-and-flash-lite-release/)

---

## 🔄 変更履歴

### 2025年11月版の主な変更
- ✅ Gemini 3追加（2025年11月18日リリース）
- ✅ GPT-5.1追加（2025年11月13日リリース）
- ✅ GPT-5、GPT-5 Mini、GPT-5 Nano追加
- ✅ Claude Opus 4.1追加
- ❌ DeepSeek、Ollamaを削除（要望により）
- 📊 コスト比較表を最新版に更新
- 📚 参考資料を最新版に更新
