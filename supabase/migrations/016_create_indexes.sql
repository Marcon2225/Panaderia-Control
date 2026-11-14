-- 016_create_indexes.sql
-- Índices compuestos finales de performance

-- Índices compuestos para queries frecuentes
CREATE INDEX idx_ingredients_tenant_category_active ON ingredients(tenant_id, category_id, is_active);
CREATE INDEX idx_products_tenant_category_active ON products(tenant_id, category_id, is_active);
CREATE INDEX idx_stock_movements_tenant_type_date ON stock_movements(tenant_id, movement_type, created_at DESC);
CREATE INDEX idx_stock_movements_tenant_entity_date ON stock_movements(tenant_id, entity_type, entity_id, created_at DESC);

-- Índices para búsquedas de texto (requiere pg_trgm)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_ingredients_name_trgm ON ingredients USING gin (name gin_trgm_ops);
-- CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- Índice parcial para stock movements por reference
CREATE INDEX idx_stock_movements_tenant_ref ON stock_movements(tenant_id, reference_type, reference_id);