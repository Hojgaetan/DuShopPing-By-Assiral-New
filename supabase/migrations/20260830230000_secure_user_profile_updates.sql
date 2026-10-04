DROP POLICY IF EXISTS manage_own_utilisateur ON public.utilisateurs;
DROP POLICY IF EXISTS select_own_utilisateur ON public.utilisateurs;

CREATE POLICY select_own_utilisateur
ON public.utilisateurs
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_my_profile(profile_name TEXT, profile_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_name TEXT := trim(COALESCE(profile_name, ''));
  normalized_phone TEXT := regexp_replace(COALESCE(profile_phone, ''), '[^0-9]', '', 'g');
  user_type TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  IF length(normalized_name) < 2 OR length(normalized_name) > 100 THEN
    RAISE EXCEPTION 'Le nom doit contenir entre 2 et 100 caractères';
  END IF;

  SELECT type_utilisateur::TEXT INTO user_type
  FROM public.utilisateurs WHERE id = auth.uid();

  IF user_type = 'Vendeur' AND normalized_phone !~ '^2376[0-9]{8}$' THEN
    RAISE EXCEPTION 'Le téléphone doit être au format +237 6XXXXXXXX';
  END IF;

  UPDATE public.utilisateurs
  SET nom = normalized_name,
      telephone = CASE WHEN normalized_phone = '' THEN NULL ELSE '+' || normalized_phone END
  WHERE id = auth.uid();

  RETURN jsonb_build_object(
    'nom', normalized_name,
    'telephone', CASE WHEN normalized_phone = '' THEN NULL ELSE '+' || normalized_phone END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT) TO authenticated;
