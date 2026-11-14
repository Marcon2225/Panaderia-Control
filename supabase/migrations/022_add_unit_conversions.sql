-- 022_add_unit_conversions.sql
-- Tabla de conversiones de unidades y corrección del trigger BOM
-- Problemas corregidos:
-- 1. No hay tabla de conversiones: BOM usa unit distinta de base_unit sin factor
-- 2. Trigger trg_recalculate_product_cost multiplica quantity * cost_per_base_unit SIN convertir
-- 3. Para MVP: conversiones controladas g/kg y ml/l (factores 1000)

-- ============================================
-- Tabla de conversiones de unidades (por tenant para flexibilidad futura)
-- ============================================
CREATE TABLE unit_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_unit unit_type NOT NULL,      -- unidad origen (ej: 'kg')
    to_unit unit_type NOT NULL,        -- unidad destino (ej: 'g')
    factor NUMERIC(14,6) NOT NULL,     -- factor: 1 from_unit = factor to_unit (ej: 1 kg = 1000 g)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, from_unit, to_unit),
    CHECK (factor > 0)
);

-- Índices
CREATE INDEX idx_unit_conversions_tenant ON unit_conversions(tenant_id);
CREATE INDEX idx_unit_conversions_lookup ON unit_conversions(tenant_id, from_unit, to_unit) WHERE is_active;

-- ============================================
-- Poblar conversiones base para todos los tenants existentes
-- Se ejecuta al aplicar la migración
-- ============================================
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    FOR v_tenant_id IN SELECT id FROM tenants WHERE is_active LOOP
        -- Masa: kg <-> g (factor 1000)
        INSERT INTO unit_conversions (tenant_id, from_unit, to_unit, factor)
        VALUES (v_tenant_id, 'kg', 'g', 1000),
               (v_tenant_id, 'g', 'kg', 0.001)
        ON CONFLICT (tenant_id, from_unit, to_unit) DO UPDATE SET factor = EXCLUDED.factor;

        -- Volumen: l <-> ml (factor 1000)
        INSERT INTO unit_conversions (tenant_id, from_unit, to_unit, factor)
        VALUES (v_tenant_id, 'l', 'ml', 1000),
               (v_tenant_id, 'ml', 'l', 0.001)
        ON CONFLICT (tenant_id, from_unit, to_unit) DO UPDATE SET factor = EXCLUDED.factor;

        -- Unidad <-> unidad (factor 1, identidad)
        INSERT INTO unit_conversions (tenant_id, from_unit, to_unit, factor)
        VALUES (v_tenant_id, 'unidad', 'unidad', 1)
        ON CONFLICT (tenant_id, from_unit, to_unit) DO UPDATE SET factor = EXCLUDED.factor;

        -- Identidad para todas las unidades (factor 1 a sí misma)
        INSERT INTO unit_conversions (tenant_id, from_unit, to_unit, factor)
        SELECT v_tenant_id, u, u, 1
        FROM unnest(ARRAY['kg','g','l','ml','unidad']::unit_type[]) u
        ON CONFLICT (tenant_id, from_unit, to_unit) DO NOTHING;
    END LOOP;
END $$;

-- ============================================
-- Función para convertir cantidad entre unidades
-- ============================================
CREATE OR REPLACE FUNCTION convert_unit(
    p_tenant_id UUID,
    p_quantity NUMERIC,
    p_from_unit unit_type,
    p_to_unit unit_type
)
RETURNS NUMERIC LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
        p_quantity * factor,
        CASE WHEN p_from_unit = p_to_unit THEN p_quantity ELSE NULL END
    )
    FROM unit_conversions
    WHERE tenant_id = p_tenant_id
      AND from_unit = p_from_unit
      AND to_unit = p_to_unit
      AND is_active
    LIMIT 1;
$$;

-- ============================================
-- Función para obtener base_unit de ingrediente (para validación en trigger)
-- ============================================
CREATE OR REPLACE FUNCTION get_ingredient_base_unit(p_ingredient_id UUID)
RETURNS unit_type LANGUAGE sql STABLE AS $$
    SELECT base_unit FROM ingredients WHERE id = p_ingredient_id;
$$;

-- ============================================
-- CORRECCIÓN CRÍTICA: Trigger BOM con conversión de unidades
-- ============================================
DROP TRIGGER IF EXISTS trg_product_ingredients_cost ON product_ingredients;

CREATE OR REPLACE FUNCTION trg_recalculate_product_cost()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_product_id UUID;
    v_tenant_id UUID;
BEGIN
    -- Determinar product_id según operación
    v_product_id := COALESCE(NEW.product_id, OLD.product_id);

    -- Obtener tenant_id del producto para conversiones
    SELECT tenant_id INTO v_tenant_id FROM products WHERE id = v_product_id;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Producto no encontrado: %', v_product_id;
    END IF;

    -- Solo recalcular si cambió cantidad, ingrediente, unit, waste_factor
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' OR
       OLD.quantity IS DISTINCT FROM NEW.quantity OR
       OLD.ingredient_id IS DISTINCT FROM NEW.ingredient_id OR
       OLD.unit IS DISTINCT FROM NEW.unit OR
       OLD.waste_factor IS DISTINCT FROM NEW.waste_factor THEN

        UPDATE products p
        SET cost = COALESCE((
            SELECT SUM(
                -- Convertir quantity de pi.unit a i.base_unit
                convert_unit(v_tenant_id, pi.quantity, pi.unit, i.base_unit) *
                i.cost_per_base_unit *
                (1 + COALESCE(pi.waste_factor, 0))
            )
            FROM product_ingredients pi
            JOIN ingredients i ON i.id = pi.ingredient_id
            WHERE pi.product_id = p.id
              AND i.tenant_id = v_tenant_id  -- seguridad adicional
        ), 0),
            updated_at = now()
        WHERE p.id = v_product_id;
    END IF;

    RETURN NEW;
END $$;

CREATE TRIGGER trg_product_ingredients_cost
    AFTER INSERT OR UPDATE OR DELETE ON product_ingredients
    FOR EACH ROW EXECUTE FUNCTION trg_recalculate_product_cost();

-- ============================================
-- Trigger para poblar conversiones en nuevos tenants (via handle_new_user)
-- ============================================
CREATE OR REPLACE FUNCTION trg_seed_unit_conversions()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    -- Masa
    INSERT INTO unit_conversions (tenant_id, from_unit, to_unit, factor)
    VALUES (NEW.id, 'kg', 'g', 1000),
           (NEW.id, 'g', 'kg', 0.001)
    ON CONFLICT (tenant_id, from_unit, to_unit) DO NOTHING;

    -- Volumen
    INSERT INTO unit_conversions (tenant_id, from_unit, to_unit, factor)
    VALUES (NEW.id, 'l', 'ml', 1000),
           (NEW.id, 'ml', 'l', 0.001)
    ON CONFLICT (tenant_id, from_unit, to_unit) DO NOTHING;

    -- Identidad
    INSERT INTO unit_conversions (tenant_id, from_unit, to_unit, factor)
    SELECT NEW.id, u, u, 1
    FROM unnest(ARRAY['kg','g','l','ml','unidad']::unit_type[]) u
    ON CONFLICT (tenant_id, from_unit, to_unit) DO NOTHING;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_tenant_unit_conversions ON tenants;
CREATE TRIGGER trg_tenant_unit_conversions
    AFTER INSERT ON tenants
    FOR EACH ROW EXECUTE FUNCTION trg_seed_unit_conversions();

-- ============================================
-- RLS para unit_conversions
-- ============================================
ALTER TABLE unit_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_conversions_select" ON unit_conversions
    FOR SELECT USING (tenant_id = current_user_tenant_id());

CREATE POLICY "unit_conversions_write" ON unit_conversions
    FOR INSERT, UPDATE, DELETE USING (tenant_id = current_user_tenant_id())
    WITH CHECK (tenant_id = current_user_tenant_id());