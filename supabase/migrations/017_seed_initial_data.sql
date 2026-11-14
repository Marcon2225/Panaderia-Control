-- 017_seed_initial_data.sql
-- Datos iniciales opcionales (categorías base, etc.)
-- Nota: Requiere un tenant y usuario existente para insertar datos

-- Categorías base para ingredientes
-- INSERT INTO categories (tenant_id, name, slug, type, sort_order, color) VALUES
--   (<tenant_id>, 'Harinas', 'harinas', 'ingredient', 1, '#f5e6cc'),
--   (<tenant_id>, 'Azúcares', 'azucares', 'ingredient', 2, '#fef3c7'),
--   (<tenant_id>, 'Grasas', 'grasas', 'ingredient', 3, '#fef9c3'),
--   (<tenant_id>, 'Lácteos', 'lacteos', 'ingredient', 4, '#f0fdf4'),
--   (<tenant_id>, 'Levaduras', 'levaduras', 'ingredient', 5, '#fdf4ff'),
--   (<tenant_id>, 'Sales', 'sales', 'ingredient', 6, '#f8fafc'),
--   (<tenant_id>, 'Frutos secos', 'frutos-secos', 'ingredient', 7, '#fef3e2'),
--   (<tenant_id>, 'Chocolates', 'chocolates', 'ingredient', 8, '#7c2d12');

-- Categorías base para productos
-- INSERT INTO categories (tenant_id, name, slug, type, sort_order, color) VALUES
--   (<tenant_id>, 'Pan', 'pan', 'product', 1, '#c87d4a'),
--   (<tenant_id>, 'Bollería', 'bolleria', 'product', 2, '#d97706'),
--   (<tenant_id>, 'Pastelería', 'pasteleria', 'product', 3, '#b45309'),
--   (<tenant_id>, 'Galletas', 'galletas', 'product', 4, '#92400e'),
--   (<tenant_id>, 'Especiales', 'especiales', 'product', 5, '#78350f');

-- Nota: Ejecutar manualmente después de crear tenant y usuario via dashboard Supabase
-- o via script de setup inicial.