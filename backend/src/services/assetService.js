const assetRepo = require('../repositories/assetRepository');
const { query } = require('../config/database');

const getAll = (filters) => assetRepo.findAll(filters);

const getById = async (id) => {
  const asset = await assetRepo.findById(id);
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });
  return asset;
};

const create = async (data, userId) => {
  const asset = await assetRepo.create({ ...data, createdBy: userId });
  // Audit log
  await query(
    `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, field_name, new_value)
     VALUES ($1, $2, 'CREATE', 'asset', $3, 'status', $4)`,
    [userId, data.createdByName || 'Admin', asset.id, asset.status]
  );
  return asset;
};

const update = async (id, updates, userId, userName) => {
  const existing = await assetRepo.findById(id);
  if (!existing) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });

  const asset = await assetRepo.update(id, updates);

  if (updates.status && updates.status !== existing.status) {
    await query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, field_name, old_value, new_value)
       VALUES ($1,$2,'UPDATE','asset',$3,'status',$4,$5)`,
      [userId, userName, id, existing.status, updates.status]
    );
  }
  return asset;
};

const getDueForMaintenance = () => assetRepo.findDueForMaintenance();
const getStatusCounts      = () => assetRepo.getStatusCounts();

module.exports = { getAll, getById, create, update, getDueForMaintenance, getStatusCounts };
