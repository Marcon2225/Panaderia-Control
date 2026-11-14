-- 009_create_product_ingredients.sql
-- Tabla BOM (Bill of Materials): ingredientes por producto

CREATE TABLE product_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC(14,6) NOT NULL,              -- cantidad por unidad de producto
    unit unit_type NOT NULL,                      -- unidad en la receta (ej: 'g')
    waste_factor NUMERIC(5,4) DEFAULT 0,          -- 0.05 = 5% merma
    notes TEXT,
    sort_order INT DEFAULT 0,
    UNIQUE(product_id, ingredient_id)
);

-- Índices
CREATE INDEX idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_ingredient ON product_ingredients(ingredient_id);