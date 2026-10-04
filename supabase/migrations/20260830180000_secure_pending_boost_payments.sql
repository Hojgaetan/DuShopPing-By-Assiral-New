-- Conserve le plan et le numéro associés à une demande de paiement.
ALTER TABLE public.paiements
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plan_sponsorisations(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS telephone_paiement VARCHAR(50);

-- Le vendeur peut enregistrer uniquement une demande pour son propre compte,
-- et ne peut jamais la déclarer réussie depuis le navigateur.
DROP POLICY IF EXISTS insert_own_pending_payment ON public.paiements;

CREATE POLICY insert_own_pending_payment
ON public.paiements
FOR INSERT
TO authenticated
WITH CHECK (
  vendeur_id = auth.uid()
  AND statut = 'EnAttente'
);

-- Les administrateurs peuvent consulter et traiter les demandes. Une future
-- intégration opérateur devra idéalement effectuer la validation côté serveur.
DROP POLICY IF EXISTS admin_manage_payments ON public.paiements;

CREATE POLICY admin_manage_payments
ON public.paiements
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
