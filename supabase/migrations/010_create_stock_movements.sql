-- 010_create_stock_movements.sql
-- Tabla de movimientos de stock (historial inmutable)
-- Incluye CHECK constraints para validar signo de quantity_base

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('ingredient', 'product')),
    entity_id UUID NOT NULL,                      -- ingredient.id O product.id
    movement_type movement_type NOT NULL,
    quantity_base NUMERIC(14,6) NOT NULL,         -- SIEMPRE en base_unit del entity, firmado (+ entrada, - salida)
    unit_cost NUMERIC(14,6),                      -- coste unitario en base_unit al momento
    total_cost NUMERIC(14,2) GENERATED ALWAYS AS (quantity_base * COALESCE(unit_cost, 0)) STORED,
    reason TEXT NOT NULL,
    reference_type reference_type,
    reference_id UUID,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    batch_number TEXT,
    expiry_date DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Sin updated_at: inmutable
    CONSTRAINT chk_quantity_sign CHECK (
        (movement_type IN ('entrada', 'ajuste_positivo', 'devolucion', 'produccion_salida') AND quantity_base > 0) OR
        (movement_type IN ('salida', 'ajuste_negativo', 'merma', 'produccion_entrada', 'venta') AND quantity_base < 0)
    )
);

-- Índices críticos
CREATE INDEX idx_stock_movements_tenant_entity ON stock_movements(tenant_id, entity_type, entity_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(tenant_id, created_at DESC);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(tenant_id, movement_type);