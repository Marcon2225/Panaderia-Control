-- 001_enable_extensions.sql
-- Extensiones requeridas para UUID y criptografía

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";