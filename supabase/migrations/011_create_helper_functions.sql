-- 011_create_helper_functions.sql
-- Funciones auxiliares para validaciones y lookups

-- Obtener base_unit de una entidad (ingrediente o producto)
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
    ) t;
$$;

-- Obtener current_stock de una entidad
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
    ) t;
$$;

-- Validar que entidad pertenece al tenant
CREATE OR REPLACE FUNCTION validate_entity_tenant(p_tenant_id UUID, p_entity_type TEXT, p_entity_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM ingredients WHERE id = p_entity_id AND tenant_id = p_tenant_id AND p_entity_type = 'ingredient'
        UNION ALL
        SELECT 1 FROM products WHERE id = p_entity_id AND tenant_id = p_tenant_id AND p_entity_type = 'product'
    );
$$;

-- Obtener tenant_id del usuario autenticado actual
CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT tenant_id FROM users WHERE auth_uid = auth.uid() AND is_active;
$$;