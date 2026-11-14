-- 005_create_categories.sql
-- Tabla de categorías con jerarquía (padre/hijo)

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type category_type NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    color TEXT DEFAULT '#c87d4a',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, slug)
);

-- Índices
CREATE INDEX idx_categories_tenant_type ON categories(tenant_id, type);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_tenant_active ON categories(tenant_id, is_active) WHERE is_active;