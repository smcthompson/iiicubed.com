import type { WorkstationMigration } from '#/app/workstation/infrastructure/sqlserver/migrations/WorkstationMigration.js';

export const createWorkstationDatabase: WorkstationMigration = {
  id: '001_create_workstation_database',
  description: 'Create workstation SQL Server schema and normalized catalog tables.',
  sql: `
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'workstation')
BEGIN
  EXEC('CREATE SCHEMA workstation');
END;

IF OBJECT_ID('workstation.schema_migrations', 'U') IS NULL
BEGIN
  CREATE TABLE workstation.schema_migrations (
    id NVARCHAR(128) NOT NULL CONSTRAINT pk_workstation_schema_migrations PRIMARY KEY,
    description NVARCHAR(512) NOT NULL,
    applied_at_utc DATETIME2(0) NOT NULL CONSTRAINT df_workstation_schema_migrations_applied_at_utc DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('workstation.products', 'U') IS NULL
BEGIN
  CREATE TABLE workstation.products (
    id NVARCHAR(128) NOT NULL CONSTRAINT pk_workstation_products PRIMARY KEY,
    brand NVARCHAR(128) NOT NULL,
    model NVARCHAR(256) NOT NULL,
    category NVARCHAR(64) NOT NULL,
    status NVARCHAR(32) NOT NULL CONSTRAINT df_workstation_products_status DEFAULT 'candidate',
    eliminated_reason NVARCHAR(1000) NULL,
    created_at_utc DATETIME2(0) NOT NULL CONSTRAINT df_workstation_products_created_at_utc DEFAULT SYSUTCDATETIME(),
    updated_at_utc DATETIME2(0) NOT NULL CONSTRAINT df_workstation_products_updated_at_utc DEFAULT SYSUTCDATETIME(),
    CONSTRAINT ck_workstation_products_category CHECK (category IN ('monitor', 'arm', 'dock', 'desk', 'chair', 'center_device', 'accessory')),
    CONSTRAINT ck_workstation_products_status CHECK (status IN ('candidate', 'approved', 'eliminated'))
  );
END;

IF OBJECT_ID('workstation.monitor_specs', 'U') IS NULL
BEGIN
  CREATE TABLE workstation.monitor_specs (
    product_id NVARCHAR(128) NOT NULL CONSTRAINT pk_workstation_monitor_specs PRIMARY KEY,
    diagonal_in DECIMAL(5, 2) NULL,
    resolution_x INT NULL,
    resolution_y INT NULL,
    aspect_ratio NVARCHAR(32) NULL,
    panel_type NVARCHAR(64) NULL,
    is_flat BIT NOT NULL CONSTRAINT df_workstation_monitor_specs_is_flat DEFAULT 1,
    is_curved BIT NOT NULL CONSTRAINT df_workstation_monitor_specs_is_curved DEFAULT 0,
    refresh_hz DECIMAL(6, 2) NULL,
    brightness_nits INT NULL,
    color_gamut NVARCHAR(128) NULL,
    hdr_support NVARCHAR(128) NULL,
    usb_c BIT NOT NULL CONSTRAINT df_workstation_monitor_specs_usb_c DEFAULT 0,
    usb_c_pd_w INT NULL,
    vesa_width_mm INT NULL,
    vesa_height_mm INT NULL,
    weight_kg DECIMAL(6, 3) NULL,
    CONSTRAINT fk_workstation_monitor_specs_product FOREIGN KEY (product_id) REFERENCES workstation.products(id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID('workstation.monitor_mechanics', 'U') IS NULL
BEGIN
  CREATE TABLE workstation.monitor_mechanics (
    product_id NVARCHAR(128) NOT NULL CONSTRAINT pk_workstation_monitor_mechanics PRIMARY KEY,
    chassis_width_mm DECIMAL(8, 2) NULL,
    chassis_height_mm DECIMAL(8, 2) NULL,
    chassis_depth_mm DECIMAL(8, 2) NULL,
    active_width_mm DECIMAL(8, 2) NULL,
    active_height_mm DECIMAL(8, 2) NULL,
    bezel_left_mm DECIMAL(6, 2) NULL,
    bezel_right_mm DECIMAL(6, 2) NULL,
    bezel_top_mm DECIMAL(6, 2) NULL,
    bezel_bottom_mm DECIMAL(6, 2) NULL,
    vesa_center_x_mm DECIMAL(8, 2) NULL,
    vesa_center_y_mm DECIMAL(8, 2) NULL,
    notes NVARCHAR(1000) NULL,
    CONSTRAINT fk_workstation_monitor_mechanics_product FOREIGN KEY (product_id) REFERENCES workstation.products(id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID('workstation.center_device_mechanics', 'U') IS NULL
BEGIN
  CREATE TABLE workstation.center_device_mechanics (
    product_id NVARCHAR(128) NOT NULL CONSTRAINT pk_workstation_center_device_mechanics PRIMARY KEY,
    chassis_width_mm DECIMAL(8, 2) NOT NULL,
    panel_height_mm DECIMAL(8, 2) NOT NULL,
    hinge_gap_mm DECIMAL(8, 2) NOT NULL,
    stacked_height_mm DECIMAL(8, 2) NOT NULL,
    notes NVARCHAR(1000) NULL,
    CONSTRAINT fk_workstation_center_device_mechanics_product FOREIGN KEY (product_id) REFERENCES workstation.products(id) ON DELETE CASCADE
  );
END;

IF OBJECT_ID('workstation.product_sources', 'U') IS NULL
BEGIN
  CREATE TABLE workstation.product_sources (
    id NVARCHAR(128) NOT NULL CONSTRAINT pk_workstation_product_sources PRIMARY KEY,
    product_id NVARCHAR(128) NULL,
    source_type NVARCHAR(64) NOT NULL,
    title NVARCHAR(256) NOT NULL,
    url NVARCHAR(1000) NULL,
    retrieved_date DATE NULL,
    confidence NVARCHAR(32) NOT NULL,
    notes NVARCHAR(1000) NULL,
    CONSTRAINT fk_workstation_product_sources_product FOREIGN KEY (product_id) REFERENCES workstation.products(id) ON DELETE CASCADE,
    CONSTRAINT ck_workstation_product_sources_confidence CHECK (confidence IN ('high', 'medium', 'low'))
  );
END;

IF OBJECT_ID('workstation.prices', 'U') IS NULL
BEGIN
  CREATE TABLE workstation.prices (
    id NVARCHAR(128) NOT NULL CONSTRAINT pk_workstation_prices PRIMARY KEY,
    product_id NVARCHAR(128) NOT NULL,
    retailer NVARCHAR(128) NOT NULL,
    price_usd DECIMAL(10, 2) NOT NULL,
    condition NVARCHAR(32) NOT NULL,
    checked_date DATE NOT NULL,
    url NVARCHAR(1000) NULL,
    CONSTRAINT fk_workstation_prices_product FOREIGN KEY (product_id) REFERENCES workstation.products(id) ON DELETE CASCADE,
    CONSTRAINT ck_workstation_prices_condition CHECK (condition IN ('new', 'refurb', 'used', 'unknown'))
  );
END;

IF OBJECT_ID('workstation.constraints', 'U') IS NULL
BEGIN
  CREATE TABLE workstation.constraints (
    id NVARCHAR(128) NOT NULL CONSTRAINT pk_workstation_constraints PRIMARY KEY,
    name NVARCHAR(128) NOT NULL,
    requirement NVARCHAR(1000) NOT NULL,
    operator NVARCHAR(64) NOT NULL,
    target_value NVARCHAR(256) NOT NULL,
    unit NVARCHAR(64) NOT NULL,
    hard_constraint BIT NOT NULL,
    weight DECIMAL(8, 4) NOT NULL CONSTRAINT df_workstation_constraints_weight DEFAULT 1,
    active BIT NOT NULL CONSTRAINT df_workstation_constraints_active DEFAULT 1,
    created_at_utc DATETIME2(0) NOT NULL CONSTRAINT df_workstation_constraints_created_at_utc DEFAULT SYSUTCDATETIME(),
    CONSTRAINT ck_workstation_constraints_operator CHECK (operator IN ('<=', '>=', '=', '!=', 'minimize_abs_delta', 'maximize', 'minimize'))
  );
END;

IF OBJECT_ID('workstation.layout_candidates', 'U') IS NULL
BEGIN
  CREATE TABLE workstation.layout_candidates (
    id NVARCHAR(128) NOT NULL CONSTRAINT pk_workstation_layout_candidates PRIMARY KEY,
    name NVARCHAR(256) NOT NULL,
    left_monitor_id NVARCHAR(128) NOT NULL,
    center_device_id NVARCHAR(128) NOT NULL,
    right_monitor_id NVARCHAR(128) NOT NULL,
    top_monitor_id NVARCHAR(128) NOT NULL,
    lower_row_width_mm DECIMAL(8, 2) NOT NULL,
    top_width_mm DECIMAL(8, 2) NOT NULL,
    width_delta_mm DECIMAL(8, 2) NOT NULL,
    side_portrait_height_mm DECIMAL(8, 2) NOT NULL,
    center_stack_height_mm DECIMAL(8, 2) NOT NULL,
    side_height_delta_mm DECIMAL(8, 2) NOT NULL,
    score DECIMAL(8, 4) NOT NULL,
    created_at_utc DATETIME2(0) NOT NULL CONSTRAINT df_workstation_layout_candidates_created_at_utc DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_workstation_layout_left_monitor FOREIGN KEY (left_monitor_id) REFERENCES workstation.products(id),
    CONSTRAINT fk_workstation_layout_center_device FOREIGN KEY (center_device_id) REFERENCES workstation.products(id),
    CONSTRAINT fk_workstation_layout_right_monitor FOREIGN KEY (right_monitor_id) REFERENCES workstation.products(id),
    CONSTRAINT fk_workstation_layout_top_monitor FOREIGN KEY (top_monitor_id) REFERENCES workstation.products(id)
  );
END;

IF OBJECT_ID('workstation.layout_constraint_evaluations', 'U') IS NULL
BEGIN
  CREATE TABLE workstation.layout_constraint_evaluations (
    layout_candidate_id NVARCHAR(128) NOT NULL,
    constraint_id NVARCHAR(128) NOT NULL,
    passed BIT NOT NULL,
    actual_value NVARCHAR(256) NULL,
    score_impact DECIMAL(8, 4) NOT NULL,
    notes NVARCHAR(1000) NULL,
    CONSTRAINT pk_workstation_layout_constraint_evaluations PRIMARY KEY (layout_candidate_id, constraint_id),
    CONSTRAINT fk_workstation_layout_constraint_evaluations_layout FOREIGN KEY (layout_candidate_id) REFERENCES workstation.layout_candidates(id) ON DELETE CASCADE,
    CONSTRAINT fk_workstation_layout_constraint_evaluations_constraint FOREIGN KEY (constraint_id) REFERENCES workstation.constraints(id) ON DELETE CASCADE
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_workstation_products_category_status' AND object_id = OBJECT_ID('workstation.products'))
BEGIN
  CREATE INDEX ix_workstation_products_category_status ON workstation.products(category, status);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_workstation_layout_candidates_score' AND object_id = OBJECT_ID('workstation.layout_candidates'))
BEGIN
  CREATE INDEX ix_workstation_layout_candidates_score ON workstation.layout_candidates(score DESC, width_delta_mm, side_height_delta_mm);
END;
`,
};
