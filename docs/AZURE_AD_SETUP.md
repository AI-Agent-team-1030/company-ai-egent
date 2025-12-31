Azure ADアプリの登録が完了しました。以下が設定内容のまとめです：
登録完了情報
アプリケーション情報
項目値表示名社内ナレッジ検索くんアプリケーション (クライアント) IDf20a7350-d1d0-4b47-a5aa-648803482659ディレクトリ (テナント) IDca11e13c-37b0-4982-ae0d-9eddde30313bサポートされているアカウントの種類すべての Microsoft アカウント ユーザーリダイレクト URISPA: http://localhost:3000
APIのアクセス許可（Microsoft Graph）
許可名種類説明User.Read委任済みユーザー情報の読み取りFiles.Read委任済みユーザーのファイル読み取りFiles.Read.All委任済みすべてのファイル読み取り

次のステップ
7. 環境変数を設定
.env.local ファイルに以下を追加してください：
bashNEXT_PUBLIC_MICROSOFT_CLIENT_ID=f20a7350-d1d0-4b47-a5aa-648803482659
6. 本番用リダイレクトURIを追加（デプロイ時）
本番環境にデプロイする際は、Azure Portalの「認証」メニューから本番URLを追加してください。