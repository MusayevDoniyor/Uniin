
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient_uid uuid; sender_name text;
BEGIN
  SELECT p INTO recipient_uid
  FROM public.conversations c, unnest(c.participant_ids) AS p
  WHERE c.id = NEW.conversation_id AND p <> NEW.sender_id
  LIMIT 1;
  SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  IF recipient_uid IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, content, related_id)
    VALUES (recipient_uid, 'message', COALESCE(sender_name,'Someone') || ': ' || left(NEW.content, 60), NEW.conversation_id);
  END IF;
  RETURN NEW;
END $$;
