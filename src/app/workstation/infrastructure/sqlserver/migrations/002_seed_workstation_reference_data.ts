import type { WorkstationMigration } from '#/app/workstation/infrastructure/sqlserver/migrations/WorkstationMigration.js';

export const seedWorkstationReferenceData: WorkstationMigration = {
  id: '002_seed_workstation_reference_data',
  description: 'Seed workstation products, mechanical facts, constraints, and known layout candidates.',
  sql: `
MERGE workstation.products AS target
USING (VALUES
  ('asus_zenbook_duo_ux8406', 'ASUS', 'Zenbook Duo UX8406', 'center_device', 'approved', NULL),
  ('lepow_18_5_4k_portable', 'Lepow', '18.5-inch 4K portable monitor', 'monitor', 'candidate', NULL),
  ('lepow_18_5_fhd_portable', 'Lepow', '18.5-inch FHD portable monitor', 'monitor', 'candidate', NULL),
  ('lepow_15_6_2_5k_portable', 'Lepow', '15.6-inch 2.5K portable monitor', 'monitor', 'candidate', NULL),
  ('top_34_flat_816_9_reference', 'Reference', '34-inch flat top display, 816.9 mm chassis width', 'monitor', 'candidate', NULL),
  ('top_compact_flat_712_6_reference', 'Reference', 'Compact flat top display, 712.6 mm chassis width', 'monitor', 'candidate', NULL),
  ('lg_34wp95c_w', 'LG', '34WP95C-W', 'monitor', 'eliminated', 'Curved display violates the flat-panel-only workstation constraint.')
) AS source (id, brand, model, category, status, eliminated_reason)
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET
    brand = source.brand,
    model = source.model,
    category = source.category,
    status = source.status,
    eliminated_reason = source.eliminated_reason,
    updated_at_utc = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
  INSERT (id, brand, model, category, status, eliminated_reason)
  VALUES (source.id, source.brand, source.model, source.category, source.status, source.eliminated_reason);

MERGE workstation.center_device_mechanics AS target
USING (VALUES
  ('asus_zenbook_duo_ux8406', 313.50, 217.90, 26.00, 461.80, 'Modeled as two 313.5 x 217.9 mm chassis sections separated by a 26 mm hinge gap.')
) AS source (product_id, chassis_width_mm, panel_height_mm, hinge_gap_mm, stacked_height_mm, notes)
ON target.product_id = source.product_id
WHEN MATCHED THEN
  UPDATE SET
    chassis_width_mm = source.chassis_width_mm,
    panel_height_mm = source.panel_height_mm,
    hinge_gap_mm = source.hinge_gap_mm,
    stacked_height_mm = source.stacked_height_mm,
    notes = source.notes
WHEN NOT MATCHED THEN
  INSERT (product_id, chassis_width_mm, panel_height_mm, hinge_gap_mm, stacked_height_mm, notes)
  VALUES (source.product_id, source.chassis_width_mm, source.panel_height_mm, source.hinge_gap_mm, source.stacked_height_mm, source.notes);

MERGE workstation.monitor_specs AS target
USING (VALUES
  ('lepow_18_5_4k_portable', 18.50, 3840, 2160, '16:9', NULL, 1, 0, 60.00, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('lepow_18_5_fhd_portable', 18.50, 1920, 1080, '16:9', NULL, 1, 0, 60.00, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('lepow_15_6_2_5k_portable', 15.60, 2560, 1600, '16:10', NULL, 1, 0, 60.00, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('top_34_flat_816_9_reference', 34.00, NULL, NULL, NULL, NULL, 1, 0, NULL, NULL, NULL, NULL, 0, NULL, 100, 100, NULL),
  ('top_compact_flat_712_6_reference', NULL, NULL, NULL, NULL, NULL, 1, 0, NULL, NULL, NULL, NULL, 0, NULL, 100, 100, NULL),
  ('lg_34wp95c_w', 34.00, 5120, 2160, '21:9', NULL, 0, 1, 72.00, NULL, NULL, NULL, 1, 96, 100, 100, NULL)
) AS source (product_id, diagonal_in, resolution_x, resolution_y, aspect_ratio, panel_type, is_flat, is_curved, refresh_hz, brightness_nits, color_gamut, hdr_support, usb_c, usb_c_pd_w, vesa_width_mm, vesa_height_mm, weight_kg)
ON target.product_id = source.product_id
WHEN MATCHED THEN
  UPDATE SET
    diagonal_in = source.diagonal_in,
    resolution_x = source.resolution_x,
    resolution_y = source.resolution_y,
    aspect_ratio = source.aspect_ratio,
    panel_type = source.panel_type,
    is_flat = source.is_flat,
    is_curved = source.is_curved,
    refresh_hz = source.refresh_hz,
    brightness_nits = source.brightness_nits,
    color_gamut = source.color_gamut,
    hdr_support = source.hdr_support,
    usb_c = source.usb_c,
    usb_c_pd_w = source.usb_c_pd_w,
    vesa_width_mm = source.vesa_width_mm,
    vesa_height_mm = source.vesa_height_mm,
    weight_kg = source.weight_kg
WHEN NOT MATCHED THEN
  INSERT (product_id, diagonal_in, resolution_x, resolution_y, aspect_ratio, panel_type, is_flat, is_curved, refresh_hz, brightness_nits, color_gamut, hdr_support, usb_c, usb_c_pd_w, vesa_width_mm, vesa_height_mm, weight_kg)
  VALUES (source.product_id, source.diagonal_in, source.resolution_x, source.resolution_y, source.aspect_ratio, source.panel_type, source.is_flat, source.is_curved, source.refresh_hz, source.brightness_nits, source.color_gamut, source.hdr_support, source.usb_c, source.usb_c_pd_w, source.vesa_width_mm, source.vesa_height_mm, source.weight_kg);

MERGE workstation.monitor_mechanics AS target
USING (VALUES
  ('lepow_18_5_4k_portable', 433.30, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tier 1 side monitor mechanical reference: portrait height uses landscape chassis width.'),
  ('lepow_18_5_fhd_portable', 429.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tier 2 side monitor mechanical reference.'),
  ('lepow_15_6_2_5k_portable', 368.30, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Tier 3 compact side monitor mechanical reference.'),
  ('top_34_flat_816_9_reference', 816.90, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Reference top display width from mechanical layout options.'),
  ('top_compact_flat_712_6_reference', 712.60, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Compact reference top display width from mechanical layout options.'),
  ('lg_34wp95c_w', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Eliminated before mechanical ranking because panel is curved.')
) AS source (product_id, chassis_width_mm, chassis_height_mm, chassis_depth_mm, active_width_mm, active_height_mm, bezel_left_mm, bezel_right_mm, bezel_top_mm, bezel_bottom_mm, vesa_center_x_mm, vesa_center_y_mm, notes)
ON target.product_id = source.product_id
WHEN MATCHED THEN
  UPDATE SET
    chassis_width_mm = source.chassis_width_mm,
    chassis_height_mm = source.chassis_height_mm,
    chassis_depth_mm = source.chassis_depth_mm,
    active_width_mm = source.active_width_mm,
    active_height_mm = source.active_height_mm,
    bezel_left_mm = source.bezel_left_mm,
    bezel_right_mm = source.bezel_right_mm,
    bezel_top_mm = source.bezel_top_mm,
    bezel_bottom_mm = source.bezel_bottom_mm,
    vesa_center_x_mm = source.vesa_center_x_mm,
    vesa_center_y_mm = source.vesa_center_y_mm,
    notes = source.notes
WHEN NOT MATCHED THEN
  INSERT (product_id, chassis_width_mm, chassis_height_mm, chassis_depth_mm, active_width_mm, active_height_mm, bezel_left_mm, bezel_right_mm, bezel_top_mm, bezel_bottom_mm, vesa_center_x_mm, vesa_center_y_mm, notes)
  VALUES (source.product_id, source.chassis_width_mm, source.chassis_height_mm, source.chassis_depth_mm, source.active_width_mm, source.active_height_mm, source.bezel_left_mm, source.bezel_right_mm, source.bezel_top_mm, source.bezel_bottom_mm, source.vesa_center_x_mm, source.vesa_center_y_mm, source.notes);

MERGE workstation.constraints AS target
USING (VALUES
  ('side_portrait_height_max', 'side_portrait_height_max', 'Side monitor landscape chassis width must be less than or equal to Zenbook Duo stacked height.', '<=', '461.8', 'mm', 1, 100.0000, 1),
  ('flat_panel_only', 'flat_panel_only', 'Curved monitors are eliminated; all monitors used in the ranked layout must be flat panels.', '=', '0', 'boolean', 1, 100.0000, 1),
  ('vesa_required', 'vesa_required', 'Side and top monitors should support VESA mounting for engineered arm placement.', '=', '1', 'boolean', 1, 90.0000, 1),
  ('top_width_match', 'top_width_match', 'Top monitor chassis width should match the lower-row total width.', 'minimize_abs_delta', '0', 'mm', 0, 75.0000, 1),
  ('resolution_priority', 'resolution_priority', 'Rank higher-resolution side monitors above otherwise similar lower-resolution options.', 'maximize', '0', 'pixels', 0, 40.0000, 1)
) AS source (id, name, requirement, operator, target_value, unit, hard_constraint, weight, active)
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET
    name = source.name,
    requirement = source.requirement,
    operator = source.operator,
    target_value = source.target_value,
    unit = source.unit,
    hard_constraint = source.hard_constraint,
    weight = source.weight,
    active = source.active
WHEN NOT MATCHED THEN
  INSERT (id, name, requirement, operator, target_value, unit, hard_constraint, weight, active)
  VALUES (source.id, source.name, source.requirement, source.operator, source.target_value, source.unit, source.hard_constraint, source.weight, source.active);

MERGE workstation.layout_candidates AS target
USING (VALUES
  ('tier_1_best_mechanical_fit', 'Tier 1 - Best mechanical fit / highest-res sides', 'lepow_18_5_4k_portable', 'asus_zenbook_duo_ux8406', 'lepow_18_5_4k_portable', 'top_34_flat_816_9_reference', 815.30, 816.90, 1.60, 433.30, 461.80, -28.50, 98.0000),
  ('tier_2_budget_sides', 'Tier 2 - Lepow/portable FHD-style budget sides', 'lepow_18_5_fhd_portable', 'asus_zenbook_duo_ux8406', 'lepow_18_5_fhd_portable', 'top_34_flat_816_9_reference', 839.50, 816.90, -22.60, 429.00, 461.80, -32.80, 82.0000),
  ('tier_3_compact_sides', 'Tier 3 - Compact Lepow 15.6 in 2.5K sides', 'lepow_15_6_2_5k_portable', 'asus_zenbook_duo_ux8406', 'lepow_15_6_2_5k_portable', 'top_compact_flat_712_6_reference', 760.50, 712.60, -47.90, 368.30, 461.80, -93.50, 65.0000)
) AS source (id, name, left_monitor_id, center_device_id, right_monitor_id, top_monitor_id, lower_row_width_mm, top_width_mm, width_delta_mm, side_portrait_height_mm, center_stack_height_mm, side_height_delta_mm, score)
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET
    name = source.name,
    left_monitor_id = source.left_monitor_id,
    center_device_id = source.center_device_id,
    right_monitor_id = source.right_monitor_id,
    top_monitor_id = source.top_monitor_id,
    lower_row_width_mm = source.lower_row_width_mm,
    top_width_mm = source.top_width_mm,
    width_delta_mm = source.width_delta_mm,
    side_portrait_height_mm = source.side_portrait_height_mm,
    center_stack_height_mm = source.center_stack_height_mm,
    side_height_delta_mm = source.side_height_delta_mm,
    score = source.score
WHEN NOT MATCHED THEN
  INSERT (id, name, left_monitor_id, center_device_id, right_monitor_id, top_monitor_id, lower_row_width_mm, top_width_mm, width_delta_mm, side_portrait_height_mm, center_stack_height_mm, side_height_delta_mm, score)
  VALUES (source.id, source.name, source.left_monitor_id, source.center_device_id, source.right_monitor_id, source.top_monitor_id, source.lower_row_width_mm, source.top_width_mm, source.width_delta_mm, source.side_portrait_height_mm, source.center_stack_height_mm, source.side_height_delta_mm, source.score);

MERGE workstation.product_sources AS target
USING (VALUES
  ('source_mechanical_options_html', NULL, 'mechanical_layout', 'Zenbook Duo monitor mechanical layout options', '/workstation/components/monitors/zenbook_monitor_mechanical_options.html', CONVERT(date, '2026-07-06'), 'high', 'Local generated mechanical comparison used for initial seeded tier dimensions.'),
  ('source_sqlite_schema_suggestions', NULL, 'design_note', 'Original SQLite schema suggestion converted to SQL Server normalized schema', NULL, CONVERT(date, '2026-07-06'), 'medium', 'Design source for separating product facts from layout evaluations.')
) AS source (id, product_id, source_type, title, url, retrieved_date, confidence, notes)
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET
    product_id = source.product_id,
    source_type = source.source_type,
    title = source.title,
    url = source.url,
    retrieved_date = source.retrieved_date,
    confidence = source.confidence,
    notes = source.notes
WHEN NOT MATCHED THEN
  INSERT (id, product_id, source_type, title, url, retrieved_date, confidence, notes)
  VALUES (source.id, source.product_id, source.source_type, source.title, source.url, source.retrieved_date, source.confidence, source.notes);
`,
};
