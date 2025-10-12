-- Enable RLS and add policies for messaging auxiliary tables

-- 1) Enable RLS on tables if not already enabled
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='message_attachments') THEN
    EXECUTE 'ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='message_edit_history') THEN
    EXECUTE 'ALTER TABLE public.message_edit_history ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='message_reactions') THEN
    EXECUTE 'ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Helper invariants:
-- A user can access a message if they are the sender or receiver of the message's conversation
-- EXISTS (
--   SELECT 1 FROM messages m
--   JOIN conversations c ON c.id = m.conversation_id
--   WHERE m.id = <TABLE>.message_id AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
-- )

-- 2) message_attachments policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='message_attachments') THEN
    -- SELECT: participants in the conversation can view attachments
    CREATE POLICY IF NOT EXISTS "Participants can view message attachments" ON public.message_attachments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM messages m
          JOIN conversations c ON c.id = m.conversation_id
          WHERE m.id = message_attachments.message_id
            AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
        )
      );

    -- INSERT: only the message sender can attach files
    CREATE POLICY IF NOT EXISTS "Senders can add attachments" ON public.message_attachments
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM messages m
          WHERE m.id = message_attachments.message_id AND auth.uid() = m.sender_id
        )
      );

    -- DELETE/UPDATE: allow sender to manage their attachments
    CREATE POLICY IF NOT EXISTS "Senders can manage attachments" ON public.message_attachments
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM messages m
          WHERE m.id = message_attachments.message_id AND auth.uid() = m.sender_id
        )
      );

    CREATE POLICY IF NOT EXISTS "Senders can delete attachments" ON public.message_attachments
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM messages m
          WHERE m.id = message_attachments.message_id AND auth.uid() = m.sender_id
        )
      );
  END IF;
END $$;

-- 3) message_edit_history policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='message_edit_history') THEN
    -- SELECT: participants can view edit history
    CREATE POLICY IF NOT EXISTS "Participants can view edit history" ON public.message_edit_history
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM messages m
          JOIN conversations c ON c.id = m.conversation_id
          WHERE m.id = message_edit_history.message_id
            AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
        )
      );

    -- INSERT: only the sender (editor) can record edit history
    CREATE POLICY IF NOT EXISTS "Senders can record edit history" ON public.message_edit_history
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM messages m
          WHERE m.id = message_edit_history.message_id AND auth.uid() = m.sender_id
        )
      );
  END IF;
END $$;

-- 4) message_reactions policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='message_reactions') THEN
    -- SELECT: participants can view reactions
    CREATE POLICY IF NOT EXISTS "Participants can view reactions" ON public.message_reactions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM messages m
          JOIN conversations c ON c.id = m.conversation_id
          WHERE m.id = message_reactions.message_id
            AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
        )
      );

    -- INSERT: user can react if they are participant and reaction belongs to them
    CREATE POLICY IF NOT EXISTS "Participants can add reactions" ON public.message_reactions
      FOR INSERT WITH CHECK (
        message_reactions.user_id = auth.uid() AND EXISTS (
          SELECT 1 FROM messages m
          JOIN conversations c ON c.id = m.conversation_id
          WHERE m.id = message_reactions.message_id
            AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
        )
      );

    -- DELETE: user can remove their own reaction
    CREATE POLICY IF NOT EXISTS "Users can remove own reactions" ON public.message_reactions
      FOR DELETE USING (message_reactions.user_id = auth.uid());
  END IF;
END $$;
