// ── Mock the database so tests don't need a real PostgreSQL connection ──────
jest.mock('../src/config/database', () => ({
  query:     jest.fn(),
  getClient: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
  pool:      { on: jest.fn() },
}));

jest.mock('../src/repositories/workOrderRepository');
const woRepo    = require('../src/repositories/workOrderRepository');
const woService = require('../src/services/workOrderService');

const admin   = { id: 'admin-1',   name: 'Alex',  role: 'admin' };
const manager = { id: 'mgr-1',     name: 'Sarah', role: 'manager' };
const tech    = { id: 'tech-1',    name: 'Priya', role: 'technician' };
const otherTech = { id: 'tech-2',  name: 'David', role: 'technician' };

const mockWO = {
  id: 'wo-1', wo_number: 'WO-1001', title: '500h service',
  status: 'open', priority: 'normal',
  asset_id: 'asset-1', assigned_to: 'tech-1', created_by: 'mgr-1',
};

describe('WorkOrderService — RBAC', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getAll ──────────────────────────────────────────────────
  describe('getAll()', () => {
    it('admin receives all WOs — no assignedTo filter', async () => {
      woRepo.findAll.mockResolvedValue([mockWO]);
      await woService.getAll({}, admin);
      expect(woRepo.findAll).toHaveBeenCalledWith(
        expect.not.objectContaining({ assignedTo: admin.id })
      );
    });

    it('technician only receives their own WOs', async () => {
      woRepo.findAll.mockResolvedValue([mockWO]);
      await woService.getAll({}, tech);
      expect(woRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ assignedTo: tech.id })
      );
    });
  });

  // ── create ──────────────────────────────────────────────────
  describe('create()', () => {
    it('manager can create a work order', async () => {
      woRepo.create.mockResolvedValue(mockWO);
      await woService.create({ title: 'Test', assetId: 'a1' }, manager);
      expect(woRepo.create).toHaveBeenCalled();
    });

    it('technician CANNOT create a work order → 403', async () => {
      await expect(async () => woService.create({ title: 'Test' }, tech))
        .rejects.toMatchObject({ statusCode: 403 });
      expect(woRepo.create).not.toHaveBeenCalled();
    });
  });

  // ── getById ─────────────────────────────────────────────────
  describe('getById()', () => {
    it('technician can view their own WO', async () => {
      woRepo.findById.mockResolvedValue(mockWO);
      const result = await woService.getById('wo-1', tech);
      expect(result).toEqual(mockWO);
    });

    it("technician CANNOT view another tech's WO → 403", async () => {
      woRepo.findById.mockResolvedValue(mockWO); // assigned_to = tech-1
      await expect(woService.getById('wo-1', otherTech))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    it('admin can view any WO', async () => {
      woRepo.findById.mockResolvedValue(mockWO);
      const result = await woService.getById('wo-1', admin);
      expect(result).toBeDefined();
    });

    it('returns 404 for non-existent WO', async () => {
      woRepo.findById.mockResolvedValue(null);
      await expect(woService.getById('bad-id', admin))
        .rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ── complete ─────────────────────────────────────────────────
  describe('complete() — business logic', () => {
    it('technician can complete their own WO', async () => {
      woRepo.findById.mockResolvedValue(mockWO);
      woRepo.complete.mockResolvedValue({ ...mockWO, status: 'completed', actual_hours: 3 });

      const result = await woService.complete('wo-1', { actualHours: 3 }, tech);
      expect(result.status).toBe('completed');
      expect(woRepo.complete).toHaveBeenCalledWith('wo-1',
        expect.objectContaining({ actualHours: 3, userId: tech.id, userName: tech.name })
      );
    });

    it("technician CANNOT complete another tech's WO → 403", async () => {
      woRepo.findById.mockResolvedValue(mockWO); // assigned_to = tech-1
      await expect(woService.complete('wo-1', { actualHours: 2 }, otherTech))
        .rejects.toMatchObject({ statusCode: 403 });
    });

    it('admin can complete any WO', async () => {
      woRepo.findById.mockResolvedValue(mockWO);
      woRepo.complete.mockResolvedValue({ ...mockWO, status: 'completed' });
      await expect(woService.complete('wo-1', { actualHours: 4 }, admin)).resolves.toBeDefined();
    });
  });

  // ── update RBAC ──────────────────────────────────────────────
  describe('update() — RBAC field restrictions', () => {
    it('technician cannot change priority or reassign WO', async () => {
      woRepo.findById.mockResolvedValue(mockWO);
      woRepo.update.mockResolvedValue(mockWO);

      await woService.update('wo-1', {
        status:     'in_progress',
        priority:   'critical',    // should be stripped
        assignedTo: 'other-tech',  // should be stripped
      }, tech);

      expect(woRepo.update).toHaveBeenCalledWith('wo-1',
        expect.objectContaining({ status: 'in_progress' })
      );
      expect(woRepo.update).toHaveBeenCalledWith('wo-1',
        expect.not.objectContaining({ priority: 'critical', assignedTo: 'other-tech' })
      );
    });
  });
});
