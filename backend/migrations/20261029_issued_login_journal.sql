-- Existing application DB owner only. No grants, tokens, FK, retention or historical backfill.
-- Caller supplies BEGIN/COMMIT (IhaleAB migration runner already does).
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='10s';
CREATE TABLE IF NOT EXISTS public.lingeria_issued_login_source_state (
 id integer PRIMARY KEY CHECK(id=1),installed_at timestamptz NOT NULL,
 app_id text NOT NULL,evidence_kind text NOT NULL
);
INSERT INTO public.lingeria_issued_login_source_state VALUES(1,clock_timestamp(),'lingeria','auth-session-issued-v1') ON CONFLICT(id) DO NOTHING;
UPDATE public.lingeria_issued_login_source_state SET installed_at=GREATEST(installed_at,clock_timestamp())
 WHERE id=1 AND to_regclass('public.lingeria_issued_login_events') IS NULL;
CREATE TABLE IF NOT EXISTS public.lingeria_issued_login_events (
 id text PRIMARY KEY NOT NULL,actor_id text NOT NULL,method text NOT NULL,
 at timestamptz NOT NULL DEFAULT clock_timestamp(),excluded boolean NOT NULL
);
CREATE INDEX IF NOT EXISTS lingeria_issued_login_events_at ON public.lingeria_issued_login_events(at);
DO $guard$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.lingeria_issued_login_source_state WHERE id=1 AND app_id='lingeria' AND evidence_kind='auth-session-issued-v1') THEN RAISE EXCEPTION 'LOGIN_SOURCE_STATE_MISMATCH'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class c WHERE c.oid IN ('public.lingeria_issued_login_events'::regclass,'public.lingeria_issued_login_source_state'::regclass) AND (c.relowner<>(SELECT oid FROM pg_roles WHERE rolname=current_user) OR c.relrowsecurity)) THEN RAISE EXCEPTION 'LOGIN_SOURCE_OWNER_OR_RLS_MISMATCH'; END IF;
 IF EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.lingeria_issued_login_events'::regclass AND contype='f') OR EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid IN ('public.lingeria_issued_login_events'::regclass,'public.lingeria_issued_login_source_state'::regclass) AND NOT tgisinternal) THEN RAISE EXCEPTION 'LOGIN_SOURCE_NOT_APPEND_ONLY'; END IF;
 IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='lingeria_issued_login_events' AND column_name IN ('id','actor_id','method','at','excluded') AND is_nullable='NO')<>5 THEN RAISE EXCEPTION 'LOGIN_SOURCE_NULLABLE'; END IF;
END;
$guard$;
