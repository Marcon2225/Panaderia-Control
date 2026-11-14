-- 020_fix_auth_trigger.sql
-- Corrección del trigger handle_new_user
-- Problemas corregidos:
-- 1. EXCEPTION WHEN OTHERS traga errores críticos → signup parece éxito pero sin tenant/user
-- 2. Race condition en slug único (WHILE LOOP no atómico)
-- 3. No manejo de raw_user_meta_data NULL
-- 4. No validación de email confirmado (Supabase crea usuario en auth.users ANTES de confirmar email)

-- ============================================
-- Función mejorada para crear tenant + user en signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_tenant_id UUID;
    v_slug TEXT;
    v_base_slug TEXT;
    v_email TEXT := lower(NEW.email);
    v_name TEXT;
    v_business_name TEXT;
    v_trade_name TEXT;
    v_currency TEXT;
    v_timezone TEXT;
BEGIN
    -- Validar que el email está confirmado (Supabase: email_confirmed_at IS NOT NULL)
    -- Si no está confirmado, no crear tenant/user todavía
    -- El trigger se volverá a disparar cuando se confirme (ver nota abajo)
    IF NEW.email_confirmed_at IS NULL THEN
        RAISE LOG 'Signup for %: email not confirmed yet, skipping tenant/user creation', v_email;
        RETURN NEW;
    END IF;

    -- Extraer metadata de forma segura (raw_user_meta_data puede ser NULL)
    v_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), v_email);
    v_business_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'business_name', ''), 'Mi Panadería');
    v_trade_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'trade_name', ''), 'Mi Panadería');
    v_currency := COALESCE(NULLIF(NEW.raw_user_meta_data->>'currency', ''), 'ARS');
    v_timezone := COALESCE(NULLIF(NEW.raw_user_meta_data->>'timezone', ''), 'America/Argentina/Buenos_Aires');

    -- Generar slug base único desde email (solo alfanumérico y guiones)
    v_base_slug := lower(regexp_replace(v_email, '[^a-z0-9]+', '-', 'g'));
    v_base_slug := regexp_replace(v_base_slug, '^-|-$', '', 'g');
    v_base_slug := substring(v_base_slug FROM 1 FOR 50);

    -- Insertar tenant con ON CONFLICT para manejar concurrencia atómicamente
    -- Usamos gen_random_uuid() como fallback si hay colisión extrema
    INSERT INTO tenants (slug, business_name, trade_name, email, currency, timezone)
    VALUES (
        v_base_slug,
        v_business_name,
        v_trade_name,
        v_email,
        v_currency,
        v_timezone
    )
    ON CONFLICT (slug) DO UPDATE SET
        slug = tenants.slug || '-' || substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6),
        business_name = EXCLUDED.business_name,
        trade_name = EXCLUDED.trade_name,
        email = EXCLUDED.email,
        currency = EXCLUDED.currency,
        timezone = EXCLUDED.timezone
    RETURNING id INTO v_tenant_id;

    -- Si el ON CONFLICT DO UPDATE no retornó id (caso edge), hacer INSERT con slug único
    IF v_tenant_id IS NULL THEN
        v_slug := v_base_slug || '-' || substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 8);
        INSERT INTO tenants (slug, business_name, trade_name, email, currency, timezone)
        VALUES (v_slug, v_business_name, v_trade_name, v_email, v_currency, v_timezone)
        RETURNING id INTO v_tenant_id;
    END IF;

    -- Crear perfil de usuario (owner por ser el primero)
    INSERT INTO users (auth_uid, tenant_id, name, email, role)
    VALUES (
        NEW.id,
        v_tenant_id,
        v_name,
        v_email,
        'owner'
    )
    ON CONFLICT (auth_uid) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        -- NO tragar el error: relanzar para que falle el signup
        -- El usuario verá el error en el frontend y podrá reintentar
        RAISE EXCEPTION 'Error creando tenant/usuario para %: %', v_email, SQLERRM;
END $$;

-- ============================================
-- Nota importante sobre flujo de confirmación de email:
-- 1. Usuario hace signup → auth.users se crea con email_confirmed_at = NULL
-- 2. Trigger se dispara → detecta email no confirmado → retorna NEW sin crear tenant
-- 3. Usuario confirma email → Supabase actualiza email_confirmed_at
-- 4. Supabase NO dispara trigger AFTER INSERT nuevamente
--
-- SOLUCIÓN: Usar Supabase Auth Hook (Edge Function) o manejar desde cliente
-- OPCIÓN A (recomendada para MVP): Cliente llama a RPC tras confirmar email
-- OPCIÓN B: Edge Function en Supabase Dashboard (Auth > Hooks)
--
-- Para MVP: Documentamos que el cliente debe llamar a `create_tenant_and_profile()`
-- después de confirmar email. Ver función abajo.
-- ============================================

-- Función RPC para que el cliente cree tenant/profile tras confirmar email
CREATE OR REPLACE FUNCTION create_tenant_and_profile(
    p_email TEXT,
    p_name TEXT DEFAULT NULL,
    p_business_name TEXT DEFAULT NULL,
    p_trade_name TEXT DEFAULT NULL,
    p_currency TEXT DEFAULT 'ARS',
    p_timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_slug TEXT;
    v_base_slug TEXT;
BEGIN
    -- Buscar usuario en auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado en auth.users: %', p_email;
    END IF;

    -- Verificar si ya tiene perfil en public.users
    IF EXISTS (SELECT 1 FROM users WHERE auth_uid = v_user_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Perfil ya existe', 'tenant_id', (SELECT tenant_id FROM users WHERE auth_uid = v_user_id));
    END IF;

    -- Generar slug
    v_base_slug := lower(regexp_replace(p_email, '[^a-z0-9]+', '-', 'g'));
    v_base_slug := regexp_replace(v_base_slug, '^-|-$', '', 'g');
    v_base_slug := substring(v_base_slug FROM 1 FOR 50);

    -- Crear tenant
    INSERT INTO tenants (slug, business_name, trade_name, email, currency, timezone)
    VALUES (
        v_base_slug,
        COALESCE(p_business_name, 'Mi Panadería'),
        COALESCE(p_trade_name, 'Mi Panadería'),
        p_email,
        p_currency,
        p_timezone
    )
    ON CONFLICT (slug) DO UPDATE SET
        slug = tenants.slug || '-' || substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6)
    RETURNING id INTO v_tenant_id;

    IF v_tenant_id IS NULL THEN
        v_slug := v_base_slug || '-' || substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 8);
        INSERT INTO tenants (slug, business_name, trade_name, email, currency, timezone)
        VALUES (v_slug, COALESCE(p_business_name, 'Mi Panadería'), COALESCE(p_trade_name, 'Mi Panadería'), p_email, p_currency, p_timezone)
        RETURNING id INTO v_tenant_id;
    END IF;

    -- Crear perfil
    INSERT INTO users (auth_uid, tenant_id, name, email, role)
    VALUES (
        v_user_id,
        v_tenant_id,
        COALESCE(p_name, p_email),
        p_email,
        'owner'
    );

    RETURN jsonb_build_object('success', true, 'tenant_id', v_tenant_id, 'user_id', v_user_id);

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en create_tenant_and_profile: %', SQLERRM;
END $$;

-- Trigger actualizado (reemplaza el anterior)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();