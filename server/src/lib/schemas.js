import { z } from 'zod';

/** Permanent address of a book or bundle: lowercase letters, digits and single dashes. */
export const slugSchema = z
  .string()
  .max(100)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Invalid address');
