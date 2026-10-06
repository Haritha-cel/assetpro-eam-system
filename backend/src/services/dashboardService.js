const dashRepo = require('../repositories/dashboardRepository');

const getSummary   = () => dashRepo.getSummary();
const getRecentAudit = (limit) => dashRepo.getRecentAudit(limit);

module.exports = { getSummary, getRecentAudit };
