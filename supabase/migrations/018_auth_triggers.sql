-- 018_auth_triggers.sql
-- Triggers para creación automática de tenant + user al registrarse
-- Requiere que el usuario haga signup con email/password

-- Función para crear tenant y usuario automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_tenant_id UUID;
    v_slug TEXT;
    v_base_slug TEXT;
BEGIN
    -- Generar slug único basado en email
    v_base_slug := lower(regexp_replace(NEW.email, '[^a-z0-9]+', '-', 'g'));
    v_base_slug := regexp_replace(v_base_slug, '^-|-$', '', 'g');
    v_base_slug := substring(v_base_slug FROM 1 FOR 50);

    v_slug := v_base_slug;
    -- Asegurar unicidad del slug
    WHILE EXISTS (SELECT 1 FROM tenants WHERE slug = v_slug) LOOP
        v_slug := v_base_slug || '-' || substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6);
    END LOOP;

    -- Crear tenant
    INSERT INTO tenants (slug, business_name, trade_name, email, currency, timezone)
    VALUES (
        v_slug,
        COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi Panadería'),
        COALESCE(NEW.raw_user_meta_data->>'trade_name', 'Mi Panadería'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'currency', 'ARS'),
        COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Argentina/Buenos_Aires')
    )
    RETURNING id INTO v_tenant_id;

    -- Crear perfil de usuario (owner por ser el primero)
    INSERT INTO users (auth_uid, tenant_id, name, email, role)
    VALUES (
        NEW.id,
        v_tenant_id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        'owner'
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log el error pero no fallar el signup
        RAISE LOG 'Error creating tenant/user for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END $$;

-- Trigger en auth.users (se ejecuta después de signup confirmado)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función para actualizar last_login_at
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE users
    SET last_login_at = now()
    WHERE auth_uid = NEW.id;
    RETURN NEW;
END $$;

-- Trigger en auth.users para login (requiere hook personalizado o usar supabase functions)
-- Nota: Supabase no expone trigger nativo en login, se maneja via cliente o edge function