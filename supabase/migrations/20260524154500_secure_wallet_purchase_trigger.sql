-- Trigger function to handle secure wallet deductions when an escrow transaction is created
CREATE OR REPLACE FUNCTION public.deduct_wallet_on_escrow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  -- Get the current balance of the buyer
  SELECT balance_usd INTO v_balance
  FROM public.wallets
  WHERE user_id = NEW.buyer_id
  FOR UPDATE; -- Lock the row to prevent race conditions

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Buyer wallet not found.';
  END IF;

  IF v_balance < NEW.amount_usd THEN
    RAISE EXCEPTION 'Insufficient balance. Top up your wallet first.';
  END IF;

  -- Deduct the amount from the buyer's wallet
  UPDATE public.wallets
  SET balance_usd = balance_usd - NEW.amount_usd,
      updated_at = now()
  WHERE user_id = NEW.buyer_id;

  RETURN NEW;
END;
$$;

-- Create the trigger on escrow_transactions
DROP TRIGGER IF EXISTS trg_deduct_wallet_on_escrow ON public.escrow_transactions;
CREATE TRIGGER trg_deduct_wallet_on_escrow
  BEFORE INSERT ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_wallet_on_escrow();

-- Drop the insecure update policy so users cannot directly update their wallet balance via client code
DROP POLICY IF EXISTS "Users update own wallet" ON public.wallets;
