
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS custom_stats jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extracurricular_items jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Notification trigger helpers
CREATE OR REPLACE FUNCTION public.notify_on_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author_uid uuid; liker_name text;
BEGIN
  SELECT p.user_id INTO author_uid FROM public.posts po
    JOIN public.profiles p ON p.id = po.author_id WHERE po.id = NEW.post_id;
  SELECT full_name INTO liker_name FROM public.profiles WHERE user_id = NEW.user_id;
  IF author_uid IS NOT NULL AND author_uid <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (author_uid, 'like', COALESCE(liker_name,'Someone') || ' postingizga reaksiya bildirdi', NEW.post_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_post_like ON public.post_likes;
CREATE TRIGGER trg_notify_post_like AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_post_like();

CREATE OR REPLACE FUNCTION public.notify_on_post_reaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author_uid uuid; reactor_name text;
BEGIN
  SELECT p.user_id INTO author_uid FROM public.posts po
    JOIN public.profiles p ON p.id = po.author_id WHERE po.id = NEW.post_id;
  SELECT full_name INTO reactor_name FROM public.profiles WHERE user_id = NEW.user_id;
  IF author_uid IS NOT NULL AND author_uid <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (author_uid, 'reaction', COALESCE(reactor_name,'Someone') || ' postingizga ' || NEW.reaction || ' qo''ydi', NEW.post_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_post_reaction ON public.post_reactions;
CREATE TRIGGER trg_notify_post_reaction AFTER INSERT ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_post_reaction();

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author_uid uuid; commenter_uid uuid; commenter_name text;
BEGIN
  SELECT p.user_id INTO author_uid FROM public.posts po
    JOIN public.profiles p ON p.id = po.author_id WHERE po.id = NEW.post_id;
  SELECT user_id, full_name INTO commenter_uid, commenter_name FROM public.profiles WHERE id = NEW.author_id;
  IF author_uid IS NOT NULL AND author_uid <> commenter_uid THEN
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (author_uid, 'comment', COALESCE(commenter_name,'Someone') || ' postingizga izoh yozdi', NEW.post_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_comment ON public.post_comments;
CREATE TRIGGER trg_notify_comment AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE followed_uid uuid; follower_name text;
BEGIN
  SELECT user_id INTO followed_uid FROM public.profiles WHERE id = NEW.following_id;
  SELECT full_name INTO follower_name FROM public.profiles WHERE user_id = NEW.follower_id;
  IF followed_uid IS NOT NULL AND followed_uid <> NEW.follower_id THEN
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (followed_uid, 'follow', COALESCE(follower_name,'Someone') || ' sizga obuna bo''ldi', NEW.following_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_follow ON public.follows;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient_uid uuid; sender_name text;
BEGIN
  SELECT unnest(participant_ids) INTO recipient_uid FROM public.conversations
    WHERE id = NEW.conversation_id AND unnest(participant_ids) <> NEW.sender_id LIMIT 1;
  SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  IF recipient_uid IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (recipient_uid, 'message', COALESCE(sender_name,'Someone') || ': ' || left(NEW.content, 60), NEW.conversation_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_message ON public.messages;
CREATE TRIGGER trg_notify_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- Allow pdf for certificates storage already public; ensure post-media bucket exists for posts
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media','post-media',true)
  ON CONFLICT (id) DO UPDATE SET public = true;
