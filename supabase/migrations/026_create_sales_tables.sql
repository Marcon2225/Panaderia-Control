-- 026_create_sales_tables.sql
-- Tablas para módulo de Ventas (POS, tickets, cierres de caja)
-- Dependencias: 003_tenants, 004_users, 008_products

-- ============================================
-- VENTAS (cabecera de ticket)
-- ============================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    ticket_number INT NOT NULL,                    -- secuencial por tenant/día
    ticket_prefix TEXT DEFAULT 'TCK',              -- configurable en tenant
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method payment_method NOT NULL DEFAULT 'efectivo',
    status sale_status NOT NULL DEFAULT 'abierta',
    cashier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, ticket_number)  -- único por tenant
);

-- Índices
CREATE INDEX idx_sales_tenant_date ON sales(tenant_id, opened_at DESC);
CREATE INDEX idx_sales_tenant_status ON sales(tenant_id, status);
CREATE INDEX idx_sales_cashier ON sales(cashier_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_ticket_number ON sales(tenant_id, ticket_number);

-- ============================================
-- LÍNEAS DE VENTA (detalle de ticket)
-- ============================================
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL,      -- precio al momento de la venta
    unit_cost NUMERIC(12,4) NOT NULL DEFAULT 0,  -- coste al momento (para margen)
    discount_pct NUMERIC(5,2) DEFAULT 0,    -- % descuento línea
    discount_amount NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price * discount_pct / 100) STORED,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0, -- % IVA al momento
    tax_amount NUMERIC(12,2) GENERATED ALWAYS AS ((quantity * unit_price - quantity * unit_price * discount_pct / 100) * tax_rate / 100) STORED,
    total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price - quantity * unit_price * discount_pct / 100 + (quantity * unit_price - quantity * unit_price * discount_pct / 100) * tax_rate / 100) STORED,
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- ============================================
-- PAGOS DE VENTA (soporte multi-pago: efectivo + tarjeta, etc.)
-- ============================================
CREATE TABLE sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method payment_method NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    reference TEXT,                          -- nro. transacción, último 4 tarjeta, etc.
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sale_payments_sale ON sale_payments(sale_id);

-- ============================================
-- CIERRES DE CAJA (cash closing / arqueo)
-- ============================================
CREATE TABLE cash_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- quien cierra
    date DATE NOT NULL,                    -- día del cierre
    shift TEXT,                            -- 'mañana', 'tarde', 'noche', 'único'
    -- Sistema (calculado)
    expected_cash NUMERIC(12,2) NOT NULL DEFAULT 0,    -- ventas efectivo + inicio - salidas
    expected_card NUMERIC(12,2) NOT NULL DEFAULT 0,    -- ventas tarjeta
    expected_other NUMERIC(12,2) NOT NULL DEFAULT 0,   -- otros métodos
    expected_total NUMERIC(12,2) NOT NULL DEFAULT 0,   -- total sistema
    -- Real (contado por usuario)
    counted_cash NUMERIC(12,2),
    counted_card NUMERIC(12,2),
    counted_other NUMERIC(12,2),
    counted_total NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(counted_cash, 0) + COALESCE(counted_card, 0) + COALESCE(counted_other, 0)) STORED,
    -- Diferencias
    diff_cash NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(counted_cash, 0) - expected_cash) STORED,
    diff_card NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(counted_card, 0) - expected_card) STORED,
    diff_other NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(counted_other, 0) - expected_other) STORED,
    diff_total NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(counted_total, 0) - expected_total) STORED,
    -- Estado
    status closing_status NOT NULL DEFAULT 'pendiente',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, date, shift, user_id)
);

-- Enum para estado de cierre
CREATE TYPE closing_status AS ENUM ('pendiente', 'en_proceso', 'completado', 'con_diferencias', 'aprobado');

-- Índices
CREATE INDEX idx_cash_closings_tenant_date ON cash_closings(tenant_id, date DESC);
CREATE INDEX idx_cash_closings_user ON cash_closings(user_id);
CREATE INDEX idx_cash_closings_status ON cash_closings(tenant_id, status);

-- ============================================
-- MOVIMIENTOS DE CAJA (entradas/salidas de efectivo no venta)
-- ============================================
CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    cash_closing_id UUID REFERENCES cash_closings(id) ON DELETE SET NULL,
    type cash_movement_type NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    reason TEXT NOT NULL,
    reference_type reference_type,
    reference_id UUID,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE cash_movement_type AS ENUM (
    'apertura',           -- fondo de caja inicial
    'entrada',            -- entrada efectivo (ej. pago proveedor en efectivo)
    'salida',             -- salida efectivo (ej. compra urgente, cambio)
    'retiro',             -- retiro a caja fuerte/banco
    'deposito'            -- depósito desde caja fuerte
);

CREATE INDEX idx_cash_movements_tenant_date ON cash_movements(tenant_id, created_at DESC);
CREATE INDEX idx_cash_movements_closing ON cash_movements(cash_closing_id);

-- ============================================
-- ENUMS ESPECÍFICOS VENTAS
-- ============================================
CREATE TYPE payment_method AS ENUM (
    'efectivo',
    'tarjeta',
    'transferencia',
    'mixto',
    'ticket_restaurant',
    'otro'
);

CREATE TYPE sale_status AS ENUM (
    'abierta',      -- en proceso (carrito)
    'pagada',       -- completada
    'cancelada',    -- anulada
    'pendiente',    -- apartado/reserva
    'devolucion'    -- devolución (ticket negativo)
);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

-- Políticas usando current_user_tenant_id()
CREATE POLICY "sales_select" ON sales
    FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "sales_insert" ON sales
    FOR INSERT WITH CHECK (tenant_id = current_user_tenant_id() AND cashier_id = (SELECT id FROM users WHERE auth_uid = auth.uid()));
CREATE POLICY "sales_update" ON sales
    FOR UPDATE USING (tenant_id = current_user_tenant_id() AND cashier_id = (SELECT id FROM users WHERE auth_uid = auth.uid()))
    WITH CHECK (tenant_id = current_user_tenant_id());

CREATE POLICY "sale_items_select" ON sale_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM sales WHERE id = sale_items.sale_id AND tenant_id = current_user_tenant_id()));
CREATE POLICY "sale_items_write" ON sale_items
    FOR INSERT, UPDATE, DELETE USING (EXISTS (SELECT 1 FROM sales WHERE id = sale_items.sale_id AND tenant_id = current_user_tenant_id()))
    WITH CHECK (EXISTS (SELECT 1 FROM sales WHERE id = sale_items.sale_id AND tenant_id = current_user_tenant_id()));

CREATE POLICY "sale_payments_select" ON sale_payments
    FOR SELECT USING (EXISTS (SELECT 1 FROM sales WHERE id = sale_payments.sale_id AND tenant_id = current_user_tenant_id()));
CREATE POLICY "sale_payments_write" ON sale_payments
    FOR INSERT, UPDATE, DELETE USING (EXISTS (SELECT 1 FROM sales WHERE id = sale_payments.sale_id AND tenant_id = current_user_tenant_id()))
    WITH CHECK (EXISTS (SELECT 1 FROM sales WHERE id = sale_payments.sale_id AND tenant_id = current_user_tenant_id()));

CREATE POLICY "cash_closings_select" ON cash_closings
    FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "cash_closings_write" ON cash_closings
    FOR INSERT, UPDATE, DELETE USING (tenant_id = current_user_tenant_id() AND user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()))
    WITH CHECK (tenant_id = current_user_tenant_id() AND user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()));

CREATE POLICY "cash_movements_select" ON cash_movements
    FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "cash_movements_write" ON cash_movements
    FOR INSERT, UPDATE, DELETE USING (tenant_id = current_user_tenant_id() AND user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()))
    WITH CHECK (tenant_id = current_user_tenant_id() AND user_id = (SELECT id FROM users WHERE auth_uid = auth.uid()));

-- ============================================
-- TRIGGER PARA NÚMERO DE TICKET SECUENCIAL
-- ============================================
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_max_ticket INT;
BEGIN
    -- Solo generar si es INSERT y no se proporcionó ticket_number
    IF TG_OP = 'INSERT' AND NEW.ticket_number IS NULL THEN
        -- Buscar el último ticket del tenant para hoy
        SELECT COALESCE(MAX(ticket_number), 0) INTO v_max_ticket
        FROM sales
        WHERE tenant_id = NEW.tenant_id
          AND opened_at >= CURRENT_DATE
          AND opened_at < CURRENT_DATE + INTERVAL '1 day';

        NEW.ticket_number := v_max_ticket + 1;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sales_ticket_number ON sales;
CREATE TRIGGER trg_sales_ticket_number
    BEFORE INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- ============================================
-- TRIGGER PARA ACTUALIZAR TOTALES DE VENTA
-- ============================================
CREATE OR REPLACE FUNCTION update_sale_totals()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    -- Se ejecuta tras cambios en sale_items
    IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
        UPDATE sales s
        SET
            subtotal = COALESCE((
                SELECT SUM(quantity * unit_price * (1 - discount_pct / 100))
                FROM sale_items WHERE sale_id = s.id
            ), 0),
            tax_amount = COALESCE((
                SELECT SUM(tax_amount)
                FROM sale_items WHERE sale_id = s.id
            ), 0),
            total = COALESCE((
                SELECT SUM(total)
                FROM sale_items WHERE sale_id = s.id
            ), 0),
            updated_at = now()
        WHERE s.id = COALESCE(NEW.sale_id, OLD.sale_id);
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sale_items_totals ON sale_items;
CREATE TRIGGER trg_sale_items_totals
    AFTER INSERT OR UPDATE OR DELETE ON sale_items
    FOR EACH ROW EXECUTE FUNCTION update_sale_totals();

-- ============================================
-- TRIGGER PARA VALIDAR PAGOS = TOTAL
-- ============================================
CREATE OR REPLACE FUNCTION validate_sale_payments()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_total NUMERIC;
    v_paid NUMERIC;
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') ON sale_payments THEN
        SELECT total INTO v_total FROM sales WHERE id = NEW.sale_id;
        SELECT COALESCE(SUM(amount), 0) INTO v_paid FROM sale_payments WHERE sale_id = NEW.sale_id;

        IF v_paid > v_total THEN
            RAISE EXCEPTION 'El total pagado (%) supera el total de la venta (%)', v_paid, v_total;
        END IF;

        -- Si pagado = total y venta estaba 'abierta', marcar como 'pagada'
        IF v_paid >= v_total THEN
            UPDATE sales SET status = 'pagada', closed_at = now(), updated_at = now()
            WHERE id = NEW.sale_id AND status = 'abierta';
        END IF;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sale_payments_validate ON sale_payments;
CREATE TRIGGER trg_sale_payments_validate
    AFTER INSERT OR UPDATE ON sale_payments
    FOR EACH ROW EXECUTE FUNCTION validate_sale_payments();

-- ============================================
-- FUNCIÓN RPC: CALCULAR ESPERADO PARA CIERRE DE CAJA
-- ============================================
CREATE OR REPLACE FUNCTION calculate_expected_closing(p_date DATE, p_shift TEXT DEFAULT NULL, p_user_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_tenant_id UUID;
    v_cash NUMERIC := 0;
    v_card NUMERIC := 0;
    v_other NUMERIC := 0;
    v_movements_cash NUMERIC := 0;
    v_opening_cash NUMERIC := 0;
BEGIN
    v_tenant_id := current_user_tenant_id();

    -- 1. Ventas del día/turno por método de pago
    SELECT
        COALESCE(SUM(CASE WHEN payment_method = 'efectivo' THEN total ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'tarjeta' THEN total ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method NOT IN ('efectivo', 'tarjeta') THEN total ELSE 0 END), 0)
    INTO v_cash, v_card, v_other
    FROM sales
    WHERE tenant_id = v_tenant_id
      AND opened_at::date = p_date
      AND status = 'pagada'
      AND (p_shift IS NULL OR shift = p_shift)  -- requiere columna shift en sales si se usa
      AND (p_user_id IS NULL OR cashier_id = p_user_id);

    -- 2. Movimientos de caja (entradas/salidas/retiros)
    SELECT COALESCE(SUM(CASE WHEN type IN ('apertura', 'entrada', 'deposito') THEN amount ELSE 0 END)
                    - SUM(CASE WHEN type IN ('salida', 'retiro') THEN amount ELSE 0 END), 0)
    INTO v_movements_cash
    FROM cash_movements
    WHERE tenant_id = v_tenant_id
      AND created_at::date = p_date
      AND (p_shift IS NULL OR cash_closing_id IN (SELECT id FROM cash_closings WHERE shift = p_shift))
      AND (p_user_id IS NULL OR user_id = p_user_id);

    -- 3. Fondo de caja inicial (tipo 'apertura')
    SELECT COALESCE(SUM(amount), 0) INTO v_opening_cash
    FROM cash_movements
    WHERE tenant_id = v_tenant_id
      AND type = 'apertura'
      AND created_at::date = p_date
      AND (p_user_id IS NULL OR user_id = p_user_id);

    RETURN jsonb_build_object(
        'expected_cash', v_cash + v_movements_cash + v_opening_cash,
        'expected_card', v_card,
        'expected_other', v_other,
        'expected_total', v_cash + v_card + v_other + v_movements_cash + v_opening_cash,
        'breakdown', jsonb_build_object(
            'sales_cash', v_cash,
            'sales_card', v_card,
            'sales_other', v_other,
            'cash_movements', v_movements_cash,
            'opening_cash', v_opening_cash
        )
    );
END $$;

-- ============================================
-- FUNCIÓN RPC: CREAR CIERRE DE CAJA
-- ============================================
CREATE OR REPLACE FUNCTION create_cash_closing(p_date DATE, p_shift TEXT DEFAULT 'único', p_counted_cash NUMERIC, p_counted_card NUMERIC, p_counted_other NUMERIC DEFAULT 0, p_notes TEXT DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
    v_closing_id UUID;
    v_expected JSONB;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE auth_uid = auth.uid() AND is_active;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no encontrado en tenant';
    END IF;

    -- Calcular esperados
    v_expected := calculate_expected_closing(p_date, p_shift, v_user_id);

    -- Crear o actualizar cierre
    INSERT INTO cash_closings (tenant_id, user_id, date, shift, expected_cash, expected_card, expected_other, expected_total, counted_cash, counted_card, counted_other, status, notes)
    VALUES (
        current_user_tenant_id(), v_user_id, p_date, p_shift,
        (v_expected->>'expected_cash')::NUMERIC,
        (v_expected->>'expected_card')::NUMERIC,
        (v_expected->>'expected_other')::NUMERIC,
        (v_expected->>'expected_total')::NUMERIC,
        p_counted_cash, p_counted_card, p_counted_other,
        CASE
            WHEN p_counted_cash = (v_expected->>'expected_cash')::NUMERIC
              AND p_counted_card = (v_expected->>'expected_card')::NUMERIC
              AND p_counted_other = (v_expected->>'expected_other')::NUMERIC
            THEN 'completado' ELSE 'con_diferencias' END,
        p_notes
    )
    ON CONFLICT (tenant_id, date, shift, user_id) DO UPDATE SET
        expected_cash = EXCLUDED.expected_cash,
        expected_card = EXCLUDED.expected_card,
        expected_other = EXCLUDED.expected_other,
        expected_total = EXCLUDED.expected_total,
        counted_cash = EXCLUDED.counted_cash,
        counted_card = EXCLUDED.counted_card,
        counted_other = EXCLUDED.counted_other,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        closed_at = now(),
        updated_at = now()
    RETURNING id INTO v_closing_id;

    RETURN v_closing_id;
END $$;