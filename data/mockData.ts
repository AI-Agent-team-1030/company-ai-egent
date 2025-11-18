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

// タスクAIエージェントの型定義
export interface TaskAgent {
  id: string
  name: string
  description: string
  status: 'active' | 'idle'
}

// 部門AIエージェントの型定義
export interface DepartmentAgent {
  id: string
  name: string
  description: string
  status: 'active' | 'idle'
  taskAgents: TaskAgent[]
}

// 全AIエージェントデータ（部門AI + タスクAI）
export const allAIAgents: DepartmentAgent[] = [
  {
    id: 'sales',
    name: '営業AI',
    description: '新規顧客獲得と売上管理',
    status: 'active',
    taskAgents: [
      { id: 'sales-lead-research', name: 'リード調査AI', description: '見込み顧客の情報収集と分析', status: 'active' },
      { id: 'sales-lead-list', name: 'リスト作成AI', description: 'ターゲット顧客リストの自動生成', status: 'active' },
      { id: 'sales-outbound', name: 'アウトバウンドAI', description: '初回アプローチメールの自動送信', status: 'active' },
      { id: 'sales-appointment', name: 'アポイント調整AI', description: '商談日程の自動調整', status: 'active' },
      { id: 'sales-proposal', name: '提案資料作成AI', description: '顧客別提案書の自動生成', status: 'active' },
      { id: 'sales-quote', name: '見積作成AI', description: '見積書の自動作成と送付', status: 'active' },
      { id: 'sales-negotiation', name: '交渉支援AI', description: '価格交渉のデータ分析', status: 'idle' },
      { id: 'sales-contract', name: '契約書作成AI', description: '契約書ドラフトの自動生成', status: 'active' },
      { id: 'sales-followup', name: 'フォローアップAI', description: '商談後の自動フォロー', status: 'active' },
      { id: 'sales-forecast', name: '売上予測AI', description: '受注予測とパイプライン管理', status: 'active' },
    ],
  },
  {
    id: 'marketing',
    name: 'マーケティングAI',
    description: '広告施策とブランディング',
    status: 'active',
    taskAgents: [
      { id: 'marketing-research', name: '市場調査AI', description: '市場トレンド分析', status: 'active' },
      { id: 'marketing-persona', name: 'ペルソナ分析AI', description: 'ターゲット顧客の分析', status: 'active' },
      { id: 'marketing-content', name: 'コンテンツ企画AI', description: 'コンテンツ戦略立案', status: 'active' },
      { id: 'marketing-copywriting', name: 'コピーライティングAI', description: '広告文の自動生成', status: 'active' },
      { id: 'marketing-creative', name: 'クリエイティブ制作AI', description: 'バナー・画像の自動生成', status: 'active' },
      { id: 'marketing-seo', name: 'SEO最適化AI', description: 'コンテンツのSEO最適化', status: 'active' },
      { id: 'marketing-sns-post', name: 'SNS投稿AI', description: 'SNS投稿の自動作成', status: 'active' },
      { id: 'marketing-sns-schedule', name: 'SNS投稿スケジューリングAI', description: '最適タイミングでの投稿', status: 'active' },
      { id: 'marketing-ad-management', name: '広告運用AI', description: 'Web広告の自動運用', status: 'active' },
      { id: 'marketing-ab-test', name: 'ABテストAI', description: 'ABテストの設計と分析', status: 'idle' },
      { id: 'marketing-analytics', name: '効果測定AI', description: 'マーケティング効果の分析', status: 'active' },
      { id: 'marketing-report', name: 'レポート作成AI', description: 'マーケティングレポート自動生成', status: 'active' },
    ],
  },
  {
    id: 'cs',
    name: 'カスタマーサクセスAI',
    description: '顧客満足度向上と継続率改善',
    status: 'active',
    taskAgents: [
      { id: 'cs-onboarding', name: 'オンボーディングAI', description: '新規顧客の導入支援', status: 'active' },
      { id: 'cs-training', name: 'トレーニングAI', description: '顧客向けトレーニング資料作成', status: 'active' },
      { id: 'cs-health-check', name: 'ヘルスチェックAI', description: '顧客の利用状況分析', status: 'active' },
      { id: 'cs-engagement', name: 'エンゲージメントAI', description: '顧客接点の最適化', status: 'active' },
      { id: 'cs-upsell', name: 'アップセル提案AI', description: 'アップセル機会の検出', status: 'idle' },
      { id: 'cs-renewal', name: '更新管理AI', description: '契約更新の自動リマインド', status: 'active' },
      { id: 'cs-churn-prediction', name: '解約予測AI', description: '解約リスクの早期検知', status: 'active' },
      { id: 'cs-feedback', name: 'フィードバック収集AI', description: '顧客フィードバックの収集', status: 'active' },
    ],
  },
  {
    id: 'support',
    name: 'カスタマーサポートAI',
    description: '顧客対応と問い合わせ管理',
    status: 'active',
    taskAgents: [
      { id: 'support-chatbot', name: 'チャットボットAI', description: '自動チャット対応', status: 'active' },
      { id: 'support-ticket-routing', name: 'チケット振り分けAI', description: '問い合わせの自動振り分け', status: 'active' },
      { id: 'support-auto-reply', name: '自動返信AI', description: 'よくある質問への自動回答', status: 'active' },
      { id: 'support-email-response', name: 'メール対応AI', description: 'メール返信文の自動生成', status: 'active' },
      { id: 'support-knowledge-base', name: 'ナレッジベースAI', description: 'FAQ記事の自動生成', status: 'active' },
      { id: 'support-escalation', name: 'エスカレーション判定AI', description: '担当者への引き継ぎ判断', status: 'idle' },
      { id: 'support-sentiment', name: '感情分析AI', description: '顧客感情の分析', status: 'active' },
      { id: 'support-satisfaction', name: '満足度調査AI', description: '満足度アンケートの自動送信', status: 'active' },
    ],
  },
  {
    id: 'hr',
    name: '人事AI',
    description: '採用と人材育成',
    status: 'active',
    taskAgents: [
      { id: 'hr-job-posting', name: '求人票作成AI', description: '魅力的な求人票の自動生成', status: 'active' },
      { id: 'hr-sourcing', name: '人材ソーシングAI', description: '候補者の自動スカウト', status: 'active' },
      { id: 'hr-resume-screening', name: '履歴書スクリーニングAI', description: '履歴書の自動審査', status: 'active' },
      { id: 'hr-interview-schedule', name: '面接調整AI', description: '面接日程の自動調整', status: 'active' },
      { id: 'hr-interview-questions', name: '面接質問生成AI', description: '面接質問の自動生成', status: 'idle' },
      { id: 'hr-evaluation', name: '候補者評価AI', description: '面接評価の分析', status: 'active' },
      { id: 'hr-offer', name: 'オファー作成AI', description: '内定通知の自動作成', status: 'active' },
      { id: 'hr-onboarding-doc', name: '入社書類AI', description: '入社手続き書類の準備', status: 'active' },
      { id: 'hr-training-plan', name: '研修計画AI', description: '社員研修プラン作成', status: 'idle' },
      { id: 'hr-performance', name: '評価管理AI', description: '人事評価のデータ管理', status: 'active' },
    ],
  },
  {
    id: 'finance',
    name: '財務AI',
    description: '予算管理と財務分析',
    status: 'active',
    taskAgents: [
      { id: 'finance-budget', name: '予算策定AI', description: '予算計画の自動作成', status: 'active' },
      { id: 'finance-expense-check', name: '経費チェックAI', description: '経費申請の自動審査', status: 'active' },
      { id: 'finance-invoice', name: '請求書発行AI', description: '請求書の自動発行', status: 'active' },
      { id: 'finance-payment', name: '入金確認AI', description: '入金状況の自動確認', status: 'active' },
      { id: 'finance-reminder', name: '督促AI', description: '未払い請求の自動督促', status: 'idle' },
      { id: 'finance-reconciliation', name: '消込AI', description: '入金消込の自動処理', status: 'active' },
      { id: 'finance-report', name: '財務レポートAI', description: '財務レポートの自動生成', status: 'active' },
      { id: 'finance-forecast', name: '財務予測AI', description: '売上・利益予測', status: 'active' },
    ],
  },
  {
    id: 'accounting',
    name: '経理AI',
    description: '会計処理と帳簿管理',
    status: 'active',
    taskAgents: [
      { id: 'accounting-journal', name: '仕訳AI', description: '仕訳の自動入力', status: 'active' },
      { id: 'accounting-receipt', name: '領収書処理AI', description: '領収書のOCR処理', status: 'active' },
      { id: 'accounting-expense', name: '経費精算AI', description: '経費精算の自動処理', status: 'active' },
      { id: 'accounting-payroll', name: '給与計算AI', description: '給与計算の自動化', status: 'active' },
      { id: 'accounting-tax', name: '税務処理AI', description: '税務申告書の作成支援', status: 'idle' },
      { id: 'accounting-closing', name: '月次決算AI', description: '月次決算の自動化', status: 'active' },
    ],
  },
  {
    id: 'legal',
    name: '法務AI',
    description: '契約管理とリーガルチェック',
    status: 'active',
    taskAgents: [
      { id: 'legal-contract-draft', name: '契約書ドラフトAI', description: '契約書雛形の自動生成', status: 'active' },
      { id: 'legal-contract-review', name: '契約書レビューAI', description: '契約書のリスク確認', status: 'active' },
      { id: 'legal-compliance-check', name: 'コンプライアンスチェックAI', description: '法令遵守の確認', status: 'active' },
      { id: 'legal-contract-management', name: '契約管理AI', description: '契約書の一元管理', status: 'active' },
      { id: 'legal-renewal-reminder', name: '契約更新通知AI', description: '契約更新日の自動通知', status: 'idle' },
      { id: 'legal-research', name: '法令調査AI', description: '関連法令の調査', status: 'idle' },
    ],
  },
  {
    id: 'pr',
    name: '広報・PRAI',
    description: 'プレスリリースとメディア対応',
    status: 'active',
    taskAgents: [
      { id: 'pr-press-release', name: 'プレスリリース作成AI', description: 'プレスリリースの自動生成', status: 'active' },
      { id: 'pr-media-list', name: 'メディアリスト管理AI', description: 'メディアリストの管理', status: 'active' },
      { id: 'pr-media-monitoring', name: 'メディアモニタリングAI', description: 'メディア露出の監視', status: 'active' },
      { id: 'pr-crisis', name: '危機管理AI', description: '炎上リスクの検知', status: 'idle' },
      { id: 'pr-report', name: '広報レポートAI', description: '広報活動レポート作成', status: 'active' },
    ],
  },
  {
    id: 'ir',
    name: 'IRAI',
    description: '投資家対応と情報開示',
    status: 'active',
    taskAgents: [
      { id: 'ir-presentation', name: 'IR資料作成AI', description: 'IR資料の自動生成', status: 'active' },
      { id: 'ir-qa', name: 'IR Q&A AI', description: '想定問答の自動作成', status: 'idle' },
      { id: 'ir-disclosure', name: '開示資料AI', description: '適時開示資料の作成', status: 'active' },
      { id: 'ir-analysis', name: '株価分析AI', description: '株価動向の分析', status: 'active' },
    ],
  },
  {
    id: 'procurement',
    name: '購買・調達AI',
    description: '仕入先管理と発注業務',
    status: 'active',
    taskAgents: [
      { id: 'procurement-vendor', name: 'ベンダー管理AI', description: '仕入先情報の管理', status: 'active' },
      { id: 'procurement-rfq', name: '見積依頼AI', description: '見積依頼書の自動作成', status: 'active' },
      { id: 'procurement-comparison', name: '見積比較AI', description: '複数見積の自動比較', status: 'active' },
      { id: 'procurement-order', name: '発注AI', description: '発注書の自動作成', status: 'active' },
      { id: 'procurement-receiving', name: '検収AI', description: '納品物の検収処理', status: 'idle' },
      { id: 'procurement-payment', name: '支払処理AI', description: '支払処理の自動化', status: 'active' },
    ],
  },
  {
    id: 'logistics',
    name: '物流・倉庫管理AI',
    description: '在庫管理と配送最適化',
    status: 'active',
    taskAgents: [
      { id: 'logistics-inventory-forecast', name: '在庫予測AI', description: '需要予測と発注提案', status: 'active' },
      { id: 'logistics-order', name: '自動発注AI', description: '在庫切れ前の自動発注', status: 'active' },
      { id: 'logistics-receiving', name: '入庫管理AI', description: '入庫処理の自動化', status: 'active' },
      { id: 'logistics-picking', name: 'ピッキング最適化AI', description: 'ピッキングルートの最適化', status: 'active' },
      { id: 'logistics-packing', name: '梱包指示AI', description: '梱包方法の自動指示', status: 'idle' },
      { id: 'logistics-shipping', name: '配送最適化AI', description: '配送ルートの最適化', status: 'active' },
      { id: 'logistics-tracking', name: '配送追跡AI', description: '配送状況の自動通知', status: 'active' },
    ],
  },
  {
    id: 'data',
    name: 'データ分析AI',
    description: 'ビジネスデータの分析と可視化',
    status: 'active',
    taskAgents: [
      { id: 'data-collection', name: 'データ収集AI', description: '各種データの自動収集', status: 'active' },
      { id: 'data-cleaning', name: 'データクレンジングAI', description: 'データの整形と正規化', status: 'active' },
      { id: 'data-analysis', name: 'データ分析AI', description: '統計分析と傾向把握', status: 'active' },
      { id: 'data-visualization', name: 'データ可視化AI', description: 'グラフ・ダッシュボード作成', status: 'active' },
      { id: 'data-report', name: 'レポート生成AI', description: '分析レポートの自動生成', status: 'active' },
      { id: 'data-prediction', name: '予測モデルAI', description: '機械学習による予測', status: 'idle' },
    ],
  },
  {
    id: 'dev',
    name: '開発AI',
    description: 'システム開発と保守',
    status: 'idle',
    taskAgents: [
      { id: 'dev-requirement', name: '要件定義AI', description: '要件定義書の作成支援', status: 'idle' },
      { id: 'dev-design', name: '設計AI', description: 'システム設計書の作成', status: 'idle' },
      { id: 'dev-code', name: 'コード生成AI', description: '仕様からのコード自動生成', status: 'idle' },
      { id: 'dev-review', name: 'コードレビューAI', description: 'コードの自動レビュー', status: 'idle' },
      { id: 'dev-test', name: 'テスト自動化AI', description: 'テストケースの自動実行', status: 'idle' },
      { id: 'dev-bug', name: 'バグ検知AI', description: 'バグの自動検出', status: 'idle' },
      { id: 'dev-deploy', name: 'デプロイAI', description: '自動デプロイと監視', status: 'idle' },
    ],
  },
  {
    id: 'security',
    name: 'セキュリティAI',
    description: 'セキュリティ監視と脅威検知',
    status: 'active',
    taskAgents: [
      { id: 'security-monitoring', name: 'セキュリティ監視AI', description: '不正アクセスの検知', status: 'active' },
      { id: 'security-vulnerability', name: '脆弱性診断AI', description: 'システムの脆弱性診断', status: 'idle' },
      { id: 'security-incident', name: 'インシデント対応AI', description: 'セキュリティ事故の初動対応', status: 'active' },
      { id: 'security-log', name: 'ログ分析AI', description: 'アクセスログの分析', status: 'active' },
      { id: 'security-training', name: 'セキュリティ教育AI', description: '社員向けセキュリティ教育', status: 'idle' },
    ],
  },
  {
    id: 'admin',
    name: '総務AI',
    description: 'バックオフィス業務',
    status: 'idle',
    taskAgents: [
      { id: 'admin-contract', name: '社内契約管理AI', description: '社内契約書の管理', status: 'idle' },
      { id: 'admin-facility-reserve', name: '会議室予約AI', description: '会議室予約の自動調整', status: 'idle' },
      { id: 'admin-equipment', name: '備品管理AI', description: '備品在庫の管理', status: 'idle' },
      { id: 'admin-mail', name: '郵便物管理AI', description: '郵便物の受付・配布管理', status: 'idle' },
      { id: 'admin-visitor', name: '来客対応AI', description: '来客受付の自動化', status: 'idle' },
    ],
  },
]

// レガシーサポート用：既存のmockAgents
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
  {
    id: 'know-9',
    title: '経費精算の方法と申請手順',
    content: `経費精算システム（Freee）を使った申請から承認、振込までの完全ガイド。

【申請可能な経費】
- 交通費（電車、タクシー、航空券）
- 宿泊費（出張時のホテル代）
- 接待交際費（取引先との会食、手土産）
- 消耗品費（業務に必要な文房具、書籍）
- 通信費（業務用携帯電話、モバイルWi-Fi）

【申請手順】
1. Freeeにログイン（https://freee.co.jp）
2. 「経費精算」→「新規申請」をクリック
3. 領収書の写真をアップロード（スマホアプリ推奨）
4. 費目を選択（交通費、宿泊費など）
5. 金額、日付、目的を入力
6. 「申請」ボタンをクリック

【承認フロー】
- 5万円未満：直属の上長のみ
- 5万円以上：直属の上長 → 部門長
- 10万円以上：直属の上長 → 部門長 → 経理部長

【振込スケジュール】
- 毎月15日までの申請：当月25日振込
- 毎月16日以降の申請：翌月10日振込

【注意事項】
- 領収書は必ず原本を保管（税務調査対応）
- 宛名は会社名で（個人名不可）
- 申請期限は支払日から3ヶ月以内
- 1万円以上のタクシー代は利用理由が必須

【よくある質問】
Q: クレジットカードで支払った場合は？
A: 明細書のスクリーンショットでOK（引き落とし後に申請）

Q: 交通系ICカード（Suica）の履歴は？
A: 駅の券売機で印刷した履歴を添付

Q: 割り勘の場合は？
A: 自分の負担分のみ申請（内訳を備考欄に記載）`,
    category: '総務',
    department: 'general_affairs',
    tags: ['経費精算', '申請', '手続き', 'Freee'],
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-01'),
    usageCount: 124,
    helpful: 118,
    rating: 4.9,
  },
  {
    id: 'know-10',
    title: '有給休暇の申請手順と取得ルール',
    content: `有給休暇の申請方法、取得可能日数、繰越ルールの完全ガイド。

【取得可能日数】
- 入社6ヶ月後：10日付与
- 1年6ヶ月後：11日付与
- 2年6ヶ月後：12日付与
- 以降1年ごとに+1日（上限20日）

【申請手順】
1. 勤怠管理システム（ジョブカン）にログイン
2. 「休暇申請」→「有給休暇」を選択
3. 取得日を選択（カレンダーから）
4. 半休の場合は「午前休」「午後休」を選択
5. 理由を簡潔に入力（任意）
6. 「申請」ボタンをクリック

【承認フロー】
- 申請後、自動で直属の上長に通知
- 上長が24時間以内に承認・却下を判断
- 承認されたらカレンダーに自動反映

【申請期限】
- 事前申請：取得日の3営業日前まで
- 当日申請：緊急時のみ（体調不良など）→上長に電話連絡必須

【繰越ルール】
- 未使用分は翌年度に繰越可能（上限20日）
- 繰越分は翌年度末で失効
- 計画的に消化することを推奨

【取得推奨日】
当社では年間最低10日の取得を推奨しています。
- 四半期ごとに2-3日
- 長期休暇（夏季・年末年始）と組み合わせる
- 金曜または月曜に取得して3連休化

【半休の利用】
- 午前休：9:00-13:00が休み、14:00から出勤
- 午後休：9:00-13:00勤務、14:00以降が休み
- 1日の有給 = 半休2回分

【注意事項】
- 有給取得は労働者の権利です（理由は不要）
- チーム内で日程を調整し、業務に支障がないように
- 長期休暇（5日以上）は1ヶ月前に相談
- 有給残日数は給与明細またはジョブカンで確認可能

【よくある質問】
Q: 有給が足りない場合は？
A: 欠勤扱いになります（無給）。計画的な取得を推奨します。

Q: 退職時に残っている有給は？
A: 退職日まで全て消化可能です。引継ぎ期間を考慮して計画してください。

Q: 繰越上限を超えた分は？
A: 消滅します。早めの取得を心がけましょう。`,
    category: '人事制度',
    department: 'hr',
    tags: ['有給休暇', '申請', '休暇', 'ジョブカン'],
    createdAt: new Date('2024-11-02'),
    updatedAt: new Date('2024-11-02'),
    usageCount: 156,
    helpful: 149,
    rating: 4.9,
  },
  {
    id: 'know-11',
    title: '会議室予約システムの使い方',
    content: `会議室予約システム（Google Calendar連携）の予約方法と利用ルール。

【利用可能な会議室】
- 小会議室A（4名）：1F
- 小会議室B（4名）：1F
- 中会議室C（8名）：2F
- 中会議室D（8名）：2F
- 大会議室E（20名）：3F
- オンライン専用ブース（1名×4室）：各階

【予約方法】
1. Googleカレンダーを開く
2. 予約したい時間帯をクリック
3. 「ゲストを追加」をクリック
4. 会議室のメールアドレスを入力
   - 小会議室A: room-a@company.com
   - 小会議室B: room-b@company.com
   - 中会議室C: room-c@company.com
   - 中会議室D: room-d@company.com
   - 大会議室E: room-e@company.com
5. 会議のタイトルを入力（目的がわかるように）
6. 「保存」をクリック

【予約ルール】
- 予約可能時間：9:00〜20:00
- 最大予約時間：2時間まで（延長は30分単位）
- 予約可能期間：2週間前から
- キャンセル：使用開始1時間前まで

【当日予約・延長】
- 空いていれば当日予約OK
- 延長したい場合は、次の予約がなければ現地で追加予約可能
- Slackの #meeting-room チャンネルで空き状況を確認

【備品】
- プロジェクター：中会議室C、D、大会議室E
- ホワイトボード：全会議室
- モニター：全会議室（HDMI接続）
- Web会議用マイク・スピーカー：全会議室

【使用後のルール】
- ホワイトボードは必ず消す
- ゴミは持ち帰る
- 椅子を元の位置に戻す
- 照明・エアコンを消す

【よくある質問】
Q: 他の人の予約状況を確認したい
A: Googleカレンダーで会議室アドレスを追加すると予定が見えます

Q: 社外の方も参加する場合は？
A: 1F受付で来客証を発行してもらい、会議室まで案内してください

Q: オンライン会議で使いたい
A: オンライン専用ブースがおすすめ（防音、専用機材あり）

Q: 予約を間違えた
A: Googleカレンダーから削除すれば即座にキャンセルされます`,
    category: '総務',
    department: 'general_affairs',
    tags: ['会議室', '予約', '施設', 'Google Calendar'],
    createdAt: new Date('2024-11-03'),
    updatedAt: new Date('2024-11-03'),
    usageCount: 98,
    helpful: 92,
    rating: 4.8,
  },
  {
    id: 'know-12',
    title: '勤怠管理システム（ジョブカン）の使い方',
    content: `ジョブカンでの出退勤打刻、勤務時間の修正、残業申請の完全マニュアル。

【基本的な打刻方法】
1. ジョブカンにログイン（https://jobcan.jp）
   - ID: メールアドレス
   - パスワード: 初回ログイン時に設定
2. 「出勤」ボタンをクリック（始業時）
3. 「退勤」ボタンをクリック（終業時）

【スマホアプリでの打刻】
- App StoreまたはGoogle Playで「ジョブカン」をダウンロード
- GPS打刻が有効（オフィス半径500m以内で打刻可能）
- 外出先からも打刻できます

【休憩時間の打刻】
- 「休憩開始」ボタン：昼休みなど
- 「休憩終了」ボタン：休憩から戻った時
- 休憩時間は自動で勤務時間から除外されます

【打刻忘れ・修正方法】
1. 「勤怠修正申請」をクリック
2. 修正したい日付を選択
3. 正しい出勤・退勤時刻を入力
4. 理由を記載（例：打刻忘れ、システムエラー）
5. 「申請」をクリック
6. 上長が承認したら反映されます

【残業申請】
事前申請が必須です（当日申請は原則不可）
1. 「残業申請」をクリック
2. 残業予定日と時間を入力
3. 業務内容を具体的に記載
4. 上長の承認後、残業可能

【月次確認】
毎月末に勤務時間を確認してください
1. 「月次勤怠」をクリック
2. 総労働時間、残業時間を確認
3. 誤りがあれば修正申請
4. 「確定」ボタンをクリック（翌月5日まで）

【勤務パターン】
- 通常勤務：9:00〜18:00（休憩1時間）
- フレックス：コアタイム 11:00〜16:00
- リモートワーク：出勤・退勤ボタンで打刻（自宅からOK）

【各種申請】
- 遅刻・早退：当日、上長に連絡→ジョブカンで申請
- 直行・直帰：事前に上長に連絡→勤怠備考欄に記載
- 休日出勤：事前申請必須→振替休日を取得

【よくある質問】
Q: 打刻を忘れた場合のペナルティは？
A: ペナルティはありませんが、月3回以上は注意されます

Q: 残業時間の上限は？
A: 月45時間が上限（36協定）。超過する場合は事前に相談が必要

Q: フレックス制度の利用方法は？
A: 上長に相談の上、勤務パターンを「フレックス」に変更してもらいます

Q: リモートワーク時の打刻は？
A: 通常通り打刻してください。GPS制限は解除されています`,
    category: '総務',
    department: 'general_affairs',
    tags: ['勤怠管理', 'ジョブカン', '打刻', '残業'],
    createdAt: new Date('2024-11-04'),
    updatedAt: new Date('2024-11-04'),
    usageCount: 187,
    helpful: 176,
    rating: 4.9,
  },
  {
    id: 'know-13',
    title: '社内ITサポートへの問い合わせ方法',
    content: `PCトラブル、アカウント問題、ソフトウェアインストールなどIT関連の問い合わせ手順。

【問い合わせ方法】
1. Slackの #it-support チャンネルに投稿
2. 緊急時は内線 1234（平日9:00-18:00）
3. メール：it-support@company.com

【よくあるトラブルと解決方法】

■ PCが起動しない
1. 電源ケーブルが接続されているか確認
2. 電源ボタンを10秒長押し→再起動
3. 解決しない場合：IT部に連絡（代替PCを貸出）

■ Wi-Fiに接続できない
1. Wi-Fi設定を開く
2. ネットワーク「CompanyWiFi」を選択
3. パスワード：wifi2024secure
4. それでも繋がらない場合：ルーターを再起動

■ パスワードを忘れた
1. ログイン画面で「パスワードを忘れた」をクリック
2. 登録メールアドレスにリセットリンクが送信される
3. 新しいパスワードを設定（8文字以上、英数字記号を含む）

■ メールが送受信できない
1. インターネット接続を確認
2. メールアプリを再起動
3. サーバー設定を確認：
   - 受信サーバー：mail.company.com（IMAP）
   - 送信サーバー：smtp.company.com（SMTP）
4. 解決しない場合：IT部に連絡

【ソフトウェアのインストール申請】
1. 必要なソフトウェア名を確認
2. Slackの #it-support に申請
   - ソフトウェア名
   - 用途
   - 緊急度
3. IT部が確認後、インストール（1営業日以内）

【セキュリティ関連】
- 不審なメールは開かない→IT部に転送
- USBメモリは会社支給品のみ使用
- パスワードは定期的に変更（3ヶ月ごと）
- PCの画面ロックは必須（離席時）

【新規アカウント発行】
新入社員や異動の場合
- Google Workspace（Gmail、カレンダー）
- Slack
- ジョブカン（勤怠）
- Freee（経費精算）
→ 人事部から自動で発行されます（入社日に利用可能）

【機器の故障・交換】
1. 故障内容を #it-support に報告
2. 修理可能か判断→代替機を貸出
3. 修理不可の場合は新品と交換

【リモートワーク時のサポート】
- TeamViewerで遠隔サポート可能
- 緊急時は翌日オフィスに来社してサポート

【よくある質問】
Q: 個人のソフトをインストールしていい？
A: 業務に必要なものはIT部に申請してください。私的利用は禁止です。

Q: プリンターが使えない
A: ドライバーの再インストールが必要な場合があります。IT部に連絡してください。`,
    category: 'IT・システム',
    department: 'development',
    tags: ['ITサポート', 'トラブル', 'PC', 'ヘルプデスク'],
    createdAt: new Date('2024-10-30'),
    updatedAt: new Date('2024-10-30'),
    usageCount: 145,
    helpful: 138,
    rating: 4.8,
  },
  {
    id: 'know-14',
    title: '名刺の作成・発注方法',
    content: `名刺のデザイン、発注、受け取りまでの手順。

【名刺デザイン】
当社では統一デザインを使用しています
- 会社ロゴ
- 氏名（日本語・英語）
- 部署名・役職
- 電話番号・メールアドレス
- 会社住所・URL

【発注手順】
1. 総務部に名刺発注依頼メールを送信
   宛先：soumu@company.com
   件名：【名刺発注】氏名
   本文：
   - 氏名（フリガナ）
   - 部署・役職
   - メールアドレス
   - 携帯電話番号（記載する場合）
   - 発注枚数（100枚単位）
   - 納期希望日

2. 総務部がデザインを作成→確認依頼
3. デザイン確認後、印刷発注
4. 3営業日後に総務部から受け取り

【発注枚数の目安】
- 新入社員：初回200枚
- 営業職：500枚/年
- その他：100枚/年

【名刺切れの場合】
在庫が20枚を切ったら追加発注してください。
緊急時は総務部に相談（最短翌日対応可能）

【名刺の保管】
- 名刺入れに入れて持ち歩く
- オフィスでの保管は個人ロッカー
- 紛失・破損した場合は速やかに報告

【異動・昇進時】
部署や役職が変わった場合は新しい名刺を発注してください。
古い名刺は破棄（シュレッダー）

【英語版名刺】
海外取引がある場合、英語版も発注可能
- 裏面に英語表記
- フォーマットは総務部にあります

【よくある質問】
Q: 名刺の費用は？
A: 会社負担です（個人の支払いは不要）

Q: デザインを変更したい
A: 統一デザインのため変更不可。特別な理由がある場合は総務部に相談。

Q: 受け取った名刺の管理方法は？
A: Eight（名刺管理アプリ）の使用を推奨しています。`,
    category: '総務',
    department: 'general_affairs',
    tags: ['名刺', '発注', '総務', '備品'],
    createdAt: new Date('2024-10-28'),
    updatedAt: new Date('2024-10-28'),
    usageCount: 67,
    helpful: 63,
    rating: 4.7,
  },
  {
    id: 'know-15',
    title: '契約書の押印申請フロー',
    content: `契約書の社内承認から押印、保管までの完全フロー。

【押印が必要な書類】
- 業務委託契約書
- 秘密保持契約書（NDA）
- 販売契約書
- リース契約書
- その他法的拘束力のある文書

【申請フロー】
1. 契約書ドラフトを作成（または受領）
2. 法務部に内容確認を依頼
   - Slackの #legal チャンネル
   - 確認期間：3営業日
3. 法務部承認後、押印申請フォームを提出
   - Googleフォーム：https://forms.company.com/seal
   - 添付：契約書PDF、法務部承認メール
4. 承認ルート
   - 100万円未満：部門長
   - 100万円以上500万円未満：部門長→経営企画部長
   - 500万円以上：部門長→経営企画部長→代表取締役
5. 承認完了後、総務部が押印
6. 原本を先方に郵送（総務部が対応）
7. 先方押印後の原本返送→総務部で保管

【所要期間】
- 通常：5営業日
- 緊急：2営業日（事前に総務部に連絡）

【電子契約の場合】
クラウドサイン（CloudSign）を使用
1. クラウドサインで契約書を作成
2. 法務部に確認依頼（同様）
3. 承認ルートは同じ
4. 承認後、クラウドサインで先方に送信
5. 双方が署名→自動で保管

【保管ルール】
- 原本：総務部の契約書保管庫（施錠）
- PDF：社内サーバーの契約書フォルダ
- 保管期間：契約終了後7年間

【よくある質問】
Q: 急ぎの契約はどうすればいい？
A: 総務部に直接連絡（内線1111）。理由を説明すれば優先対応可能。

Q: 印鑑の種類は？
A: 通常は角印。重要契約は代表印（総務部が判断）。

Q: 契約書の修正が入った場合は？
A: 再度法務部確認→押印申請の流れになります。

Q: 英文契約の場合は？
A: サイン（署名）対応。法務部と顧問弁護士が確認します。`,
    category: '総務',
    department: 'general_affairs',
    tags: ['契約書', '押印', '法務', '承認フロー'],
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date('2024-10-25'),
    usageCount: 89,
    helpful: 84,
    rating: 4.8,
  },
  {
    id: 'know-16',
    title: '社内イベント（懇親会・研修）の企画方法',
    content: `社内イベントの企画から実施、予算申請までの手順。

【企画できるイベント】
- 四半期ごとの懇親会
- チームビルディング研修
- 新年会・忘年会
- 部門別オフサイトミーティング
- 社員旅行（年1回）

【企画手順】
1. イベントの目的を明確化
   - チームの親睦を深める
   - スキルアップ研修
   - リフレッシュ
2. 日程調整（Slackアンケート活用）
3. 予算案を作成
4. 人事部に申請
   - イベント名
   - 目的
   - 日時・場所
   - 参加人数
   - 予算（詳細内訳）
5. 承認後、実施

【予算の目安】
- 懇親会：1人あたり5,000円
- ランチミーティング：1人あたり2,000円
- 研修：講師料50,000円/回 + 会場費
- 社員旅行：1人あたり30,000円

【会場の選び方】
- オフィス近辺（アクセス良好）
- 個室がある（ディスカッション用）
- Wi-Fi完備（オンライン参加者対応）
- 予算内で収まる

【当日の進行】
1. 開始30分前に会場設営
2. 参加者の受付・誘導
3. タイムキーパーを決める
4. 写真撮影（社内SNSに投稿）
5. 終了後、片付け・精算

【精算方法】
1. 領収書を必ず受け取る（会社名宛）
2. Freeeで経費精算
   - 費目：交際費（懇親会）、研修費（研修）
   - 参加者リストを添付
3. 人事部に報告メール
   - 参加人数
   - 予算と実績の差異
   - イベントの振り返り

【オンライン参加の対応】
- Zoomリンクを事前共有
- ハイブリッド開催の場合、マイク・スピーカー準備
- リモート参加者も楽しめる工夫（クイズ、投票）

【よくある質問】
Q: 任意参加のイベントでも会社負担？
A: はい、業務の一環として会社が負担します。

Q: 外部講師を呼びたい
A: 人事部に相談してください。推奨講師リストがあります。

Q: 社員旅行の行き先は？
A: 社員アンケートで決定。過去実績：箱根、熱海、軽井沢。

Q: アルコールが飲めない人への配慮は？
A: ノンアルコール飲料を必ず用意。強要は厳禁です。`,
    category: '人事制度',
    department: 'hr',
    tags: ['イベント', '懇親会', '研修', 'チームビルディング'],
    createdAt: new Date('2024-10-22'),
    updatedAt: new Date('2024-10-22'),
    usageCount: 73,
    helpful: 68,
    rating: 4.6,
  },
  {
    id: 'know-17',
    title: 'テレワーク（在宅勤務）申請とルール',
    content: `テレワークの申請方法、セキュリティルール、勤務時の注意事項。

【テレワーク対象者】
- 全正社員（試用期間終了後）
- 契約社員（上長の許可が必要）
- 週2日まで利用可能

【申請方法】
1. ジョブカンで「テレワーク申請」
2. 希望日を選択（前日までに申請）
3. 上長が承認したらテレワーク可能

【勤務時間】
- 通常勤務と同じ（9:00〜18:00、休憩1時間）
- フレックス適用者はコアタイム遵守
- 出勤・退勤の打刻は通常通り（ジョブカン）

【必要な環境】
- 安定したインターネット接続（Wi-Fi）
- 業務用PC（会社貸与品のみ）
- Web会議用のマイク・カメラ
- 集中できる環境（カフェ・コワーキングOK）

【セキュリティルール】
- 公衆Wi-Fiは使用禁止（VPN必須）
- 画面ロックは必須（離席時）
- 書類の持ち出しは最小限に
- 家族に画面を見られないように注意

【コミュニケーション】
- Slackのステータスを「リモート勤務中」に設定
- 朝会・夕会はオンラインで参加
- レスポンスは30分以内を心がける
- 困った時はすぐにSlackで相談

【会議・商談】
- オンライン会議はZoomを使用
- 顧客との商談も在宅から参加OK
- 資料は事前に共有
- 画面共有を活用

【テレワーク時の経費】
- 電気代・通信費：月3,000円支給（給与に加算）
- 机・椅子の購入補助：上限30,000円（申請制）
- 周辺機器（マウス、キーボード）：会社負担

【注意事項】
- 私用での外出は休憩時間に
- 急な来客対応が必要な場合は出社
- セキュリティインシデントは即報告

【よくある質問】
Q: 週2日以上テレワークしたい
A: 特別な理由（育児、介護など）があれば人事部に相談してください。

Q: テレワーク中に体調不良になったら？
A: 上長に連絡→有給または病欠を申請してください。

Q: カフェで仕事していい？
A: OKです。ただし機密情報を扱う作業は自宅で。

Q: テレワーク中の電話対応は？
A: 会社の固定電話は自動転送されます。携帯で対応してください。`,
    category: '総務',
    department: 'general_affairs',
    tags: ['テレワーク', 'リモートワーク', '在宅勤務', '働き方'],
    createdAt: new Date('2024-10-20'),
    updatedAt: new Date('2024-10-20'),
    usageCount: 201,
    helpful: 189,
    rating: 4.9,
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

