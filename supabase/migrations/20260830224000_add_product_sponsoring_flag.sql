-- Aligne la table produits avec les fonctionnalités Boost déjà installées.
-- Les fonctions PL/pgSQL peuvent être créées avant que leurs colonnes soient
-- validées, d'où l'erreur seulement visible lors de leur exécution.
ALTER TABLE public.produits
  ADD COLUMN IF NOT EXISTS est_sponsorise BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS produits_est_sponsorise_actif_idx
  ON public.produits (date_publication DESC)
  WHERE est_sponsorise = true AND statut = 'Actif';

-- Réconcilie le drapeau avec les éventuelles campagnes déjà actives.
UPDATE public.produits AS p
SET est_sponsorise = EXISTS (
  SELECT 1
  FROM public.campagnes_boost AS c
  WHERE c.produit_id = p.id
    AND c.statut = 'EnCours'
    AND c.date_debut <= now()
    AND c.date_fin > now()
);

-- Force PostgREST à recharger immédiatement le schéma exposé par l'API.
NOTIFY pgrst, 'reload schema';
