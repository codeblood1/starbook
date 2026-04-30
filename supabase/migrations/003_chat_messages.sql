-- ============================================
-- StarBooker Chat System Migration
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Messages table for live chat between users and admins
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Messages policies

-- Users can view messages in their own chat room
CREATE POLICY "Users can view own messages"
    ON public.messages FOR SELECT USING (user_id = auth.uid());

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
    ON public.messages FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Users can send messages (as the user in their room)
CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND user_id = auth.uid()
    );

-- Admins can reply to any user
CREATE POLICY "Admins can send messages"
    ON public.messages FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Users can mark their own messages as read
CREATE POLICY "Users can update message read status"
    ON public.messages FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can update any message (to mark as read when they respond)
CREATE POLICY "Admins can update messages"
    ON public.messages FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- 4. Create an index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- 5. Function to auto-mark older messages as read when admin replies
CREATE OR REPLACE FUNCTION public.mark_messages_read()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.messages
    SET is_read = TRUE
    WHERE user_id = NEW.user_id
      AND sender_id != NEW.sender_id
      AND is_read = FALSE
      AND created_at < NEW.created_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;

-- Create trigger to auto-mark messages as read when a new message is sent
CREATE TRIGGER on_message_inserted
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.mark_messages_read();
