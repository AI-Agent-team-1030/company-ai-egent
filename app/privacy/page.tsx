import Link from 'next/link'

export const metadata = {
  title: 'プライバシーポリシー | 法人自走型AIエージェント',
  description: 'アドネス株式会社のプライバシーポリシー',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          プライバシーポリシー
        </h1>

        <p className="text-gray-600 mb-8 text-sm">
          最終更新日: 2024年12月1日
        </p>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 mb-6 leading-relaxed">
            アドネス株式会社（以下「当社」といいます）は、本サービス「法人自走型AIエージェント」（以下「本サービス」といいます）における
            ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
          </p>

          {/* 1. 収集する情報 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              1. 収集する情報
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              当社は、本サービスの提供にあたり、以下の情報を収集する場合があります。
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">
              1.1 Google アカウント情報
            </h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>氏名</li>
              <li>メールアドレス</li>
              <li>プロフィール画像</li>
              <li>Google アカウント識別子（ユーザーID）</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">
              1.2 Google Drive データ
            </h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2 ml-4">
              <li>ファイル名およびフォルダ名</li>
              <li>ファイルの内容（ユーザーが明示的に選択した場合のみ）</li>
              <li>ファイルのメタデータ（作成日時、更新日時、サイズ等）</li>
              <li>ファイルの共有設定情報</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">
              1.3 利用情報
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>サービスの利用履歴</li>
              <li>AIとの対話履歴</li>
              <li>アクセスログ（IPアドレス、ブラウザ情報、アクセス日時等）</li>
            </ul>
          </section>

          {/* 2. 情報の利用目的 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              2. 情報の利用目的
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              当社は、収集した情報を以下の目的で利用します。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>本サービスの提供、運営、維持および改善</li>
              <li>ユーザー認証およびアカウント管理</li>
              <li>Google Drive内のファイルへのアクセスおよび分析（AIによる回答生成のため）</li>
              <li>ユーザーからのお問い合わせへの対応</li>
              <li>サービスに関する重要なお知らせの送信</li>
              <li>利用規約違反行為の検知および対応</li>
              <li>統計データの作成（個人を特定できない形式に加工）</li>
            </ul>
          </section>

          {/* 3. データの保存 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              3. データの保存
            </h2>

            <h3 className="text-lg font-medium text-gray-800 mb-3">
              3.1 保存場所
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              ユーザーの情報は、以下の場所に保存されます。
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2 ml-4">
              <li>Google Cloud Platform（Firebase）のサーバー（日本国内またはアジア地域）</li>
              <li>当社が利用するクラウドサービスプロバイダーのサーバー</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-3">
              3.2 保存期間
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>アカウント情報: アカウント削除後30日間</li>
              <li>対話履歴: 最終利用日から1年間</li>
              <li>アクセスログ: 取得日から90日間</li>
              <li>Google Driveのファイルデータ: 処理完了後、一時的なキャッシュは24時間以内に削除</li>
            </ul>
          </section>

          {/* 4. データの共有 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              4. データの共有
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              当社は、以下の場合を除き、ユーザーの個人情報を第三者と共有いたしません。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合、または公的機関からの適法な要請がある場合</li>
              <li>サービス提供に必要な業務委託先（データ処理、サーバー運営等）への提供
                <p className="text-gray-600 text-sm mt-1 ml-6">
                  ※ 委託先とは秘密保持契約を締結し、適切な管理を行います
                </p>
              </li>
              <li>合併、会社分割、事業譲渡その他の事由による事業承継に伴う場合</li>
            </ul>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
              <p className="text-gray-700 text-sm">
                <strong>AI処理について:</strong> ユーザーがアップロードしたファイルや入力した内容は、
                AIによる分析・回答生成のため、当社が利用するAIサービスプロバイダー
                （OpenAI、Anthropic等）に送信される場合があります。
                これらのプロバイダーは、当社との契約に基づき、データを適切に取り扱います。
              </p>
            </div>
          </section>

          {/* 5. データのセキュリティ */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              5. データのセキュリティ
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              当社は、ユーザーの情報を保護するため、以下のセキュリティ対策を実施しています。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>SSL/TLS暗号化通信の使用</li>
              <li>データベースの暗号化</li>
              <li>アクセス権限の厳格な管理</li>
              <li>定期的なセキュリティ監査の実施</li>
              <li>従業員へのセキュリティ教育の実施</li>
            </ul>
          </section>

          {/* 6. ユーザーの権利 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              6. ユーザーの権利
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              ユーザーは、ご自身の個人情報について、以下の権利を有しています。
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">
              6.1 アクセス権
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed ml-4">
              当社が保有するご自身の個人情報の開示を請求することができます。
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">
              6.2 訂正権
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed ml-4">
              不正確な個人情報の訂正を請求することができます。
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">
              6.3 削除権
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed ml-4">
              ご自身の個人情報の削除を請求することができます。
              削除をご希望の場合は、下記のお問い合わせ先までご連絡ください。
              アカウント削除後30日以内に、関連するすべてのデータを削除いたします。
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-3">
              6.4 Google ドライブ連携の解除
            </h3>
            <p className="text-gray-700 leading-relaxed ml-4">
              本サービス内の
              <a
                href="/settings"
                className="text-blue-600 hover:text-blue-800 underline mx-1"
              >
                設定ページ
              </a>
              から、Googleドライブの連携を解除することができます。
              「会社のGoogleドライブ連携」セクションにある「接続を解除」ボタンをクリックしてください。
            </p>
          </section>

          {/* 7. Cookieの使用 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              7. Cookieの使用
            </h2>
            <p className="text-gray-700 leading-relaxed">
              本サービスでは、ユーザー体験の向上およびサービスの改善のためにCookieを使用しています。
              Cookieは、ユーザーのブラウザに保存される小さなテキストファイルです。
              ブラウザの設定によりCookieを無効にすることができますが、
              その場合、本サービスの一部機能が正常に動作しない可能性があります。
            </p>
          </section>

          {/* 8. 未成年者の利用 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              8. 未成年者の利用
            </h2>
            <p className="text-gray-700 leading-relaxed">
              本サービスは、原則として18歳以上の方を対象としています。
              18歳未満の方が本サービスを利用する場合は、
              保護者の同意を得た上でご利用ください。
            </p>
          </section>

          {/* 9. プライバシーポリシーの変更 */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              9. プライバシーポリシーの変更
            </h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、必要に応じて本ポリシーを変更することがあります。
              重要な変更がある場合は、本サービス上での通知またはメールにてお知らせいたします。
              変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じるものとします。
            </p>
          </section>

          {/* 10. お問い合わせ */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              10. お問い合わせ
            </h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              本ポリシーに関するお問い合わせ、または個人情報の開示・訂正・削除のご請求は、
              以下の連絡先までお願いいたします。
            </p>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <p className="text-gray-800 font-medium mb-2">アドネス株式会社 大阪支社</p>
              <p className="text-gray-700 mb-1">
                〒540-0021 大阪府大阪市中央区大手通2丁目4-8 assess大手通ビル4F
              </p>
              <p className="text-gray-700">
                メール:
                <a
                  href="mailto:info.osaka@addness.co.jp"
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                >
                  info.osaka@addness.co.jp
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* ホームへ戻るリンク */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            ホームへ戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
