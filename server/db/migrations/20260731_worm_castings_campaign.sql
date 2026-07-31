-- August 2026 community gift. One redemption per normalized email.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.sp_worm_castings_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_key text NOT NULL DEFAULT 'free-worm-castings-2026-08',
  customer_id bigint REFERENCES public.sp_customers(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  email_normalized text NOT NULL,
  redemption_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  issued_at timestamptz NOT NULL DEFAULT now(),
  distribution_status text NOT NULL DEFAULT 'pending'
    CHECK (distribution_status IN ('pending', 'sending', 'sent', 'failed')),
  distribution_attempts integer NOT NULL DEFAULT 0 CHECK (distribution_attempts >= 0),
  distribution_last_error text,
  distribution_provider_id text,
  distribution_sent_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by_user_id bigint REFERENCES public.sp_users(id) ON DELETE SET NULL,
  redeemed_location text,
  redeemed_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sp_worm_castings_one_email_per_campaign UNIQUE (campaign_key, email_normalized)
);

ALTER TABLE public.sp_worm_castings_redemptions
  ADD COLUMN IF NOT EXISTS customer_id bigint REFERENCES public.sp_customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sp_worm_castings_unredeemed_idx
  ON public.sp_worm_castings_redemptions (campaign_key, redeemed_at)
  WHERE redeemed_at IS NULL;

CREATE OR REPLACE FUNCTION public.redeem_worm_castings(
  p_redemption_token uuid,
  p_redeemed_by_user_id bigint,
  p_location text DEFAULT 'SSW Yard'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.sp_worm_castings_redemptions%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF v_now < timestamptz '2026-08-01 00:00:00 America/Phoenix' THEN
    RETURN jsonb_build_object('status', 'not_active');
  END IF;
  IF v_now >= timestamptz '2026-09-01 00:00:00 America/Phoenix' THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;

  UPDATE public.sp_worm_castings_redemptions
  SET redeemed_at = v_now,
      redeemed_by_user_id = p_redeemed_by_user_id,
      redeemed_location = COALESCE(NULLIF(trim(p_location), ''), 'SSW Yard'),
      updated_at = v_now
  WHERE redemption_token = p_redemption_token
    AND campaign_key = 'free-worm-castings-2026-08'
    AND redeemed_at IS NULL
  RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN jsonb_build_object('status', 'redeemed', 'redemption_id', v_row.id, 'redeemed_at', v_row.redeemed_at);
  END IF;

  SELECT * INTO v_row FROM public.sp_worm_castings_redemptions
  WHERE redemption_token = p_redemption_token AND campaign_key = 'free-worm-castings-2026-08';
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'invalid'); END IF;
  IF v_row.redeemed_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'already_redeemed', 'redeemed_at', v_row.redeemed_at); END IF;
  RETURN jsonb_build_object('status', 'unavailable');
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_worm_castings(uuid, bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_worm_castings(uuid, bigint, text) TO service_role;
