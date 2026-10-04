-- Diagnostic en lecture seule du modèle d'authentification ASSIRAL DB.
-- Cette requête ne retourne ni utilisateurs, ni e-mails, ni secrets.
WITH target_tables(table_name) AS (
  VALUES
    ('utilisateurs'),
    ('acheteurs'),
    ('vendeurs'),
    ('administrateurs'),
    ('boutiques')
),
columns_info AS (
  SELECT
    c.table_name,
    jsonb_agg(
      jsonb_build_object(
        'name', c.column_name,
        'type', c.data_type,
        'udt', c.udt_name,
        'nullable', c.is_nullable,
        'default', c.column_default
      )
      ORDER BY c.ordinal_position
    ) AS columns
  FROM information_schema.columns c
  JOIN target_tables t ON t.table_name = c.table_name
  WHERE c.table_schema = 'public'
  GROUP BY c.table_name
),
constraints_info AS (
  SELECT
    tc.table_name,
    jsonb_agg(
      jsonb_build_object(
        'name', tc.constraint_name,
        'type', tc.constraint_type,
        'column', kcu.column_name,
        'foreign_table', ccu.table_name,
        'foreign_column', ccu.column_name
      )
      ORDER BY tc.constraint_name, kcu.ordinal_position
    ) AS constraints
  FROM information_schema.table_constraints tc
  JOIN target_tables t ON t.table_name = tc.table_name
  LEFT JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_schema = tc.constraint_schema
   AND kcu.constraint_name = tc.constraint_name
  LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_schema = tc.constraint_schema
   AND ccu.constraint_name = tc.constraint_name
  WHERE tc.table_schema = 'public'
  GROUP BY tc.table_name
),
triggers_info AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'trigger', tg.tgname,
      'function', p.proname,
      'enabled', tg.tgenabled
    ) ORDER BY tg.tgname
  ) AS triggers
  FROM pg_trigger tg
  JOIN pg_class rel ON rel.oid = tg.tgrelid
  JOIN pg_namespace ns ON ns.oid = rel.relnamespace
  JOIN pg_proc p ON p.oid = tg.tgfoid
  WHERE ns.nspname = 'auth'
    AND rel.relname = 'users'
    AND NOT tg.tgisinternal
),
policies_info AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'table', tablename,
      'name', policyname,
      'command', cmd,
      'roles', roles,
      'using', qual,
      'check', with_check
    ) ORDER BY tablename, policyname
  ) AS policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (SELECT table_name FROM target_tables)
)
SELECT jsonb_pretty(
  jsonb_build_object(
    'tables', COALESCE((
      SELECT jsonb_object_agg(
        c.table_name,
        jsonb_build_object(
          'columns', c.columns,
          'constraints', COALESCE(k.constraints, '[]'::jsonb)
        )
      )
      FROM columns_info c
      LEFT JOIN constraints_info k USING (table_name)
    ), '{}'::jsonb),
    'auth_user_triggers', COALESCE((SELECT triggers FROM triggers_info), '[]'::jsonb),
    'policies', COALESCE((SELECT policies FROM policies_info), '[]'::jsonb)
  )
) AS auth_schema_audit;
