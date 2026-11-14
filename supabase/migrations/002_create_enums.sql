-- 002_create_enums.sql
-- Enums ordenados por dependencia

CREATE TYPE user_role AS ENUM (
    'owner', 'admin', 'gerente', 'panadero', 'vendedor', 'repartidor'
);

CREATE TYPE category_type AS ENUM ('ingredient', 'product');

CREATE TYPE unit_type AS ENUM ('kg', 'g', 'l', 'ml', 'unidad');

CREATE TYPE movement_type AS ENUM (
    'entrada',            -- compra proveedor
    'salida',             -- consumo genérico
    'ajuste_positivo',    -- inventario físico > sistema
    'ajuste_negativo',    -- inventario físico < sistema
    'merma',              -- pérdida/desperdicio
    'produccion_entrada', -- ingrediente consumido (salida real, pero concepto producción)
    'produccion_salida',  -- producto terminado generado
    'venta',              -- venta POS
    'devolucion'          -- devolución cliente
);

CREATE TYPE reference_type AS ENUM (
    'purchase_order',
    'production_order',
    'sale',
    'adjustment',
    'waste_report'
);