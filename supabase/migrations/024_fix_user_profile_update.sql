-- 024_fix_user_profile_update.sql
-- Protección adicional a nivel DB para campos críticos de users
-- Problemas corregidos:
-- 1. RLS policy UPDATE usa subquery en WITH CHECK que puede ser evadida
-- 2. Necesario constraint a nivel DB para tenant_id, auth_uid, role inmutables por usuario
-- 3. Solo owners/admins del mismo tenant pueden cambiar roles/activar-desactivar usuarios

-- ============================================
-- Trigger para proteger campos inmutables en users
-- ============================================
CREATE OR REPLACE FUNCTION trg_protect_user_critical_fields()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    -- Solo validar en UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Usuario normal (no owner/admin) intentando cambiar su propio perfil
        IF OLD.auth_uid = auth.uid() THEN
            -- Campos que NUNCA puede cambiar el propio usuario
            IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
                RAISE EXCEPTION 'No se puede cambiar tenant_id del propio perfil';
            END IF;
            IF OLD.auth_uid IS DISTINCT FROM NEW.auth_uid THEN
                RAISE EXCEPTION 'No se puede cambiar auth_uid';
            END IF;
            IF OLD.role IS DISTINCT FROM NEW.role THEN
                RAISE EXCEPTION 'No se puede cambiar el propio rol';
            END IF;
            -- is_active: usuario no puede desactivarse a sí mismo
            IF OLD.is_active = true AND NEW.is_active = false THEN
                RAISE EXCEPTION 'No se puede desactivar el propio usuario';
            END IF;
        END IF;

        -- Owner/admin de OTRO tenant intentando modificar usuario (bloqueado por RLS pero defensa extra)
        IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
            RAISE EXCEPTION 'No se puede mover usuario a otro tenant';
        END IF;

        -- Cambio de role: solo owner/admin del MISMO tenant
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            IF NOT EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_uid = auth.uid()
                  AND u.tenant_id = OLD.tenant_id
                  AND u.role IN ('owner', 'admin')
                  AND u.is_active
            ) THEN
                RAISE EXCEPTION 'Solo owner/admin del tenant puede cambiar roles';
            END IF;
        END IF;

        -- Cambio de is_active (activar/desactivar): solo owner/admin del MISMO tenant
        IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
            IF NOT EXISTS (
                SELECT 1 FROM users u
                WHERE u.auth_uid = auth.uid()
                  AND u.tenant_id = OLD.tenant_id
                  AND u.role IN ('owner', 'admin')
                  AND u.is_active
            ) THEN
                RAISE EXCEPTION 'Solo owner/admin del tenant puede activar/desactivar usuarios';
            END IF;
            -- Prevenir que owner se desactive a sí mismo si es el único
            IF OLD.role = 'owner' AND NEW.is_active = false THEN
                IF (SELECT count(*) FROM users WHERE tenant_id = OLD.tenant_id AND role = 'owner' AND is_active) = 1 THEN
                    RAISE EXCEPTION 'No se puede desactivar el único owner del tenant';
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_users_protect_critical_fields ON users;
CREATE TRIGGER trg_users_protect_critical_fields
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trg_protect_user_critical_fields();

-- ============================================
-- Constraint a nivel DB para tenant_id, auth_uid inmutables
-- (role e is_active sí pueden cambiar via owner/admin)
-- ============================================
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS chk_users_immutable_fields,
    ADD CONSTRAINT chk_users_immutable_fields
    CHECK (
        -- Estos campos nunca deben cambiar tras INSERT
        -- Nota: PostgreSQL no permite OLD/NEW en CHECK, esto es documentación
        -- La validación real está en el trigger BEFORE UPDATE
        true
    );

-- ============================================
-- Función RPC para que owner/admin gestionen usuarios de su tenant
-- ============================================
CREATE OR REPLACE FUNCTION admin_update_user(
    p_user_id UUID,
    p_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_role user_role DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current_user_id UUID;
    v_target_user users%ROWTYPE;
BEGIN
    -- Obtener usuario actual (owner/admin)
    SELECT id, tenant_id, role INTO v_current_user_id, v_target_user.tenant_id, v_target_user.role
    FROM users WHERE auth_uid = auth.uid() AND is_active;

    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario actual no encontrado o inactivo';
    END IF;

    -- Verificar que es owner/admin
    IF v_target_user.role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Solo owner/admin pueden gestionar usuarios';
    END IF;

    -- Obtener usuario objetivo
    SELECT * INTO v_target_user FROM users WHERE id = p_user_id;

    IF v_target_user IS NULL THEN
        RAISE EXCEPTION 'Usuario objetivo no encontrado: %', p_user_id;
    END IF;

    -- Verificar mismo tenant
    IF v_target_user.tenant_id != (SELECT tenant_id FROM users WHERE id = v_current_user_id) THEN
        RAISE EXCEPTION 'Usuario objetivo no pertenece al mismo tenant';
    END IF;

    -- No permitir cambiar owner a otro rol si es el único
    IF v_target_user.role = 'owner' AND p_role IS NOT NULL AND p_role != 'owner' THEN
        IF (SELECT count(*) FROM users WHERE tenant_id = v_target_user.tenant_id AND role = 'owner' AND is_active) = 1 THEN
            RAISE EXCEPTION 'No se puede cambiar el rol del único owner';
        END IF;
    END IF;

    -- Actualizar campos permitidos
    UPDATE users SET
        name = COALESCE(p_name, name),
        phone = COALESCE(p_phone, phone),
        role = COALESCE(p_role, role),
        is_active = COALESCE(p_is_active, is_active),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        updated_at = now()
    WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true, 'user_id', p_user_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en admin_update_user: %', SQLERRM;
END $$;

-- ============================================
-- Función RPC para que usuario actualice SU perfil (campos permitidos)
-- ============================================
CREATE OR REPLACE FUNCTION update_own_profile(
    p_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE auth_uid = auth.uid() AND is_active;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Perfil no encontrado para usuario autenticado';
    END IF;

    UPDATE users SET
        name = COALESCE(p_name, name),
        phone = COALESCE(p_phone, phone),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        updated_at = now()
    WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error en update_own_profile: %', SQLERRM;
END $$;

-- ============================================
-- RLS para permitir RPC (ejecutan como SECURITY DEFINER, bypassean RLS)
-- No se necesitan políticas adicionales para las funciones RPC
-- ============================================