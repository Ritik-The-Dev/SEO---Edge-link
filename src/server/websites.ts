import { prisma } from '@/lib/db'
import { HttpError, notFound } from '@/lib/api'
import { UrlValidationError, normalizeHttpUrl } from '@/lib/urls'
import type { WebsiteStatus } from '@prisma/client'

export function normalizeWebsiteUrlOrThrow(raw: string): string {
  try {
    return normalizeHttpUrl(raw).toString()
  } catch (error) {
    if (error instanceof UrlValidationError) {
      throw new HttpError(422, error.message, error.code)
    }
    throw error
  }
}

export async function createWebsite(input: {
  clientId: string
  url: string
  label?: string
  businessType: string
  city: string
  state: string
  country?: string
}) {
  const client = await prisma.client.findUnique({ where: { id: input.clientId } })
  if (!client) throw notFound('Client not found')

  return prisma.website.create({
    data: {
      clientId: input.clientId,
      url: normalizeWebsiteUrlOrThrow(input.url),
      label: input.label ?? null,
      businessType: input.businessType,
      city: input.city,
      state: input.state,
      country: input.country ?? 'India',
    },
  })
}

export async function updateWebsite(
  id: string,
  input: {
    url?: string
    label?: string
    businessType?: string
    city?: string
    state?: string
    country?: string
    status?: WebsiteStatus
  },
) {
  const existing = await prisma.website.findUnique({ where: { id } })
  if (!existing) throw notFound('Website not found')

  return prisma.website.update({
    where: { id },
    data: {
      ...(input.url !== undefined ? { url: normalizeWebsiteUrlOrThrow(input.url) } : {}),
      ...(input.label !== undefined ? { label: input.label ?? null } : {}),
      ...(input.businessType !== undefined ? { businessType: input.businessType } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  })
}
