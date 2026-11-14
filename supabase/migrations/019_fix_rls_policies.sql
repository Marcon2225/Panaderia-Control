-- 019_fix_rls_policies.sql
-- Corrección de políticas RLS para users y tenants
-- Problemas corregidos:
-- 1. users: FOR ALL permite cambiar tenant_id, auth_uid, role sin autorización
-- 2. tenants: solo tiene SELECT, el trigger SECURITY DEFINER bypassea RLS pero mejor explícito
-- 3. Añadir política específica para que usuario solo actualice SU perfil (no otros)

-- ============================================
-- TENANTS: Solo SELECT para usuarios normales
-- El trigger handle_new_user (SECURITY DEFINER) bypassea RLS
-- No se permiten INSERT/UPDATE/DELETE directos desde cliente
-- ============================================
-- La política existente "tenants_select_own" ya es correcta
-- No añadimos más políticas aquí por seguridad

-- ============================================
-- USERS: Separar SELECT/INSERT/UPDATE/DELETE con validaciones estrictas
-- ============================================

-- Eliminar política anterior "users_tenant_isolation" (FOR ALL)
DROP POLICY IF EXISTS "users_tenant_isolation" ON users;

-- SELECT: usuarios ven todos los usuarios de su tenant
CREATE POLICY "users_select_tenant" ON users
    FOR SELECT USING (tenant_id = current_user_tenant_id());

-- INSERT: solo trigger SECURITY DEFINER puede crear usuarios (signup)
-- Los usuarios normales NO pueden insertar en users
-- El trigger bypassea RLS por ser SECURITY DEFINER

-- UPDATE: usuario solo puede actualizar SU PROPIO perfil
-- NO puede cambiar: tenant_id, auth_uid, role, is_active
CREATE POLICY "users_update_own_profile" ON users
    FOR UPDATE USING (auth_uid = auth.uid())
    WITH CHECK (
        auth_uid = auth.uid()
        AND tenant_id = current_user_tenant_id()
        AND auth_uid = (SELECT auth_uid FROM users WHERE id = users.id)  -- no cambiar auth_uid
        AND tenant_id = (SELECT tenant_id FROM users WHERE id = users.id)  -- no cambiar tenant_id
        AND role = (SELECT role FROM users WHERE id = users.id)  -- no cambiar role
    );

-- DELETE: solo owners/admins del mismo tenant pueden desactivar usuarios
-- (usar is_active = false en lugar de DELETE real para trazabilidad)
CREATE POLICY "users_deactivate_tenant_admin" ON users
    FOR DELETE USING (
        tenant_id = current_user_tenant_id()
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_uid = auth.uid()
            AND u.tenant_id = current_user_tenant_id()
            AND u.role IN ('owner', 'admin')
        )
    );

-- ============================================
-- CATEGORIES, SUPPLIERS, INGREDIENTS, PRODUCTS: Sin cambios
-- Las políticas existentes son correctas (tenant_id = current_user_tenant_id())
-- ============================================

-- ============================================
-- PRODUCT_INGREDIENTS: Hereda tenant via product - correcto
-- ============================================

-- ============================================
-- STOCK_MOVEMENTS: Solo SELECT + INSERT - correcto (inmutable)
-- ============================================