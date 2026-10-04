-- Chaque demande Boost concerne désormais un produit précis.
ALTER TABLE public.paiements
  ADD COLUMN IF NOT EXISTS produit_id UUID REFERENCES public.produits(id) ON DELETE RESTRICT;

-- Renforce la création : le produit doit appartenir au vendeur connecté.
DROP POLICY IF EXISTS insert_own_pending_payment ON public.paiements;

CREATE POLICY insert_own_pending_payment
ON public.paiements
FOR INSERT
TO authenticated
WITH CHECK (
  vendeur_id = auth.uid()
  AND statut = 'EnAttente'
  AND produit_id IS NOT NULL
  AND produit_id IN (
    SELECT p.id
    FROM public.produits p
    JOIN public.boutiques b ON b.id = p.boutique_id
    WHERE b.vendeur_id = auth.uid()
  )
);
