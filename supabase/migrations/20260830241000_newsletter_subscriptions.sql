CREATE TABLE IF NOT EXISTS public.abonnements_newsletter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  est_actif BOOLEAN NOT NULL DEFAULT true,
  date_inscription TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_email_format CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_email_unique ON public.abonnements_newsletter(lower(email));
ALTER TABLE public.abonnements_newsletter ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.subscribe_newsletter(subscriber_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE normalized_email TEXT := lower(trim(subscriber_email));
BEGIN
  IF normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN RAISE EXCEPTION 'Adresse e-mail invalide'; END IF;
  INSERT INTO public.abonnements_newsletter(email) VALUES (normalized_email)
  ON CONFLICT (lower(email)) DO UPDATE SET est_actif = true, date_inscription = now();
END; $$;
REVOKE ALL ON FUNCTION public.subscribe_newsletter(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(TEXT) TO anon, authenticated;
