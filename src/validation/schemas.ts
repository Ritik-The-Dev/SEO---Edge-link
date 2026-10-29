import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

const optionalText = (max = 300) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined))

export const clientCreateSchema = z.object({
  name: z.string().trim().min(2, 'Client name is required').max(120),
  company: optionalText(160),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid contact email')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: optionalText(40),
  notes: optionalText(2000),
  portal: z
    .object({
      email: z.string().trim().toLowerCase().email('Portal email must be valid'),
      password: z.string().min(8, 'Portal password must be at least 8 characters').max(200),
      name: z.string().trim().min(2).max(120),
    })
    .optional(),
})

export const clientUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  company: optionalText(160),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid contact email')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: optionalText(40),
  notes: optionalText(2000),
  isActive: z.boolean().optional(),
})

export const websiteCreateSchema = z.object({
  clientId: z.string().min(1, 'Choose a client'),
  url: z.string().trim().min(3, 'Enter the website URL').max(2048),
  label: optionalText(120),
  businessType: z.string().trim().min(2, 'Business type is required').max(120),
  city: z.string().trim().min(1, 'City is required').max(120),
  state: z.string().trim().min(1, 'State is required').max(120),
  country: z.string().trim().min(1).max(120).optional(),
})

export const websiteUpdateSchema = z.object({
  url: z.string().trim().min(3).max(2048).optional(),
  label: optionalText(120),
  businessType: z.string().trim().min(2).max(120).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  state: z.string().trim().min(1).max(120).optional(),
  country: z.string().trim().min(1).max(120).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
})

export const auditCreateSchema = z.object({
  websiteId: z.string().min(1, 'Choose a website'),
})

export const scheduleSchema = z.object({
  websiteId: z.string().min(1, 'Choose a website'),
  dayOfMonth: z.coerce.number().int().min(1, 'Day must be 1–28').max(28, 'Day must be 1–28'),
  hourUtc: z.coerce.number().int().min(0).max(23),
  isEnabled: z.boolean().default(true),
})

export const scheduleUpdateSchema = z.object({
  dayOfMonth: z.coerce.number().int().min(1).max(28).optional(),
  hourUtc: z.coerce.number().int().min(0).max(23).optional(),
  isEnabled: z.boolean().optional(),
})
