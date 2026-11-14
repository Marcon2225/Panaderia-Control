-- 012_create_stock_trigger.sql
-- Trigger atómico para actualizar stock (PREVENCIÓN RACE CONDITION)
-- Usa SELECT FOR UPDATE para bloquear la fila de la entidad

CREATE OR REPLACE FUNCTION trg_update_stock_atomic()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_current_stock NUMERIC;
    v_track_stock BOOLEAN;
    v_base_unit unit_type;
BEGIN
    -- 1. Bloquear fila de la entidad (SELECT FOR UPDATE) para prevenir race conditions
    IF NEW.entity_type = 'ingredient' THEN
        SELECT current_stock, true, base_unit
        INTO v_current_stock, v_track_stock, v_base_unit
        FROM ingredients
        WHERE id = NEW.entity_id AND tenant_id = NEW.tenant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ingrediente no encontrado o no pertenece al tenant';
        END IF;

        -- 2. Validar stock no negativo
        IF v_current_stock + NEW.quantity_base < 0 THEN
            RAISE EXCEPTION 'Stock insuficiente. Actual: %, Movimiento: %', v_current_stock, NEW.quantity_base;
        END IF;

        -- 3. Actualizar stock
        UPDATE ingredients
        SET current_stock = current_stock + NEW.quantity_base,
            updated_at = now()
        WHERE id = NEW.entity_id;

    ELSIF NEW.entity_type = 'product' THEN
        SELECT current_stock, track_stock, sale_unit
        INTO v_current_stock, v_track_stock, v_base_unit
        FROM products
        WHERE id = NEW.entity_id AND tenant_id = NEW.tenant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto no encontrado o no pertenece al tenant';
        END IF;

        IF NOT v_track_stock THEN
            RAISE EXCEPTION 'Producto no tiene tracking de stock habilitado';
        END IF;

        IF v_current_stock + NEW.quantity_base < 0 THEN
            RAISE EXCEPTION 'Stock insuficiente. Actual: %, Movimiento: %', v_current_stock, NEW.quantity_base;
        END IF;

        UPDATE products
        SET current_stock = current_stock + NEW.quantity_base,
            updated_at = now()
        WHERE id = NEW.entity_id;

    ELSE
        RAISE EXCEPTION 'Tipo de entidad inválido: %', NEW.entity_type;
    END IF;

    RETURN NEW;
END $$;

CREATE TRIGGER trg_stock_movements_atomic
    BEFORE INSERT ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION trg_update_stock_atomic();