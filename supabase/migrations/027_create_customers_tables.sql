-- 027_create_customers_tables.sql
-- Tablas para Clientes y Pedidos (CRM básico + fidelización)
-- Dependencias: 003_tenants, 004_users

-- ============================================
-- CLIENTES
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    code TEXT,                                      -- código cliente interno
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_id TEXT,                                    -- CIF/NIF/DNI
    birthday DATE,
    loyalty_points INT DEFAULT 0,                   -- puntos acumulados
    total_spent NUMERIC(12,2) DEFAULT 0,            -- gasto total histórico
    orders_count INT DEFAULT 0,                     -- nº pedidos
    tags TEXT[] DEFAULT '{}',                       -- etiquetas: 'vip', 'empresa', 'tempranero', etc.
    preferred_products UUID[] DEFAULT '{}',         -- product_ids favoritos
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_tenant_active ON customers(tenant_id, is_active) WHERE is_active;
CREATE INDEX idx_customers_search ON customers USING gin (to_tsvector('spanish', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, '')));

-- ============================================
-- PEDIDOS DE CLIENTES (orders)
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    order_number INT NOT NULL,                      -- secuencial por tenant
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'pendiente',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method payment_method,
    payment_status payment_status DEFAULT 'pendiente',
    delivery_date TIMESTAMPTZ,
    delivery_address TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, order_number)
);

CREATE TYPE order_status AS ENUM (
    'pendiente',      -- recién creado
    'confirmado',     -- cliente confirmó
    'en_preparacion', -- en cocina
    'listo',          -- listo para entregar/recoger
    'entregado',      -- completado
    'cancelado'       -- anulado
);

CREATE TYPE payment_status AS ENUM (
    'pendiente',
    'parcial',
    'pagado',
    'reembolsado'
);

CREATE INDEX idx_orders_tenant_date ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_delivery ON orders(delivery_date) WHERE delivery_date IS NOT NULL;

-- ============================================
-- LÍNEAS DE PEDIDO
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL,
    unit_cost NUMERIC(12,4) NOT NULL DEFAULT 0,
    discount_pct NUMERIC(5,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================
-- TRIGGER NÚMERO DE PEDIDO SECUENCIAL
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_max_order INT;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.order_number IS NULL THEN
        SELECT COALESCE(MAX(order_number), 0) INTO v_max_order
        FROM orders WHERE tenant_id = NEW.tenant_id;
        NEW.order_number := v_max_order + 1;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_orders_number ON orders;
CREATE TRIGGER trg_orders_number
    BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================
-- TRIGGER ACTUALIZAR TOTALES PEDIDO
-- ============================================
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
        UPDATE orders o
        SET
            subtotal = COALESCE((SELECT SUM(quantity * unit_price * (1 - discount_pct / 100)) FROM order_items WHERE order_id = o.id), 0),
            tax_amount = COALESCE((SELECT SUM(quantity * unit_price * (1 - discount_pct / 100) * tax_rate / 100) FROM order_items WHERE order_id = o.id), 0),
            total = COALESCE((SELECT SUM(quantity * unit_price * (1 - discount_pct / 100) * (1 + tax_rate / 100)) FROM order_items WHERE order_id = o.id), 0),
            updated_at = now()
        WHERE o.id = COALESCE(NEW.order_id, OLD.order_id);
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_order_items_totals ON order_items;
CREATE TRIGGER trg_order_items_totals
    AFTER INSERT OR UPDATE OR DELETE ON order_items FOR EACH ROW EXECUTE FUNCTION update_order_totals();

-- ============================================
-- TRIGGER ACTUALIZAR ESTADÍSTICAS CLIENTE
-- ============================================
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.status = 'entregado' AND OLD.status IS DISTINCT FROM 'entregado' THEN
        -- Solo al marcar como entregado
        UPDATE customers c
        SET
            total_spent = c.total_spent + NEW.total,
            orders_count = c.orders_count + 1,
            loyalty_points = c.loyalty_points + FLOOR(NEW.total / 10), -- 1 punto por cada 10€
            updated_at = now()
        WHERE c.id = NEW.customer_id;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_orders_customer_stats ON orders;
CREATE TRIGGER trg_orders_customer_stats
    AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON customers FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "customers_write" ON customers FOR INSERT, UPDATE, DELETE USING (tenant_id = current_user_tenant_id()) WITH CHECK (tenant_id = current_user_tenant_id());

CREATE POLICY "orders_select" ON orders FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "orders_write" ON orders FOR INSERT, UPDATE, DELETE USING (tenant_id = current_user_tenant_id()) WITH CHECK (tenant_id = current_user_tenant_id());

CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND tenant_id = current_user_tenant_id()));
CREATE POLICY "order_items_write" ON order_items FOR INSERT, UPDATE, DELETE USING (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND tenant_id = current_user_tenant_id())) WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND tenant_id = current_user_tenant_id()));

-- ============================================
-- FUNCIÓN RPC: BUSCAR CLIENTES (para POS)
-- ============================================
CREATE OR REPLACE FUNCTION search_customers(p_query TEXT DEFAULT '', p_limit INT DEFAULT 10)
RETURNS SETOF customers LANGUAGE sql STABLE AS $$
    SELECT * FROM customers
    WHERE tenant_id = current_user_tenant_id()
      AND is_active
      AND (
          p_query = ''
          OR name ILIKE '%' || p_query || '%'
          OR email ILIKE '%' || p_query || '%'
          OR phone ILIKE '%' || p_query || '%'
          OR code ILIKE '%' || p_query || '%'
      )
    ORDER BY
        CASE WHEN p_query = '' THEN total_spent ELSE 0 END DESC,
        name ASC
    LIMIT p_limit;
$$;

-- ============================================
-- FUNCIÓN RPC: CREAR CLIENTE RÁPIDO (desde POS)
-- ============================================
CREATE OR REPLACE FUNCTION quick_create_customer(p_name TEXT, p_phone TEXT DEFAULT NULL, p_email TEXT DEFAULT NULL)
RETURNS customers LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_customer customers;
BEGIN
    INSERT INTO customers (tenant_id, name, phone, email, code)
    VALUES (
        current_user_tenant_id(),
        p_name,
        p_phone,
        p_email,
        'CLI-' || upper(substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6))
    )
    RETURNING * INTO v_customer;
    RETURN v_customer;
EXCEPTION
    WHEN unique_violation THEN
        -- Si falla por email duplicado, buscar el existente
        SELECT * INTO v_customer FROM customers WHERE tenant_id = current_user_tenant_id() AND email = p_email;
        RETURN v_customer;
END $$;