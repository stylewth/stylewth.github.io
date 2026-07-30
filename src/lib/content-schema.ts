import { z } from 'astro/zod';

export const elsewhereDateSchema = z.iso.date().transform(
  (value) => new Date(`${value}T00:00:00.000Z`),
);
