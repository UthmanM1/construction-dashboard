-- Construction Dashboard Database Schema
-- Run in order

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS & ROLES
-- ============================================================
CREATE TYPE user_role AS ENUM ('foreman', 'manager', 'admin');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'foreman',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  site_location VARCHAR(255),
  status project_status DEFAULT 'planning',
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  budget NUMERIC(12,2),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  changed_by UUID REFERENCES users(id),
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEES & ACTIVITY
-- ============================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  crew VARCHAR(100),
  trade VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE activity_type AS ENUM ('on_site', 'off_site', 'sick', 'leave', 'training');

CREATE TABLE employee_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  project_id UUID REFERENCES projects(id),
  activity_date DATE NOT NULL,
  activity_type activity_type NOT NULL,
  hours_worked NUMERIC(4,2),
  notes TEXT,
  logged_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EQUIPMENT
-- ============================================================
CREATE TYPE equipment_status AS ENUM ('available', 'in_use', 'maintenance', 'retired');

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  serial_number VARCHAR(100) UNIQUE,
  status equipment_status DEFAULT 'available',
  last_service_date DATE,
  next_service_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipment_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id),
  project_id UUID REFERENCES projects(id),
  operator_id UUID REFERENCES employees(id),
  usage_date DATE NOT NULL,
  hours_used NUMERIC(5,2),
  fuel_used NUMERIC(8,2),
  condition_notes TEXT,
  logged_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS ARCHIVE
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  category VARCHAR(100),
  description TEXT,
  tags TEXT[],
  uploaded_by UUID REFERENCES users(id),
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  severity alert_severity DEFAULT 'info',
  related_type VARCHAR(50),
  related_id UUID,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_employee_activity_date ON employee_activity(activity_date);
CREATE INDEX idx_employee_activity_project ON employee_activity(project_id);
CREATE INDEX idx_equipment_usage_date ON equipment_usage(usage_date);
CREATE INDEX idx_equipment_usage_project ON equipment_usage(project_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved);

-- ============================================================
-- SEED: Default admin user (password: Admin1234!)
-- ============================================================
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Admin User',
  'admin@construction.com',
  '$2b$10$rOzJqmvZq1CeQMjGc6VtB.pNXOqMIlOlJJaORqEBe0aWXrjGy1g3i',
  'admin'
);
