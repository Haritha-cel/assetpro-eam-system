require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

async function seed() {
  console.log('🌱 Seeding AssetPro...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash('Password123!', 12);

    // ── Users ──────────────────────────────────────────────
    const { rows: users } = await client.query(`
      INSERT INTO users (name, email, password_hash, role, department) VALUES
        ('Alex Davies',  'admin@assetpro.com',   $1, 'admin',      'IT Operations'),
        ('Sarah Kim',    'manager@assetpro.com', $1, 'manager',    'Fleet Operations'),
        ('Priya Nair',   'priya@assetpro.com',   $1, 'technician', 'Maintenance'),
        ('David Chen',   'david@assetpro.com',   $1, 'technician', 'Maintenance'),
        ('Maria Santos', 'maria@assetpro.com',   $1, 'technician', 'Maintenance')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, role
    `, [hash]);

    const [admin, manager, priya, david, maria] = users;
    console.log(`  ✓ ${users.length} users`);

    // ── Assets ─────────────────────────────────────────────
    const { rows: assets } = await client.query(`
      INSERT INTO assets (name, asset_code, serial_number, asset_type, status, location, running_hours, manufacturer, model, year, purchase_cost, created_by) VALUES
        ('Forklift Alpha',   'FLK-001', 'SN-001', 'forklift',   'active',      'Warehouse A', 1842, 'Toyota',      '8FBE25',   2019, 45000,  $1),
        ('Forklift Beta',    'FLK-006', 'SN-006', 'forklift',   'maintenance', 'Warehouse B',  915, 'Crown',       'FC5245',   2020, 52000,  $1),
        ('Heavy Hauler',     'TRK-003', 'SN-003', 'truck',      'maintenance', 'Yard East',   5220, 'Volvo',       'FH16',     2018, 120000, $1),
        ('Flatbed Sigma',    'TRK-009', 'SN-009', 'truck',      'active',      'Yard West',   4350, 'Scania',      'R450',     2021, 115000, $1),
        ('Excavator Pro',    'EXC-007', 'SN-007', 'excavator',  'active',      'Site B',      3104, 'Caterpillar', '320GC',    2017, 250000, $1),
        ('Overhead Crane',   'CRN-002', 'SN-002', 'crane',      'inactive',    'Warehouse A', 2240, 'Konecranes',  'CXT 5T',   2015, 180000, $1),
        ('Diesel Generator', 'GEN-012', 'SN-012', 'generator',  'active',      'Power Room',   788, 'Cummins',     'C150D5',   2022, 35000,  $1),
        ('Air Compressor',   'CMP-014', 'SN-014', 'compressor', 'active',      'Workshop',     620, 'Atlas Copco', 'GA22',     2023, 18000,  $1)
      ON CONFLICT (asset_code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, asset_code
    `, [admin.id]);

    const [flk001, flk006, trk003, trk009, exc007, crn002, gen012, cmp014] = assets;
    console.log(`  ✓ ${assets.length} assets`);

    // ── Maintenance Schedules ──────────────────────────────
    await client.query(`
      INSERT INTO maintenance_schedules (asset_id, name, interval_hours, last_service_hours, last_service_date) VALUES
        ($1, '500h Engine Service',      500, 1500, '2026-04-10'),
        ($2, '500h Full Service',        500,  500, '2026-03-15'),
        ($3, '500h Preventive Service',  500, 5000, '2026-05-01'),
        ($4, '500h Preventive Service',  500, 4000, '2026-05-20'),
        ($5, '500h Track & Engine',      500, 3000, '2026-05-05'),
        ($6, '1000h Crane Inspection',  1000, 2000, '2025-12-01'),
        ($7, '500h Generator Service',   500,  500, '2026-03-22'),
        ($8, '500h Compressor Service',  500,  500, '2026-04-18')
      ON CONFLICT DO NOTHING
    `, [flk001.id, flk006.id, trk003.id, trk009.id, exc007.id, crn002.id, gen012.id, cmp014.id]);
    console.log('  ✓ Maintenance schedules');

    // ── Spare Parts ────────────────────────────────────────
    const { rows: parts } = await client.query(`
      INSERT INTO spare_parts (name, sku, quantity, unit_cost, reorder_point, max_stock, supplier) VALUES
        ('Engine Oil Filter',   'ENG-OF-22',  14, 12.50, 10, 50, 'FleetParts Ltd'),
        ('Hydraulic Fluid 5L',  'HYD-FL-05',   3, 28.00,  8, 30, 'LubeXpress'),
        ('Drive Belt Set',      'DRV-BLT-A',   7, 45.00,  5, 20, 'BeltMaster Co'),
        ('Brake Pad Set',       'BRK-PD-44',   2, 89.00,  6, 24, 'SafeStop Parts'),
        ('Air Filter Primary',  'AIR-FLT-P',  18,  8.75, 10, 40, 'FleetParts Ltd'),
        ('Fuel Filter',         'FUL-FLT-3',   4, 15.00,  8, 32, 'FleetParts Ltd'),
        ('Coolant 5L',          'COL-5LTR',    1, 22.00,  5, 20, 'LubeXpress'),
        ('Grease Cartridge',    'GRS-CART',   22,  4.50, 12, 60, 'LubeXpress'),
        ('Forklift Tire',       'TIR-FL-200',  5,145.00,  4, 16, 'TireWorld'),
        ('Hydraulic Seal Kit',  'HYD-SK-A',    3, 67.00,  4, 12, 'SealTech')
      ON CONFLICT (sku) DO UPDATE SET quantity = EXCLUDED.quantity
      RETURNING id, name
    `);
    console.log(`  ✓ ${parts.length} spare parts`);

    // ── Work Orders ────────────────────────────────────────
    const woData = [
      { title:'500h hydraulic & filter service', assetId: flk001.id, assignedTo: priya.id,  priority:'critical', status:'open',        woType:'preventive',  est:4,   due:'2026-07-01' },
      { title:'Brake inspection & pad replace',  assetId: trk003.id, assignedTo: david.id,  priority:'high',     status:'in_progress', woType:'corrective',  est:6,   due:'2026-06-30' },
      { title:'Annual electrical systems check', assetId: exc007.id, assignedTo: maria.id,  priority:'normal',   status:'open',        woType:'inspection',  est:3,   due:'2026-07-05' },
      { title:'Oil & air filter replacement',    assetId: gen012.id, assignedTo: priya.id,  priority:'normal',   status:'completed',   woType:'preventive',  est:2,   due:'2026-06-18', actual:1.5 },
      { title:'Load cell calibration & test',    assetId: crn002.id, assignedTo: david.id,  priority:'high',     status:'completed',   woType:'inspection',  est:5,   due:'2026-06-15', actual:5.5 },
      { title:'Tire pressure check & alignment', assetId: trk009.id, assignedTo: maria.id,  priority:'low',      status:'open',        woType:'preventive',  est:2,   due:'2026-07-10' },
      { title:'Full 500h forklift service',      assetId: flk006.id, assignedTo: david.id,  priority:'high',     status:'in_progress', woType:'preventive',  est:4,   due:'2026-07-02' },
    ];

    for (const wo of woData) {
      const completedAt = wo.status === 'completed' ? `NOW() - INTERVAL '3 days'` : 'NULL';
      await client.query(`
        INSERT INTO work_orders (title, asset_id, assigned_to, created_by, priority, status, wo_type, estimated_hours, actual_hours, due_date, completed_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,${completedAt})
        ON CONFLICT DO NOTHING
      `, [wo.title, wo.assetId, wo.assignedTo, manager.id, wo.priority, wo.status, wo.woType, wo.est, wo.actual || null, wo.due]);
    }
    console.log(`  ✓ ${woData.length} work orders`);

    // ── Audit Logs ─────────────────────────────────────────
    await client.query(`
      INSERT INTO audit_logs (user_id, user_name, action, entity_type, field_name, old_value, new_value) VALUES
        ($1, 'Sarah Kim',   'CREATE',   'work_order', 'status',   NULL,          'open'),
        ($2, 'Priya Nair',  'UPDATE',   'work_order', 'status',   'open',        'in_progress'),
        ($1, 'Alex Davies', 'UPDATE',   'asset',      'status',   'active',      'maintenance'),
        ($3, 'David Chen',  'COMPLETE', 'work_order', 'status',   'in_progress', 'completed'),
        ($1, 'System',      'DEDUCT',   'spare_part', 'quantity', '16',          '14')
    `, [manager.id, priya.id, david.id]);
    console.log('  ✓ Audit logs');

    await client.query('COMMIT');
    console.log('\n✅ Seed complete!');
    console.log('\n🔑 Login credentials (password: Password123!)');
    console.log('   admin@assetpro.com   → Admin');
    console.log('   manager@assetpro.com → Manager');
    console.log('   priya@assetpro.com   → Technician');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
