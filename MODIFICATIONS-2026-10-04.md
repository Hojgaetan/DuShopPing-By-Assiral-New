# Profils entreprise, Boost et pages légales

## Activation sur Supabase

Les fichiers SQL sont préparés localement, sans application à la base distante. Sur une base ayant déjà les migrations du 30 août, appliquer dans cet ordre :

1. supabase/migrations/20261004100000_company_profiles_and_documents.sql
2. supabase/migrations/20261004103000_fix_boost_approval.sql

Utiliser le SQL Editor Supabase ou le processus de migration habituel du projet. La première migration transforme les anciens profils Acheteur en Vendeur, crée leur spécialisation et leur boutique si nécessaire, et conserve les données historiques. Elle supprime la création de nouveaux profils acheteurs. Les entreprises utilisent un rôle Entreprise distinct et les services de publication existants.

La seconde migration aligne la référence des campagnes sur plan_sponsorisations, table utilisée par les paiements. Elle garde le verrou du paiement, verrouille le produit, réserve la validation aux rôles Commercial et SuperAdmin et fournit des erreurs précises. Une durée déjà payée est préservée lors d’un nouveau Boost.

## Parcours à vérifier après migration

- Inscription Vendeur et Entreprise, avec et sans confirmation e-mail.
- Entreprise : CNI recto, verso et RCC obligatoires ; consultation des pièces privées par la modération ; approbation de la boutique seulement après validation du dossier.
- Vendeur : CNI, passeport ou permis ; nouveau dossier après rejet.
- Boost : approbation, rejet et impossibilité de traiter deux fois un même paiement ; affichage de l’erreur serveur si le produit ou le plan est invalide.
- Footer : WhatsApp, mentions légales et politique de confidentialité, y compris sur mobile.

## Informations à compléter

Les pages /mentions-legales et /politique-confidentialite contiennent des champs explicitement à compléter, comme demandé : identité de l’exploitant, RCC, adresse, e-mail, hébergeur et modalités de conservation.

Le service client utilise VITE_ADMIN_WHATSAPP_NUMBER, comme l’envoi de la preuve de paiement Boost. La configuration locale actuelle correspond au +237 650 283 247. Renseigner cette même variable dans l’environnement de déploiement.
