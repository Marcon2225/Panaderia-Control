// F:\Programas\panaderia-control\src\hooks\useAuth.ts
// Hooks de autenticación (re-export desde AuthContext para compatibilidad)

export { useAuth, useTenantId, useRole, useIsAdmin, useCanManageInventory, useCanManageSales } from '../context/AuthContext';
export type { AuthContextType } from '../context/AuthContext';

// Re-export types from AuthContext
export type { User, Tenant } from '../types/database';