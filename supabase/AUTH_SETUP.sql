-- 認証設定

-- ===================================
-- サインアップ後のプロファイル自動作成
-- ===================================

-- プロファイルテーブル（オプション）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- プロファイルポリシー
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- サインアップ時に自動的にプロファイルを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを作成（既存の場合は削除してから作成）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===================================
-- メール確認の無効化（開発環境用）
-- ===================================
-- 注意: プロダクション環境では必ずメール確認を有効にしてください
-- Supabaseダッシュボードの Authentication > Settings > Email Auth で設定します
--
-- 開発環境では以下の設定を推奨：
-- - Enable email confirmations: OFF
-- - Enable email change confirmations: OFF
--
-- または、ローカル開発用の Supabase CLI で以下を実行：
-- supabase settings update auth.enable_signup = true
-- supabase settings update auth.email_confirm_window = 86400
