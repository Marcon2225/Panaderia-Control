-- 015_create_rls_policies.sql
-- Políticas RLS para aislamiento multi-tenant
-- El frontend NUNCA envía tenant_id; se resuelve via auth.uid()

-- TENANTS: solo owner/admin ven su tenant
CREATE POLICY "tenants_select_own" ON tenants
    FOR SELECT USING (id = current_user_tenant_id());

-- USERS: usuarios ven solo su tenant
CREATE POLICY "users_tenant_isolation" ON users
    FOR ALL USING (tenant_id = current_user_tenant_id());

-- CATEGORIES
CREATE POLICY "categories_select" ON categories
    FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "categories_write" ON categories
    FOR INSERT, UPDATE, DELETE USING (tenant_id = current_user_tenant_id())
    WITH CHECK (tenant_id = current_user_tenant_id());

-- SUPPLIERS
CREATE POLICY "suppliers_select" ON suppliers
    FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "suppliers_write" ON suppliers
    FOR INSERT, UPDATE, DELETE USING (tenant_id = current_user_tenant_id())
    WITH CHECK (tenant_id = current_user_tenant_id());

-- INGREDIENTS
CREATE POLICY "ingredients_select" ON ingredients
    FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "ingredients_write" ON ingredients
    FOR INSERT, UPDATE, DELETE USING (tenant_id = current_user_tenant_id())
    WITH CHECK (tenant_id = current_user_tenant_id());

-- PRODUCTS
CREATE POLICY "products_select" ON products
    FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "products_write" ON products
    FOR INSERT, UPDATE, DELETE USING (tenant_id = current_user_tenant_id())
    WITH CHECK (tenant_id = current_user_tenant_id());

-- PRODUCT_INGREDIENTS (hereda tenant via product)
CREATE POLICY "product_ingredients_select" ON product_ingredients
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM products WHERE id = product_ingredients.product_id AND tenant_id = current_user_tenant_id())
    );
CREATE POLICY "product_ingredients_write" ON product_ingredients
    FOR INSERT, UPDATE, DELETE USING (
        EXISTS (SELECT 1 FROM products WHERE id = product_ingredients.product_id AND tenant_id = current_user_tenant_id())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM products WHERE id = product_ingredients.product_id AND tenant_id = current_user_tenant_id())
    );

-- STOCK_MOVEMENTS: SOLO INSERT + SELECT (inmutable)
CREATE POLICY "movements_select" ON stock_movements
    FOR SELECT USING (tenant_id = current_user_tenant_id());
CREATE POLICY "movements_insert" ON stock_movements
    FOR INSERT WITH CHECK (
        tenant_id = current_user_tenant_id()
        AND user_id = (SELECT id FROM users WHERE auth_uid = auth.uid() AND is_active)
        AND validate_entity_tenant(tenant_id, entity_type, entity_id)
    );
-- NO hay UPDATE/DELETE → inmutable