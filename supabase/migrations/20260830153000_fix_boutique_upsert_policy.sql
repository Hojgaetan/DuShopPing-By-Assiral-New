-- Permet au vendeur authentifié de créer sa boutique si le trigger
-- d'inscription ne l'a pas créée, tout en limitant l'écriture à sa ligne.
DROP POLICY IF EXISTS manage_own_boutique ON public.boutiques;

CREATE POLICY manage_own_boutique
ON public.boutiques
FOR ALL
TO authenticated
USING (vendeur_id = auth.uid())
WITH CHECK (vendeur_id = auth.uid());
