-- 007_create_ingredients.sql
-- Tabla de materias primas (ingredientes)
-- Stock SIEMPRE en base_unit

CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    code TEXT,                                    -- SKU interno
    name TEXT NOT NULL,
    description TEXT,
    base_unit unit_type NOT NULL,                 -- unidad base de almacenaje (ej: 'g', 'ml')
    current_stock NUMERIC(14,4) NOT NULL DEFAULT 0, -- SIEMPRE en base_unit
    min_stock NUMERIC(14,4) NOT NULL DEFAULT 0,   -- en base_unit
    max_stock NUMERIC(14,4),                      -- en base_unit
    cost_per_base_unit NUMERIC(14,6) NOT NULL DEFAULT 0, -- coste por unidad base
    cost_method TEXT DEFAULT 'average',           -- 'fifo' | 'lifo' | 'average' (futuro)
    lot_tracking BOOLEAN DEFAULT false,
    expiry_tracking BOOLEAN DEFAULT false,
    allergen_info TEXT[],
    storage_location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, code)
);

-- Índices
CREATE INDEX idx_ingredients_tenant ON ingredients(tenant_id);
CREATE INDEX idx_ingredients_category ON ingredients(category_id);
CREATE INDEX idx_ingredients_supplier ON ingredients(supplier_id);
CREATE INDEX idx_ingredients_tenant_active ON ingredients(tenant_id, is_active) WHERE is_active;
-- Índice crítico para alertas de stock bajo
CREATE INDEX idx_ingredients_low_stock ON ingredients(tenant_id, current_stock)
    WHERE current_stock <= min_stock AND is_active;