CREATE OR REPLACE FUNCTION public.validate_product_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  normalized_phone TEXT;
BEGIN
  NEW.titre := trim(COALESCE(NEW.titre, ''));
  NEW.description := trim(COALESCE(NEW.description, ''));

  IF length(NEW.titre) < 3 THEN RAISE EXCEPTION 'Le titre doit contenir au moins 3 caractères'; END IF;
  IF length(NEW.description) < 10 THEN RAISE EXCEPTION 'La description doit contenir au moins 10 caractères'; END IF;
  IF NEW.prix IS NULL OR NEW.prix <= 0 THEN RAISE EXCEPTION 'Le prix doit être supérieur à zéro'; END IF;
  IF NEW.categorie_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.categories WHERE id = NEW.categorie_id
  ) THEN
    RAISE EXCEPTION 'Une catégorie valide est obligatoire';
  END IF;
  IF NEW.images IS NULL
    OR jsonb_typeof(NEW.images) <> 'array'
    OR jsonb_array_length(NEW.images) < 1
    OR jsonb_array_length(NEW.images) > 3
  THEN
    RAISE EXCEPTION 'Ajoutez entre 1 et 3 images';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(NEW.images) AS image_url
    WHERE trim(image_url) = ''
  ) THEN
    RAISE EXCEPTION 'Les URLs des images ne peuvent pas être vides';
  END IF;

  normalized_phone := regexp_replace(COALESCE(NEW.telephone_contact, ''), '[^0-9]', '', 'g');
  IF normalized_phone !~ '^2376[0-9]{8}$' THEN
    RAISE EXCEPTION 'Le numéro doit être un numéro camerounais valide au format +237 6XXXXXXXX';
  END IF;

  NEW.telephone_contact := '+' || normalized_phone;
  IF NEW.whatsapp_contact IS NULL OR trim(NEW.whatsapp_contact) = '' THEN
    NEW.whatsapp_contact := NEW.telephone_contact;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_product_content_trigger ON public.produits;
CREATE TRIGGER validate_product_content_trigger
BEFORE INSERT OR UPDATE OF titre, description, prix, categorie_id, images, telephone_contact, whatsapp_contact
ON public.produits
FOR EACH ROW EXECUTE FUNCTION public.validate_product_content();
