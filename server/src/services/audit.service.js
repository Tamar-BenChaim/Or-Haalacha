import { z } from 'zod';

const fieldName = z.string().regex(/^[A-Za-z0-9_]+$/);

// Callers must pass only business fields (price, stock, status...),
// never buyer details such as names, phones or addresses.
const auditEntrySchema = z.strictObject({
  actor: z.string().min(1).max(254),
  action: z.string().regex(/^[a-z]+(\.[a-z_]+)+$/),
  entityType: z.string().regex(/^[a-z_]{1,50}$/),
  entityId: z.string().min(1).max(100).optional(),
  changes: z.record(fieldName, z.strictObject({ from: z.unknown(), to: z.unknown() })).optional(),
  requestId: z.string().max(100).optional(),
});

/**
 * Records business actions (who did what to which entity) in the audit log.
 * An invalid entry is a programming error and throws; a storage failure is
 * logged and swallowed so it never fails the action being audited.
 */
export function createAuditService({ auditLogs, logger, now = () => new Date() }) {
  return {
    async record(entry) {
      const parsed = auditEntrySchema.parse(entry);
      try {
        await auditLogs.insert({ ...parsed, timestamp: now() });
      } catch (err) {
        logger.error({ err, action: parsed.action }, 'failed to save audit log');
      }
    },
  };
}
