import { describe, expect, it, vi } from 'vitest';
import { createAuditService } from '../../src/services/audit.service.js';
import { silentLogger } from '../helpers.js';

const validEntry = {
  actor: 'support@orhaalacha.org',
  action: 'order.status_change',
  entityType: 'order',
  entityId: '1001',
  changes: { status: { from: 'paid', to: 'shipped' } },
};

function setup({ insert = vi.fn().mockResolvedValue() } = {}) {
  const logger = { ...silentLogger, error: vi.fn() };
  const auditService = createAuditService({ auditLogs: { insert }, logger });
  return { auditService, insert, logger };
}

describe('audit service', () => {
  it('stores a valid entry with a timestamp', async () => {
    const { auditService, insert } = setup();
    await auditService.record(validEntry);
    expect(insert).toHaveBeenCalledWith({ ...validEntry, timestamp: expect.any(Date) });
  });

  it.each([
    ['a missing actor', { actor: undefined }],
    ['a malformed action', { action: 'Update Book' }],
    ['an unknown field', { customerPhone: '0501234567' }],
    ['an operator as a change key', { changes: { $set: { from: 1, to: 2 } } }],
    ['a dotted change key', { changes: { 'address.city': { from: 'a', to: 'b' } } }],
  ])('rejects %s', async (_, overrides) => {
    const { auditService, insert } = setup();
    await expect(auditService.record({ ...validEntry, ...overrides })).rejects.toThrow();
    expect(insert).not.toHaveBeenCalled();
  });

  it('logs and swallows storage failures', async () => {
    const { auditService, logger } = setup({
      insert: vi.fn().mockRejectedValue(new Error('db down')),
    });
    await expect(auditService.record(validEntry)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
