-- Répare le chargement de « Mes Articles » après le durcissement des droits.
ALTER TABLE public.produits
  ADD COLUMN IF NOT EXISTS vues_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seller_select_own_products ON public.produits;

CREATE POLICY seller_select_own_products
ON public.produits
FOR SELECT
TO authenticated
USING (
  boutique_id IN (
    SELECT id
    FROM public.boutiques
    WHERE vendeur_id = auth.uid()
  )
);

COMMENT ON POLICY seller_select_own_products ON public.produits IS
  'Permet à un vendeur de consulter tous les articles de sa boutique, quel que soit leur statut.';
