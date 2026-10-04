-- Aligne la table produits avec le formulaire vendeur.
ALTER TABLE public.produits
  ADD COLUMN IF NOT EXISTS sous_categorie VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telephone_contact VARCHAR(50),
  ADD COLUMN IF NOT EXISTS whatsapp_contact VARCHAR(50);

-- Les sous-catégories sont administrées comme une liste sur la catégorie.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS sous_categories TEXT[] DEFAULT '{}' NOT NULL;

-- Autorise un vendeur authentifié à créer et gérer uniquement les produits
-- appartenant à sa propre boutique.
DROP POLICY IF EXISTS manage_own_produits ON public.produits;

CREATE POLICY manage_own_produits
ON public.produits
FOR ALL
TO authenticated
USING (
  boutique_id IN (
    SELECT id
    FROM public.boutiques
    WHERE vendeur_id = auth.uid()
  )
)
WITH CHECK (
  boutique_id IN (
    SELECT id
    FROM public.boutiques
    WHERE vendeur_id = auth.uid()
  )
);
