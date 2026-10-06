const woRepo = require('../repositories/workOrderRepository');

const getAll = (filters, user) => {
  // Technicians only see their own assigned WOs
  if (user.role === 'technician') {
    filters = { ...filters, assignedTo: user.id };
  }
  return woRepo.findAll(filters);
};

const getById = async (id, user) => {
  const wo = await woRepo.findById(id);
  if (!wo) throw Object.assign(new Error('Work order not found'), { statusCode: 404 });

  if (user.role === 'technician' && wo.assigned_to !== user.id) {
    throw Object.assign(new Error('You can only view your own assigned work orders'), { statusCode: 403 });
  }
  return wo;
};

const create = (data, user) => {
  if (user.role === 'technician') {
    throw Object.assign(new Error('Technicians cannot create work orders'), { statusCode: 403 });
  }
  return woRepo.create({ ...data, createdBy: user.id });
};

const update = async (id, updates, user) => {
  const wo = await woRepo.findById(id);
  if (!wo) throw Object.assign(new Error('Work order not found'), { statusCode: 404 });

  if (user.role === 'technician') {
    if (wo.assigned_to !== user.id) {
      throw Object.assign(new Error('You can only update your own assigned work orders'), { statusCode: 403 });
    }
    // Technicians cannot reassign or change priority
    delete updates.assignedTo;
    delete updates.priority;
  }
  return woRepo.update(id, updates);
};

const complete = async (id, data, user) => {
  const wo = await woRepo.findById(id);
  if (!wo) throw Object.assign(new Error('Work order not found'), { statusCode: 404 });

  if (user.role === 'technician' && wo.assigned_to !== user.id) {
    throw Object.assign(new Error('You can only complete your own assigned work orders'), { statusCode: 403 });
  }
  return woRepo.complete(id, { ...data, userId: user.id, userName: user.name });
};

const getStatusCounts = () => woRepo.getStatusCounts();

module.exports = { getAll, getById, create, update, complete, getStatusCounts };
