CREATE OR REPLACE FUNCTION public.apply_manual_wallet_topup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO public.wallets (user_id, balance_usd)
    VALUES (NEW.user_id, NEW.amount_usd)
    ON CONFLICT (user_id)
    DO UPDATE SET
      balance_usd = public.wallets.balance_usd + EXCLUDED.balance_usd,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wallet_topups_apply_manual ON public.wallet_topups;
CREATE TRIGGER wallet_topups_apply_manual
AFTER INSERT ON public.wallet_topups
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION public.apply_manual_wallet_topup();