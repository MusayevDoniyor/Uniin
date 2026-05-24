ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chat_rate_usd numeric,
  ADD COLUMN IF NOT EXISTS call_rate_usd numeric,
  ADD COLUMN IF NOT EXISTS booking_rate_usd numeric;