import { ObjectId } from 'mongodb';
import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid id');

export const toObjectId = (id) => new ObjectId(id);
