-- 025_update_last_login_client.sql
-- Documentación y función RPC para actualizar last_login_at desde cliente
-- Problema: Supabase no expone trigger nativo en login
-- Solución: Cliente llama a RPC tras autenticación exitosa

-- ============================================
-- Función RPC para actualizar last_login_at
-- Se llama desde frontend tras supabase.auth.getSession() o onAuthStateChange
-- ============================================
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE auth_uid = auth.uid() AND is_active;

    IF v_user_id IS NULL THEN
        -- Usuario autenticado pero sin perfil en public.users
        -- Puede ocurrir si signup no completó (email no confirmado)
        RETURN jsonb_build_object('success', false, 'message', 'Perfil no encontrado');
    END IF;

    UPDATE users
    SET last_login_at = now()
    WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'last_login_at', now());
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END $$;

-- ============================================
-- Función RPC para obtener perfil completo del usuario autenticado
-- Incluye tenant info para inicializar app
-- ============================================
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user users%ROWTYPE;
    v_tenant tenants%ROWTYPE;
BEGIN
    SELECT * INTO v_user FROM users WHERE auth_uid = auth.uid() AND is_active;

    IF v_user IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Perfil no encontrado. ¿Email confirmado?',
            'needs_setup', true
        );
    END IF;

    SELECT * INTO v_tenant FROM tenants WHERE id = v_user.tenant_id AND is_active;

    RETURN jsonb_build_object(
        'success', true,
        'user', to_jsonb(v_user),
        'tenant', to_jsonb(v_tenant)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END $$;

-- ============================================
-- Notas de implementación en frontend:
--
-- 1. En AuthProvider o layout principal:
--    useEffect(() => {
--      supabase.auth.onAuthStateChange((event, session) => {
--        if (event === 'SIGNED_IN' && session) {
--          supabase.rpc('update_last_login');
--        }
--      });
--    }, []);
--
-- 2. Al cargar app, llamar get_my_profile() para obtener tenant/user
--    const { data } = await supabase.rpc('get_my_profile');
--    if (!data.success && data.needs_setup) {
--      // Redirigir a setup o llamar create_tenant_and_profile()
--    }
--
-- 3. Para cambiar perfil propio: supabase.rpc('update_own_profile', { name: 'Nuevo' })
-- 4. Para admin gestionar usuarios: supabase.rpc('admin_update_user', { user_id, role: 'panadero' })
-- ============================================