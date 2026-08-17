ALTER TABLE public.study_materials
  ADD COLUMN IF NOT EXISTS last_chapter integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_tab text NOT NULL DEFAULT 'leitura';

ALTER TABLE public.flashcards
  ADD COLUMN IF NOT EXISTS ease numeric NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repetitions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own roles" ON public.user_roles;
CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'igorsouzainformatica@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own credits read" ON public.user_credits;
CREATE POLICY "own credits read" ON public.user_credits FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own credits write" ON public.user_credits;
CREATE POLICY "own credits write" ON public.user_credits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own credits update" ON public.user_credits;
CREATE POLICY "own credits update" ON public.user_credits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TRIGGER IF EXISTS set_user_credits_updated_at ON public.user_credits;
CREATE TRIGGER set_user_credits_updated_at BEFORE UPDATE ON public.user_credits
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own credit transactions" ON public.credit_transactions;
CREATE POLICY "own credit transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own credit transactions insert" ON public.credit_transactions;
CREATE POLICY "own credit transactions insert" ON public.credit_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);