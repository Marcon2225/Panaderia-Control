-- 013_create_bom_cost_trigger.sql
-- Trigger para recalcular coste de producto al cambiar BOM

CREATE OR REPLACE FUNCTION trg_recalculate_product_cost()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    -- Solo recalcular si cambió cantidad, ingrediente o unit_cost del ingrediente
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' OR
       OLD.quantity IS DISTINCT FROM NEW.quantity OR
       OLD.ingredient_id IS DISTINCT FROM NEW.ingredient_id THEN

        UPDATE products p
        SET cost = COALESCE((
            SELECT SUM(
                pi.quantity *
                i.cost_per_base_unit * (1 + COALESCE(pi.waste_factor, 0))
                -- Nota: conversión de unidades simplificada; en producción usar tabla de conversiones
            )
            FROM product_ingredients pi
            JOIN ingredients i ON i.id = pi.ingredient_id
            WHERE pi.product_id = p.id
        ), 0),
            updated_at = now()
        WHERE p.id = COALESCE(NEW.product_id, OLD.product_id);
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_product_ingredients_cost
    AFTER INSERT OR UPDATE OR DELETE ON product_ingredients
    FOR EACH ROW EXECUTE FUNCTION trg_recalculate_product_cost();