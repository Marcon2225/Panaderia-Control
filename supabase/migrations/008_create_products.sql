-- 008_create_products.sql
-- Tabla de productos terminados

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,  -- precio de venta
    cost NUMERIC(12,4) NOT NULL DEFAULT 0,        -- coste calculado (BOM)
    sale_unit unit_type NOT NULL DEFAULT 'unidad', -- unidad de venta
    weight_per_unit NUMERIC(10,4),                -- peso en gramos por unidad (para conversión)
    current_stock NUMERIC(14,4) NOT NULL DEFAULT 0, -- SOLO si track_stock = true
    min_stock NUMERIC(14,4) DEFAULT 0,
    track_stock BOOLEAN DEFAULT false,            -- si false, current_stock ignorado
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_sellable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, code)
);

-- Índices
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_tenant_active ON products(tenant_id, is_active) WHERE is_active;
-- Índice crítico para alertas de stock bajo (solo productos con track_stock)
CREATE INDEX idx_products_low_stock ON products(tenant_id, current_stock)
    WHERE track_stock AND current_stock <= min_stock AND is_active;