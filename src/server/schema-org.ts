import type { SchemaOrgBlock, SchemaOrgResult } from '@/types/audit'

const LOCAL_BUSINESS_TYPES = new Set([
  'LocalBusiness',
  'Dentist',
  'MedicalBusiness',
  'MedicalClinic',
  'Physician',
  'RealEstateAgent',
  'Store',
  'ProfessionalService',
  'LegalService',
  'HomeAndConstructionBusiness',
])

/** Minimum properties we consider meaningful for each common type. */
const REQUIRED_PROPERTIES: Record<string, string[]> = {
  LocalBusiness: ['name', 'address'],
  Dentist: ['name', 'address'],
  MedicalBusiness: ['name', 'address'],
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  WebPage: ['name'],
  BreadcrumbList: ['itemListElement'],
  Article: ['headline', 'author', 'datePublished'],
  BlogPosting: ['headline', 'author', 'datePublished'],
  Product: ['name', 'offers'],
  FAQPage: ['mainEntity'],
  Service: ['name', 'provider'],
}

interface JsonLdNode {
  '@type'?: string | string[]
  '@graph'?: JsonLdNode[]
  [key: string]: unknown
}

function typesOf(node: JsonLdNode): string[] {
  const type = node['@type']
  if (typeof type === 'string') return [type]
  if (Array.isArray(type)) return type.filter((entry): entry is string => typeof entry === 'string')
  return []
}

function expectedType(type: string): string[] {
  if (REQUIRED_PROPERTIES[type]) return REQUIRED_PROPERTIES[type]!
  if (LOCAL_BUSINESS_TYPES.has(type)) return ['name', 'address']
  return ['name']
}

/**
 * Parse and validate JSON-LD blocks collected by the crawler.
 * This is a pragmatic structural check (JSON validity, schema.org context,
 * @type presence, key properties) — not a full Schema.org validator.
 */
export function analyzeSchemaOrg(rawBlocks: string[], businessType: string): SchemaOrgResult {
  const blocks: SchemaOrgBlock[] = []
  const types = new Set<string>()

  for (const raw of rawBlocks) {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      blocks.push({ type: 'Unparseable', valid: false, errors: ['JSON-LD block is not valid JSON'], propertyCount: 0 })
      continue
    }

    const nodes: JsonLdNode[] = []
    const walk = (value: unknown, depth = 0) => {
      if (depth > 5 || value === null || value === undefined) return
      if (Array.isArray(value)) {
        value.forEach((item) => walk(item, depth + 1))
        return
      }
      if (typeof value === 'object') {
        const node = value as JsonLdNode
        nodes.push(node)
        if (node['@graph']) walk(node['@graph'], depth + 1)
      }
    }
    walk(parsed)

    if (!nodes.length) {
      blocks.push({ type: 'Unknown', valid: false, errors: ['Block has no @type'], propertyCount: 0 })
      continue
    }

    for (const node of nodes) {
      const nodeTypes = typesOf(node)
      if (!nodeTypes.length) continue
      const primaryType = nodeTypes[0]!
      nodeTypes.forEach((type) => types.add(type))

      const errors: string[] = []
      const context = String(node['@context'] ?? '')
      if (context && !context.includes('schema.org')) errors.push('@context does not reference schema.org')
      const missing = expectedType(primaryType).filter((property) => node[property] === undefined)
      if (missing.length) errors.push(`Missing recommended properties: ${missing.join(', ')}`)

      const propertyCount = Object.keys(node).filter((key) => !key.startsWith('@')).length
      blocks.push({ type: primaryType, valid: errors.length === 0, errors, propertyCount })
    }
  }

  const validCount = blocks.filter((block) => block.valid).length
  const invalidCount = blocks.length - validCount
  const hasLocalBusiness = [...types].some((type) => LOCAL_BUSINESS_TYPES.has(type))

  return {
    blocks: blocks.slice(0, 20),
    types: [...types],
    validCount,
    invalidCount,
    hasLocalBusiness,
    suggestsLocalBusiness: !hasLocalBusiness && !/e-?commerce|saas|blog/i.test(businessType),
  }
}
