-- 003_create_tenants.sql
-- Tabla de tenants (panaderías)

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,                    -- subdominio: "panaderia-demo"
    business_name TEXT NOT NULL,                  -- razón social
    trade_name TEXT,                              -- nombre comercial
    tax_id TEXT,                                  -- CUIT/CIF/NIF
    address TEXT,
    phone TEXT,
    email TEXT,
    currency TEXT DEFAULT 'ARS',                  -- configurable por país
    timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',
    tax_rate NUMERIC(5,2) DEFAULT 21.00,
    ticket_prefix TEXT DEFAULT 'TCK',
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE is_active;