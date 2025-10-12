-- Helper: function to check if current user's email is confirmed
CREATE OR REPLACE FUNCTION public.is_email_confirmed()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_email_confirmed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_confirmed() TO anon, authenticated;

-- Apply policies per table if they exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='posts') THEN
    -- Require confirmed email for creating posts
    DROP POLICY IF EXISTS "Require confirmed email to insert posts" ON public.posts;
    CREATE POLICY "Require confirmed email to insert posts" ON public.posts
      FOR INSERT
      WITH CHECK (public.is_email_confirmed() AND auth.uid() = user_id);

    -- Require confirmed email for updating/deleting own posts
    DROP POLICY IF EXISTS "Require confirmed email to modify own posts" ON public.posts;
    CREATE POLICY "Require confirmed email to modify own posts" ON public.posts
      FOR UPDATE USING (public.is_email_confirmed() AND auth.uid() = user_id)
      WITH CHECK (public.is_email_confirmed() AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Require confirmed email to delete own posts" ON public.posts;
    CREATE POLICY "Require confirmed email to delete own posts" ON public.posts
      FOR DELETE USING (public.is_email_confirmed() AND auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='comments') THEN
    DROP POLICY IF EXISTS "Require confirmed email to insert comments" ON public.comments;
    CREATE POLICY "Require confirmed email to insert comments" ON public.comments
      FOR INSERT
      WITH CHECK (public.is_email_confirmed() AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Require confirmed email to modify own comments" ON public.comments;
    CREATE POLICY "Require confirmed email to modify own comments" ON public.comments
      FOR UPDATE USING (public.is_email_confirmed() AND auth.uid() = user_id)
      WITH CHECK (public.is_email_confirmed() AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Require confirmed email to delete own comments" ON public.comments;
    CREATE POLICY "Require confirmed email to delete own comments" ON public.comments
      FOR DELETE USING (public.is_email_confirmed() AND auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='likes') THEN
    DROP POLICY IF EXISTS "Require confirmed email to like" ON public.likes;
    CREATE POLICY "Require confirmed email to like" ON public.likes
      FOR INSERT
      WITH CHECK (public.is_email_confirmed() AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Require confirmed email to unlike" ON public.likes;
    CREATE POLICY "Require confirmed email to unlike" ON public.likes
      FOR DELETE USING (public.is_email_confirmed() AND auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bookmarks') THEN
    DROP POLICY IF EXISTS "Require confirmed email to bookmark" ON public.bookmarks;
    CREATE POLICY "Require confirmed email to bookmark" ON public.bookmarks
      FOR INSERT
      WITH CHECK (public.is_email_confirmed() AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Require confirmed email to unbookmark" ON public.bookmarks;
    CREATE POLICY "Require confirmed email to unbookmark" ON public.bookmarks
      FOR DELETE USING (public.is_email_confirmed() AND auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reshares') THEN
    DROP POLICY IF EXISTS "Require confirmed email to reshare" ON public.reshares;
    CREATE POLICY "Require confirmed email to reshare" ON public.reshares
      FOR INSERT
      WITH CHECK (public.is_email_confirmed() AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Require confirmed email to un-reshare" ON public.reshares;
    CREATE POLICY "Require confirmed email to un-reshare" ON public.reshares
      FOR DELETE USING (public.is_email_confirmed() AND auth.uid() = user_id);
  END IF;
END $$;
