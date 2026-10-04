-- Les offres commerciales doivent être consultables par les vendeurs et
-- visiteurs, tandis que leur modification reste réservée aux administrateurs.
DROP POLICY IF EXISTS select_sponsoring_plans ON public.plan_sponsorisations;

CREATE POLICY select_sponsoring_plans
ON public.plan_sponsorisations
FOR SELECT
TO public
USING (true);
