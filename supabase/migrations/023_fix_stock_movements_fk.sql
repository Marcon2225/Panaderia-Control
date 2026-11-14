-- 023_fix_stock_movements_fk.sql
-- Corrección de relaciones y FKs en stock_movements
-- Problemas corregidos:
-- 1. FK tenant_id en stock_movements no tiene ON DELETE CASCADE (ya existe pero sin cascade explícito en 010)
-- 2. entity_id es polimórfico (ingredient O product) sin FK real → validado solo en trigger/RLS
-- 3. No permitir ON DELETE CASCADE en tenant_id que borre historial de movimientos (trazabilidad)
-- 4. Añadir validación estricta a nivel DB para entity_id

-- ============================================
-- ANÁLISIS: El FK tenant_id en 010 YA tiene ON DELETE CASCADE
-- "tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE"
-- PERO: Esto borraría TODO el historial de movimientos al borrar tenant
-- REQUISITO: "No borrar automáticamente el historial de movimientos mediante ON DELETE CASCADE sin justificarlo. Preferir restricciones que preserven la trazabilidad."
-- SOLUCIÓN: Cambiar a ON DELETE RESTRICT para preservar historial
-- ============================================

-- 1. Cambiar FK tenant_id a RESTRICT (preservar trazabilidad)
ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS stock_movements_tenant_id_fkey,
    ADD CONSTRAINT stock_movements_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

-- 2. Añadir FK compuesta para ingredient_id (validación a nivel DB)
-- Nota: entity_id es polimórfico, no se puede hacer FK directo único
-- Opción: Usar trigger para validar existencia (ya existe en trg_update_stock_atomic)
-- Opción B: Añadir columnas separadas ingredient_id, product_id con FKs reales
-- Para MVP: Mantenemos entity_id polimórfico + validación en trigger + RLS
-- Añadimos constraint CHECK para documentar la intención

ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS chk_entity_type_valid,
    ADD CONSTRAINT chk_entity_type_valid CHECK (entity_type IN ('ingredient', 'product'));

-- 3. Mejorar validate_entity_tenant para ser usada en constraint si se desea
-- (PostgreSQL no permite funciones STABLE en CHECK constraints)
-- Mantenemos validación en trigger BEFORE INSERT (trg_update_stock_atomic)

-- 4. Asegurar que user_id FK tenga ON DELETE RESTRICT (ya existe en 010)
-- "user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT" ✓

-- 5. Añadir índice para validación rápida de entity_id en trigger
CREATE INDEX IF NOT EXISTS idx_stock_movements_entity_lookup
    ON stock_movements(tenant_id, entity_type, entity_id);

-- 6. Documentar: Para borrar tenant, primero hay que manejar stock_movements
-- Opción A: Anonimizar (tenant_id = NULL) - requiere quitar NOT NULL
-- Opción B: Archivar en tabla separada
-- Opción C: No permitir borrar tenants con movimientos (actual: RESTRICT)
-- RECOMENDACIÓN MVP: Opción C (RESTRICT) - forzar decisión explícita