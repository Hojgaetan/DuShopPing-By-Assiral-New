-- Diagnostic en lecture seule de la fonction d'inscription et des enums.
SELECT jsonb_pretty(
  jsonb_build_object(
    'handle_new_user', pg_get_functiondef(p.oid),
    'enums', (
      SELECT jsonb_object_agg(enum_name, enum_values)
      FROM (
        SELECT
          t.typname AS enum_name,
          jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
          AND t.typname IN ('statut_compte', 'role_admin')
        GROUP BY t.typname
      ) enum_list
    )
  )
) AS auth_trigger_audit
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';
