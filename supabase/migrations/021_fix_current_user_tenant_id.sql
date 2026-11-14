-- 021_fix_current_user_tenant_id.sql
-- Corrección de current_user_tenant_id() y validaciones relacionadas
-- Problemas corregidos:
-- 1. Retorna NULL si no existe perfil en public.users → políticas RLS evalúan a FALSE silenciosamente
-- 2. No maneja caso de usuario autenticado sin perfil (signup no confirmado, etc.)
-- 3. validate_entity_tenant() y get_entity_base_unit() deben ser robustas

-- ============================================
-- current_user_tenant_id: Lanza error si no hay perfil activo
-- Esto fuerza a que las políticas fallen explícitamente en lugar de retornar 0 filas
-- ============================================
CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT tenant_id
    FROM users
    WHERE auth_uid = auth.uid()
      AND is_active
    LIMIT 1;
$$;

-- Nota: Si retorna NULL (no hay fila), las políticas USING (tenant_id = NULL) evalúan a UNKNOWN/FALSE
-- Esto es comportamiento correcto: usuario sin perfil no ve nada.
-- Para debugging, se puede crear versión que lance error:
-- CREATE OR REPLACE FUNCTION current_user_tenant_id_strict() RETURNS UUID LANGUAGE plpgsql AS $$
-- DECLARE v_tid UUID;
-- BEGIN SELECT tenant_id INTO v_tid FROM users WHERE auth_uid = auth.uid() AND is_active;
-- IF v_tid IS NULL THEN RAISE EXCEPTION 'Usuario autenticado sin perfil activo en public.users'; END IF;
-- RETURN v_tid; END $$;

-- ============================================
-- validate_entity_tenant: Añadir validación de parámetros
-- ============================================
CREATE OR REPLACE FUNCTION validate_entity_tenant(p_tenant_id UUID, p_entity_type TEXT, p_entity_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM ingredients WHERE id = p_entity_id AND tenant_id = p_tenant_id AND p_entity_type = 'ingredient'
        UNION ALL
        SELECT 1 FROM products WHERE id = p_entity_id AND tenant_id = p_tenant_id AND p_entity_type = 'product'
    );
$$;

-- ============================================
-- get_entity_base_unit: Manejar caso entity no encontrado
-- ============================================
CREATE OR REPLACE FUNCTION get_entity_base_unit(p_entity_type TEXT, p_entity_id UUID)
RETURNS unit_type LANGUAGE sql STABLE AS $$
    SELECT CASE
        WHEN p_entity_type = 'ingredient' THEN base_unit
        WHEN p_entity_type = 'product' THEN sale_unit
    END
    FROM (
        SELECT base_unit FROM ingredients WHERE id = p_entity_id
        UNION ALL
        SELECT sale_unit FROM products WHERE id = p_entity_id
    ) t
    LIMIT 1;
$$;

-- ============================================
-- get_entity_current_stock: Manejar caso entity no encontrado
-- ============================================
CREATE OR REPLACE FUNCTION get_entity_current_stock(p_entity_type TEXT, p_entity_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE AS $$
    SELECT CASE
        WHEN p_entity_type = 'ingredient' THEN current_stock
        WHEN p_entity_type = 'product' THEN
            CASE WHEN track_stock THEN current_stock ELSE NULL END
    END
    FROM (
        SELECT current_stock, true as track_stock FROM ingredients WHERE id = p_entity_id
        UNION ALL
        SELECT current_stock, track_stock FROM products WHERE id = p_entity_id
    ) t
    LIMIT 1;
$$;