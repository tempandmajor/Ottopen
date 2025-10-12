-- Enforce RLS for bookmarks and reshares

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bookmarks') THEN
    EXECUTE 'ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY';

    -- Owner-only visibility and control
    DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
    CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
      FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can create bookmarks" ON public.bookmarks;
    CREATE POLICY "Users can create bookmarks" ON public.bookmarks
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
    CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reshares') THEN
    EXECUTE 'ALTER TABLE public.reshares ENABLE ROW LEVEL SECURITY';

    -- Owner-only visibility and control (adjust if reshare stream should be public)
    DROP POLICY IF EXISTS "Users can view own reshares" ON public.reshares;
    CREATE POLICY "Users can view own reshares" ON public.reshares
      FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can create reshares" ON public.reshares;
    CREATE POLICY "Users can create reshares" ON public.reshares
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete own reshares" ON public.reshares;
    CREATE POLICY "Users can delete own reshares" ON public.reshares
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
