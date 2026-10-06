-- ============================================================
-- AssetPro Database Schema
-- Run this entire file in pgAdmin Query Tool
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE user_role     AS ENUM ('admin', 'manager', 'technician');
CREATE TYPE asset_status  AS ENUM ('active', 'maintenance', 'inactive', 'retired');
CREATE TYPE asset_type    AS ENUM ('forklift', 'truck', 'excavator', 'crane', 'generator', 'compressor', 'equipment', 'other');
CREATE TYPE wo_status     AS ENUM ('open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE wo_priority   AS ENUM ('critical', 'high', 'normal', 'low');
CREATE TYPE wo_type       AS ENUM ('preventive', 'corrective', 'inspection', 'emergency');

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'technician',
  department    VARCHAR(100),
  is_active     BOOLEAN DEFAULT true,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── ASSETS ───────────────────────────────────────────────────
CREATE TABLE assets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  asset_code    VARCHAR(50)  UNIQUE NOT NULL,
  serial_number VARCHAR(100) UNIQUE,
  asset_type    asset_type   NOT NULL DEFAULT 'equipment',
  status        asset_status NOT NULL DEFAULT 'active',
  location      VARCHAR(150),
  running_hours NUMERIC(10,2) DEFAULT 0,
  manufacturer  VARCHAR(100),
  model         VARCHAR(100),
  year          INTEGER,
  purchase_cost NUMERIC(12,2),
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── MAINTENANCE SCHEDULES ────────────────────────────────────
CREATE TABLE maintenance_schedules (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id           UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name               VARCHAR(150) NOT NULL,
  interval_hours     NUMERIC(10,2) NOT NULL,
  last_service_hours NUMERIC(10,2) DEFAULT 0,
  last_service_date  DATE,
  is_active          BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── SPARE PARTS ──────────────────────────────────────────────
CREATE TABLE spare_parts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  sku           VARCHAR(100) UNIQUE NOT NULL,
  description   TEXT,
  quantity      INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_cost     NUMERIC(10,2),
  reorder_point INTEGER DEFAULT 0,
  max_stock     INTEGER DEFAULT 100,
  supplier      VARCHAR(150),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── WORK ORDERS ──────────────────────────────────────────────
CREATE SEQUENCE wo_number_seq START 1000;

CREATE TABLE work_orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wo_number        VARCHAR(20) UNIQUE NOT NULL DEFAULT ('WO-' || nextval('wo_number_seq')),
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  asset_id         UUID NOT NULL REFERENCES assets(id),
  assigned_to      UUID REFERENCES users(id),
  created_by       UUID NOT NULL REFERENCES users(id),
  priority         wo_priority NOT NULL DEFAULT 'normal',
  status           wo_status   NOT NULL DEFAULT 'open',
  wo_type          wo_type     NOT NULL DEFAULT 'corrective',
  estimated_hours  NUMERIC(6,2),
  actual_hours     NUMERIC(6,2),
  due_date         DATE,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  completion_notes TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── WORK ORDER PARTS (parts used in a WO) ───────────────────
CREATE TABLE work_order_parts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id),
  quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost     NUMERIC(10,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIT LOGS (append-only) ─────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  user_name   VARCHAR(100),
  action      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID,
  field_name  VARCHAR(100),
  old_value   TEXT,
  new_value   TEXT,
  ip_address  INET,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX idx_assets_status       ON assets(status);
CREATE INDEX idx_assets_type         ON assets(asset_type);
CREATE INDEX idx_work_orders_status  ON work_orders(status);
CREATE INDEX idx_work_orders_assigned ON work_orders(assigned_to);
CREATE INDEX idx_work_orders_asset   ON work_orders(asset_id);
CREATE INDEX idx_audit_entity        ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created       ON audit_logs(created_at DESC);
CREATE INDEX idx_maintenance_asset   ON maintenance_schedules(asset_id);

-- ── AUTO-UPDATE updated_at TRIGGER ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_assets_updated   BEFORE UPDATE ON assets   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_wo_updated       BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_parts_updated    BEFORE UPDATE ON spare_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
