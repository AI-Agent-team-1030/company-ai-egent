import { Task, KnowledgeItem, Document, Notification, ExecutiveDirective, AIAgent } from '@/types'

// ユーザーデータ
export const mockUsers = [
  {
    id: '1',
    name: '山田 太郎',
    email: 'yamada@company.com',
    role: 'executive' as const,
    department: undefined,
    avatar: '👔',
  },
  {
    id: '2',
    name: '佐藤 花子',
    email: 'sato@company.com',
    role: 'department' as const,
    department: 'sales' as const,
    avatar: '👩‍💼',
  },
  {
    id: '3',
    name: '鈴木 一郎',
    email: 'suzuki@company.com',
    role: 'department' as const,
    department: 'hr' as const,
    avatar: '👨‍💼',
  },
]

// AIエージェントデータ
export const mockAgents: AIAgent[] = [
  {
    id: 'agent-1',
    name: '経営AI',
    type: 'executive',
    status: 'active',
    lastActive: new Date(),
  },
  {
    id: 'agent-2',
    name: '営業AI',
    type: 'department',
    department: 'sales',
    status: 'active',
    lastActive: new Date(),
  },
  {
    id: 'agent-3',
    name: '人事AI',
    type: 'department',
    department: 'hr',
    status: 'active',
    lastActive: new Date(),
  },
  {
    id: 'agent-4',
    name: '財務AI',
    type: 'department',
    department: 'finance',
    status: 'active',
    lastActive: new Date(),
  },
  {
    id: 'agent-5',
    name: '開発AI',
    type: 'department',
    department: 'development',
    status: 'idle',
    lastActive: new Date(Date.now() - 3600000),
  },
  {
    id: 'agent-6',
    name: 'マーケティングAI',
    type: 'department',
    department: 'marketing',
    status: 'active',
    lastActive: new Date(),
  },
  {
    id: 'agent-7',
    name: '総務AI',
    type: 'department',
    department: 'general_affairs',
    status: 'idle',
    lastActive: new Date(Date.now() - 7200000),
  },
  {
    id: 'agent-8',
    name: '統合AI',
    type: 'integration',
    status: 'active',
    lastActive: new Date(),
  },
]

// 経営指示データ
export const mockDirectives: ExecutiveDirective[] = [
  {
    id: 'dir-1',
    title: '新規顧客獲得の強化',
    content: '今期は新規顧客獲得を強化し、売上を前年比120%に引き上げる。特にエンタープライズ顧客の開拓に注力する。',
    createdBy: '1',
    createdAt: new Date('2024-11-01'),
    status: 'active',
    relatedTasks: ['task-1', 'task-2', 'task-3'],
    kpis: [
      { id: 'kpi-1', name: '新規リード数', target: 100, current: 65, unit: '件', department: 'sales' },
      { id: 'kpi-2', name: '成約率', target: 25, current: 18, unit: '%', department: 'sales' },
      { id: 'kpi-3', name: '採用人数', target: 5, current: 2, unit: '名', department: 'hr' },
    ],
  },
  {
    id: 'dir-2',
    title: 'コスト削減プロジェクト',
    content: '全部門でコスト構造を見直し、年間で15%のコスト削減を実現する。業務プロセスの自動化とツール統合を推進。',
    createdBy: '1',
    createdAt: new Date('2024-10-25'),
    status: 'active',
    relatedTasks: ['task-5', 'task-18'],
    kpis: [
      { id: 'kpi-4', name: 'コスト削減額', target: 300, current: 120, unit: '万円', department: 'finance' },
      { id: 'kpi-5', name: '自動化プロセス数', target: 10, current: 4, unit: '件', department: 'general_affairs' },
    ],
  },
  {
    id: 'dir-3',
    title: '新製品開発の加速',
    content: '市場投入までの期間を30%短縮し、顧客フィードバックを即座にプロダクトに反映する体制を構築。',
    createdBy: '1',
    createdAt: new Date('2024-10-20'),
    status: 'active',
    relatedTasks: ['task-12', 'task-13'],
    kpis: [
      { id: 'kpi-6', name: '開発スプリント', target: 12, current: 3, unit: '回', department: 'development' },
      { id: 'kpi-7', name: '顧客満足度', target: 90, current: 78, unit: '%' },
    ],
  },
]

// タスクデータ
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: '新規リード獲得リストの作成',
    description: 'ターゲット業界（SaaS、製造業、金融）から100社をリストアップし、優先順位付けを行う。企業規模、成長率、予算感を調査。',
    status: 'in_progress',
    priority: 'high',
    assignedTo: '営業AI',
    department: 'sales',
    dueDate: new Date('2024-11-10'),
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date(),
    progress: 65,
    aiGenerated: true,
  },
  {
    id: 'task-2',
    title: 'デジタルマーケティング施策立案',
    description: 'SNS広告、コンテンツマーケティング、ウェビナーの3本柱で施策を立案。月間予算200万円での最適配分を提案。',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'マーケティングAI',
    department: 'marketing',
    dueDate: new Date('2024-11-08'),
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date(),
    progress: 40,
    aiGenerated: true,
  },
  {
    id: 'task-3',
    title: '営業人員の採用計画',
    description: 'エンタープライズ営業経験3年以上の人材を5名採用。求人票作成、採用フローの設計、面接官トレーニング。',
    status: 'pending',
    priority: 'medium',
    assignedTo: '人事AI',
    department: 'hr',
    dueDate: new Date('2024-11-15'),
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date(),
    progress: 0,
    aiGenerated: true,
  },
  {
    id: 'task-4',
    title: 'Q3決算レポート作成',
    description: '財務諸表の分析、各部門の予実管理、キャッシュフロー分析をまとめた経営会議資料を作成。',
    status: 'in_progress',
    priority: 'urgent',
    assignedTo: '財務AI',
    department: 'finance',
    dueDate: new Date('2024-11-06'),
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date(),
    progress: 85,
    aiGenerated: false,
  },
  {
    id: 'task-5',
    title: 'コスト削減施策の実行',
    description: 'SaaSツールの統合（Slack、Zoom、Asana）、業務プロセスの自動化（経費精算、勤怠管理）を実装。',
    status: 'pending',
    priority: 'high',
    assignedTo: '総務AI',
    department: 'general_affairs',
    dueDate: new Date('2024-11-20'),
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date(),
    progress: 0,
    aiGenerated: true,
  },
  {
    id: 'task-6',
    title: '顧客満足度調査の実施',
    description: '既存顧客50社にヒアリングを実施。NPS、満足度、改善要望を収集し分析レポートを作成。',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: '営業AI',
    department: 'sales',
    dueDate: new Date('2024-11-12'),
    createdAt: new Date('2024-10-28'),
    updatedAt: new Date(),
    progress: 30,
    aiGenerated: true,
  },
  {
    id: 'task-7',
    title: '社員研修プログラムの設計',
    description: '新入社員向けオンボーディング、中堅社員向けマネジメント研修、技術者向けスキルアップ研修の3コース設計。',
    status: 'pending',
    priority: 'medium',
    assignedTo: '人事AI',
    department: 'hr',
    dueDate: new Date('2024-11-18'),
    createdAt: new Date('2024-10-30'),
    updatedAt: new Date(),
    progress: 0,
    aiGenerated: true,
  },
  {
    id: 'task-8',
    title: '競合分析レポート作成',
    description: '主要競合3社の製品、価格、マーケティング戦略を分析。自社の差別化ポイントを明確化。',
    status: 'completed',
    priority: 'medium',
    assignedTo: 'マーケティングAI',
    department: 'marketing',
    dueDate: new Date('2024-11-01'),
    createdAt: new Date('2024-10-20'),
    updatedAt: new Date('2024-11-01'),
    progress: 100,
    aiGenerated: true,
  },
  {
    id: 'task-9',
    title: 'セキュリティ監査の実施',
    description: '社内システムのセキュリティ脆弱性チェック、アクセス権限の見直し、対策案の提示。',
    status: 'in_progress',
    priority: 'high',
    assignedTo: '統合AI',
    department: 'development',
    dueDate: new Date('2024-11-09'),
    createdAt: new Date('2024-10-28'),
    updatedAt: new Date(),
    progress: 55,
    aiGenerated: false,
  },
  {
    id: 'task-10',
    title: '新規顧客向け提案書テンプレート作成',
    description: '業界別、規模別の提案書テンプレートを作成。ROI計算シート、導入事例、価格表を含む。',
    status: 'completed',
    priority: 'medium',
    assignedTo: '営業AI',
    department: 'sales',
    dueDate: new Date('2024-10-28'),
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-27'),
    progress: 100,
    aiGenerated: true,
  },
  {
    id: 'task-11',
    title: '月次予算管理システムの改善',
    description: 'リアルタイムで予算消化率を可視化するダッシュボードを構築。部門別、プロジェクト別の分析機能を追加。',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: '財務AI',
    department: 'finance',
    dueDate: new Date('2024-11-14'),
    createdAt: new Date('2024-10-22'),
    updatedAt: new Date(),
    progress: 70,
    aiGenerated: true,
  },
  {
    id: 'task-12',
    title: '新機能のユーザーテスト実施',
    description: 'ベータ版を30社に提供し、フィードバックを収集。UIの改善点、バグレポート、要望をまとめる。',
    status: 'in_progress',
    priority: 'high',
    assignedTo: '開発AI',
    department: 'development',
    dueDate: new Date('2024-11-11'),
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date(),
    progress: 45,
    aiGenerated: true,
  },
  {
    id: 'task-13',
    title: '製品ロードマップの更新',
    description: '今後6ヶ月の開発計画を更新。顧客要望、市場トレンド、技術的実現可能性を考慮。',
    status: 'pending',
    priority: 'high',
    assignedTo: '開発AI',
    department: 'development',
    dueDate: new Date('2024-11-16'),
    createdAt: new Date('2024-11-02'),
    updatedAt: new Date(),
    progress: 0,
    aiGenerated: true,
  },
  {
    id: 'task-14',
    title: 'SNS運用戦略の策定',
    description: 'Twitter、LinkedIn、Facebookでの投稿計画を策定。週3回の投稿スケジュール、コンテンツカレンダーを作成。',
    status: 'completed',
    priority: 'low',
    assignedTo: 'マーケティングAI',
    department: 'marketing',
    dueDate: new Date('2024-10-30'),
    createdAt: new Date('2024-10-18'),
    updatedAt: new Date('2024-10-29'),
    progress: 100,
    aiGenerated: true,
  },
  {
    id: 'task-15',
    title: '福利厚生制度の見直し',
    description: 'リモートワーク手当、書籍購入補助、資格取得支援など、社員満足度向上のための制度改善案を提案。',
    status: 'pending',
    priority: 'low',
    assignedTo: '人事AI',
    department: 'hr',
    dueDate: new Date('2024-11-22'),
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date(),
    progress: 0,
    aiGenerated: true,
  },
  {
    id: 'task-16',
    title: '年末調整の準備',
    description: '全社員の年末調整資料の準備。システム入力、確認作業、税務署への提出準備。',
    status: 'pending',
    priority: 'medium',
    assignedTo: '総務AI',
    department: 'general_affairs',
    dueDate: new Date('2024-11-30'),
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date(),
    progress: 0,
    aiGenerated: false,
  },
  {
    id: 'task-17',
    title: 'オフィス移転の検討',
    description: '社員増加に伴うオフィス移転の検討。候補物件のリストアップ、コスト試算、移転スケジュールの作成。',
    status: 'pending',
    priority: 'low',
    assignedTo: '総務AI',
    department: 'general_affairs',
    dueDate: new Date('2024-12-15'),
    createdAt: new Date('2024-10-28'),
    updatedAt: new Date(),
    progress: 0,
    aiGenerated: false,
  },
  {
    id: 'task-18',
    title: '経費精算システムの刷新',
    description: 'OCR機能付きの経費精算システムを導入。スマホアプリから領収書を撮影するだけで精算完了。',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: '総務AI',
    department: 'general_affairs',
    dueDate: new Date('2024-11-25'),
    createdAt: new Date('2024-10-26'),
    updatedAt: new Date(),
    progress: 60,
    aiGenerated: true,
  },
  {
    id: 'task-19',
    title: 'パートナー企業との提携交渉',
    description: '製品の販売チャネル拡大のため、パートナー企業3社と提携交渉。契約条件、マージン率、サポート体制を協議。',
    status: 'in_progress',
    priority: 'high',
    assignedTo: '営業AI',
    department: 'sales',
    dueDate: new Date('2024-11-13'),
    createdAt: new Date('2024-10-29'),
    updatedAt: new Date(),
    progress: 35,
    aiGenerated: true,
  },
  {
    id: 'task-20',
    title: 'ブランドガイドラインの策定',
    description: 'ロゴ使用規定、カラーパレット、フォント、トーン&マナーを定めたブランドガイドラインを作成。',
    status: 'completed',
    priority: 'medium',
    assignedTo: 'マーケティングAI',
    department: 'marketing',
    dueDate: new Date('2024-10-25'),
    createdAt: new Date('2024-10-10'),
    updatedAt: new Date('2024-10-24'),
    progress: 100,
    aiGenerated: true,
  },
]

// ナレッジアイテムデータ
export const mockKnowledge: KnowledgeItem[] = [
  {
    id: 'know-1',
    title: '新規顧客へのアプローチ方法',
    content: `過去の成功事例から、初回接触は電話よりもメールの方が反応率が高い（電話15% vs メール28%）。

特にエンタープライズ顧客の場合：
1. LinkedInで事前に関係構築（2週間程度）
2. 業界レポートや事例を添付したメールを送付
3. 1週間後にフォローアップ
4. 興味を示した場合のみ電話でアポイント

メールの件名は「〇〇業界の△△課題を解決した事例のご紹介」のような具体的なものが開封率が高い（42%）。`,
    category: '営業ノウハウ',
    department: 'sales',
    tags: ['新規開拓', '初回接触', 'メール', 'エンタープライズ'],
    createdAt: new Date('2024-10-28'),
    updatedAt: new Date('2024-10-28'),
    usageCount: 48,
    helpful: 42,
    rating: 4.8,
  },
  {
    id: 'know-2',
    title: 'SaaS業界の採用面接での質問集',
    content: `技術スタック、チーム開発経験、プロダクト志向性を重点的に確認。

【必須質問】
1. これまでどんな開発環境で働いてきましたか？
2. チーム開発での役割と貢献は？
3. ユーザーからのフィードバックをどう受け止めますか？
4. 技術選定で重視することは？
5. 失敗から学んだ最大の教訓は？

【カルチャーフィット確認】
- 自律的に動けるか
- ユーザー視点を持っているか
- 学習意欲があるか
- チームワークを大切にするか

面接後は必ず30分以内にフィードバックを記録すること。`,
    category: '採用',
    department: 'hr',
    tags: ['採用', '面接', 'SaaS', '質問集'],
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date('2024-10-25'),
    usageCount: 35,
    helpful: 31,
    rating: 4.7,
  },
  {
    id: 'know-3',
    title: '四半期決算の効率的な進め方',
    content: `月次で数字を確認し、期末にまとめるのではなく、日々の入力を徹底することで決算作業を80%削減できる。

【月次チェックリスト】
- 売上計上の確認（毎週金曜）
- 経費精算の承認（毎週月曜）
- 請求書発行の確認（月末3営業日前）
- 入金確認と消込（毎日）

【期末作業の前倒し】
- 減価償却は月次で計上
- 未払費用は毎月計上
- 期末在庫は月次でカウント

これにより、期末は最終確認のみで完了。経理部門の残業が月平均40時間→5時間に削減。`,
    category: '財務業務',
    department: 'finance',
    tags: ['決算', '効率化', '月次', '経理'],
    createdAt: new Date('2024-10-20'),
    updatedAt: new Date('2024-10-20'),
    usageCount: 52,
    helpful: 48,
    rating: 4.9,
  },
  {
    id: 'know-4',
    title: '顧客ヒアリングのポイント',
    content: `課題を聞くのではなく、日々の業務フローを聞くことで本質的な課題が見えてくる。

【ヒアリングの流れ】
1. 一日の業務の流れを教えてください
2. その中で最も時間がかかっている作業は？
3. なぜ時間がかかるのですか？
4. 理想的にはどうなっていたいですか？
5. それを実現できない理由は？

「困っていることはありますか？」と聞いても、明確な答えは返ってこない。
業務フローを聞くことで、顧客自身も気づいていない課題を発見できる。

ヒアリング後は必ず議事録を送付し、認識のズレを確認すること。`,
    category: '営業ノウハウ',
    department: 'sales',
    tags: ['ヒアリング', '課題発見', '商談'],
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-15'),
    usageCount: 67,
    helpful: 58,
    rating: 4.6,
  },
  {
    id: 'know-5',
    title: 'リモートワークでのオンボーディング',
    content: `Slackでのバディ制度と、週次1on1で早期の馴染みを促進。最初の2週間が重要。

【初日】
- 全社員にSlackで自己紹介
- バディとの顔合わせ（1時間）
- 必要なツールのアカウント設定

【1週目】
- 毎日30分のバディとのチェックイン
- 各部門の代表者とのオンライン面談（15分×6回）
- 会社のミッション・バリューの理解

【2週目】
- 小さなタスクをアサイン
- 週次1on1でフィードバック
- チームランチ（オンライン）

【1ヶ月】
- 振り返りと今後の目標設定
- バディ制度からメンター制度へ移行

リモートでも孤立させない仕組みが重要。Slackの雑談チャンネルも活用。`,
    category: '人材育成',
    department: 'hr',
    tags: ['オンボーディング', 'リモート', '新入社員', '育成'],
    createdAt: new Date('2024-10-10'),
    updatedAt: new Date('2024-10-10'),
    usageCount: 41,
    helpful: 39,
    rating: 4.5,
  },
  {
    id: 'know-6',
    title: 'プロダクトローンチの成功パターン',
    content: `新機能のローンチは、段階的に公開し、フィードバックを得ながら改善するのが成功の鍵。

【ローンチ前（1ヶ月）】
- ベータ版を既存顧客10社に提供
- 週次でフィードバック収集
- UIの改善、バグ修正

【ローンチ週】
- プレスリリース発行
- SNSでの告知（3日前、当日、翌日）
- 既存顧客向けウェビナー開催
- ブログ記事公開（使い方、事例）

【ローンチ後（1ヶ月）】
- 利用状況のモニタリング
- ユーザーインタビュー（10社）
- 改善要望のリスト化と優先順位付け

過去3回のローンチで、段階的公開により初期バグを90%削減できた。`,
    category: 'プロダクト管理',
    department: 'development',
    tags: ['ローンチ', 'プロダクト', 'マーケティング'],
    createdAt: new Date('2024-10-05'),
    updatedAt: new Date('2024-10-05'),
    usageCount: 29,
    helpful: 26,
    rating: 4.4,
  },
  {
    id: 'know-7',
    title: 'コンテンツマーケティングの効果測定',
    content: `ブログ記事の効果は、PV数だけでなく、コンバージョンまで追跡することが重要。

【測定指標】
1. PV数・UU数
2. 平均滞在時間（目安：3分以上）
3. 直帰率（目安：60%以下）
4. CTR（資料ダウンロード、問い合わせ）
5. CVR（商談化率、受注率）

【高パフォーマンス記事の特徴】
- タイトルに数字を入れる（「5つの方法」など）
- 2,000〜3,000文字
- 画像・図表を3〜5個
- 具体的な事例を含む
- CTA（Call to Action）を記事中に2箇所

月10本公開し、3ヶ月後に効果測定。上位20%の記事に注力してリライト。`,
    category: 'マーケティング',
    department: 'marketing',
    tags: ['コンテンツ', 'マーケティング', '効果測定', 'SEO'],
    createdAt: new Date('2024-09-28'),
    updatedAt: new Date('2024-09-28'),
    usageCount: 38,
    helpful: 33,
    rating: 4.3,
  },
  {
    id: 'know-8',
    title: 'リモート会議の生産性を上げる方法',
    content: `アジェンダと時間配分を明確にし、必ず議事録を共有する。

【会議前（前日まで）】
- アジェンダをSlackで共有
- 事前に確認してほしい資料を添付
- 参加者の役割を明確化（ファシリテーター、タイムキーパー、議事録係）

【会議中】
- 最初の5分で目的とゴールを確認
- 各議題に時間制限を設ける
- 決定事項と次のアクションを明確に
- 画面共有を活用（資料、ホワイトボード）

【会議後（当日中）】
- 議事録をNotionに記録
- 決定事項とアクションアイテムをSlackで共有
- 次回のフォローアップ日時を設定

30分の会議なら、準備10分・本番30分・フォロー10分で合計50分。
準備不足の1時間会議より、準備済みの30分会議の方が生産的。`,
    category: '業務効率化',
    department: 'general_affairs',
    tags: ['会議', 'リモート', '効率化', '生産性'],
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-09-20'),
    usageCount: 56,
    helpful: 51,
    rating: 4.7,
  },
]

// ドキュメントデータ
export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'Q3経営会議資料',
    type: 'report',
    content: '',
    createdBy: '1',
    createdAt: new Date('2024-11-04'),
    department: undefined,
    aiGenerated: true,
  },
  {
    id: 'doc-2',
    title: '新規顧客獲得戦略レポート',
    type: 'report',
    content: '',
    createdBy: '1',
    createdAt: new Date('2024-11-03'),
    department: 'sales',
    aiGenerated: true,
  },
  {
    id: 'doc-3',
    title: '採用計画書（2024年度下期）',
    type: 'proposal',
    content: '',
    createdBy: '3',
    createdAt: new Date('2024-11-02'),
    department: 'hr',
    aiGenerated: true,
  },
  {
    id: 'doc-4',
    title: 'コスト削減施策の実行計画',
    type: 'report',
    content: '',
    createdBy: '1',
    createdAt: new Date('2024-11-01'),
    department: 'finance',
    aiGenerated: true,
  },
  {
    id: 'doc-5',
    title: '製品開発ロードマップ（2024Q4-2025Q1）',
    type: 'proposal',
    content: '',
    createdBy: '1',
    createdAt: new Date('2024-10-30'),
    department: 'development',
    aiGenerated: false,
  },
  {
    id: 'doc-6',
    title: '部門別進捗報告（10月）',
    type: 'report',
    content: '',
    createdBy: '1',
    createdAt: new Date('2024-10-28'),
    aiGenerated: true,
  },
  {
    id: 'doc-7',
    title: '顧客向け提案書テンプレート',
    type: 'proposal',
    content: '',
    createdBy: '2',
    createdAt: new Date('2024-10-27'),
    department: 'sales',
    aiGenerated: true,
  },
  {
    id: 'doc-8',
    title: '競合分析レポート（2024Q3）',
    type: 'report',
    content: '',
    createdBy: '1',
    createdAt: new Date('2024-10-25'),
    department: 'marketing',
    aiGenerated: true,
  },
  {
    id: 'doc-9',
    title: '社員研修プログラム概要',
    type: 'manual',
    content: '',
    createdBy: '3',
    createdAt: new Date('2024-10-22'),
    department: 'hr',
    aiGenerated: true,
  },
  {
    id: 'doc-10',
    title: '経営会議議事録（2024年10月）',
    type: 'meeting_notes',
    content: '',
    createdBy: '1',
    createdAt: new Date('2024-10-20'),
    aiGenerated: true,
  },
  {
    id: 'doc-11',
    title: 'マーケティング施策実行計画',
    type: 'proposal',
    content: '',
    createdBy: '1',
    createdAt: new Date('2024-10-18'),
    department: 'marketing',
    aiGenerated: true,
  },
  {
    id: 'doc-12',
    title: '予算管理マニュアル',
    type: 'manual',
    content: '',
    createdBy: '1',
    createdAt: new Date('2024-10-15'),
    department: 'finance',
    aiGenerated: false,
  },
]

// 通知データ
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'task',
    title: '新しいタスクが割り当てられました',
    message: '営業AIから「新規リード獲得リストの作成」タスクが生成されました',
    read: false,
    createdAt: new Date(Date.now() - 300000),
    link: '/tasks',
  },
  {
    id: 'notif-2',
    type: 'directive',
    title: '経営指示が展開されました',
    message: '「新規顧客獲得の強化」の指示が各部門に展開されました',
    read: false,
    createdAt: new Date(Date.now() - 3600000),
    link: '/dashboard',
  },
  {
    id: 'notif-3',
    type: 'alert',
    title: 'タスクの期限が近づいています',
    message: '「Q3決算レポート作成」の期限まで残り2日です',
    read: false,
    createdAt: new Date(Date.now() - 10800000),
    link: '/tasks',
  },
  {
    id: 'notif-4',
    type: 'info',
    title: 'AIが新しいナレッジを学習しました',
    message: '営業部門のベストプラクティスが3件追加されました',
    read: true,
    createdAt: new Date(Date.now() - 18000000),
    link: '/knowledge',
  },
  {
    id: 'notif-5',
    type: 'task',
    title: 'タスクが完了しました',
    message: '「デジタルマーケティング施策立案」が完了しました',
    read: true,
    createdAt: new Date(Date.now() - 86400000),
    link: '/tasks',
  },
  {
    id: 'notif-6',
    type: 'info',
    title: 'ドキュメントが生成されました',
    message: '「Q3経営会議資料」がAIにより自動生成されました',
    read: true,
    createdAt: new Date(Date.now() - 172800000),
    link: '/documents',
  },
  {
    id: 'notif-7',
    type: 'alert',
    title: 'KPI目標達成率が低下しています',
    message: '「成約率」の達成率が72%に低下。要注意',
    read: false,
    createdAt: new Date(Date.now() - 7200000),
    link: '/dashboard',
  },
  {
    id: 'notif-8',
    type: 'task',
    title: 'タスクがブロックされています',
    message: '「パートナー企業との提携交渉」が承認待ちでブロックされています',
    read: false,
    createdAt: new Date(Date.now() - 14400000),
    link: '/tasks',
  },
]

// 部門パフォーマンスデータ
export const departmentPerformance = [
  { 
    name: '営業部', 
    score: 92, 
    trend: 'up' as const, 
    tasks: 12,
    completedTasks: 8,
    kpiAchievement: 85,
    efficiency: 94,
  },
  { 
    name: '人事部', 
    score: 88, 
    trend: 'up' as const, 
    tasks: 8,
    completedTasks: 5,
    kpiAchievement: 78,
    efficiency: 91,
  },
  { 
    name: '財務部', 
    score: 85, 
    trend: 'stable' as const, 
    tasks: 6,
    completedTasks: 4,
    kpiAchievement: 92,
    efficiency: 96,
  },
  { 
    name: '開発部', 
    score: 78, 
    trend: 'down' as const, 
    tasks: 15,
    completedTasks: 6,
    kpiAchievement: 68,
    efficiency: 88,
  },
  { 
    name: 'マーケティング部', 
    score: 90, 
    trend: 'up' as const, 
    tasks: 10,
    completedTasks: 7,
    kpiAchievement: 88,
    efficiency: 92,
  },
  { 
    name: '総務部', 
    score: 82, 
    trend: 'stable' as const, 
    tasks: 5,
    completedTasks: 3,
    kpiAchievement: 75,
    efficiency: 89,
  },
]

// AIエージェント活動データ
export const agentActivities = [
  { name: '経営AI', status: 'active' as const, activity: '戦略分析中', lastUpdate: '2分前' },
  { name: '営業AI', status: 'active' as const, activity: '提案資料生成中', lastUpdate: '5分前' },
  { name: '人事AI', status: 'active' as const, activity: '採用計画策定中', lastUpdate: '8分前' },
  { name: '財務AI', status: 'active' as const, activity: 'レポート作成中', lastUpdate: '3分前' },
  { name: '開発AI', status: 'idle' as const, activity: '待機中', lastUpdate: '1時間前' },
  { name: 'マーケティングAI', status: 'active' as const, activity: '市場分析中', lastUpdate: '10分前' },
  { name: '総務AI', status: 'idle' as const, activity: '待機中', lastUpdate: '2時間前' },
  { name: '統合AI', status: 'active' as const, activity: 'データ統合中', lastUpdate: '1分前' },
]

// データフロー情報
export const dataFlows = [
  { from: '経営AI', to: '営業AI', type: '新規顧客獲得指示', time: '2分前' },
  { from: '営業AI', to: '統合AI', type: '進捗レポート送信', time: '5分前' },
  { from: '統合AI', to: '人事AI', type: '採用ニーズ分析結果', time: '8分前' },
  { from: '財務AI', to: '経営AI', type: '予算分析結果送信', time: '12分前' },
  { from: 'マーケティングAI', to: '営業AI', type: 'リード情報共有', time: '15分前' },
  { from: '経営AI', to: '全部門AI', type: 'KPI目標更新', time: '1時間前' },
]

