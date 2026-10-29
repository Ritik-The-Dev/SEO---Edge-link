import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError, type ZodTypeAny, type z } from 'zod'
import { logger } from './logger'

export class HttpError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, message: string, code = 'REQUEST_FAILED', details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const unauthorized = (message = 'Sign in to continue') =>
  new HttpError(401, message, 'UNAUTHENTICATED')
export const forbidden = (message = 'You do not have access to this resource') =>
  new HttpError(403, message, 'FORBIDDEN')
export const notFound = (message = 'Not found') => new HttpError(404, message, 'NOT_FOUND')
export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, 'BAD_REQUEST', details)

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

type RouteContext = { params: Record<string, string | string[] | undefined> }

/**
 * Wraps a route handler with uniform error handling. Internal error details are
 * logged server-side and never returned to the browser.
 */
export function route<C extends RouteContext = RouteContext>(
  handler: (request: Request, context: C) => Promise<Response>,
) {
  return async (request: Request, context: C): Promise<Response> => {
    try {
      return await handler(request, context)
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json(
          { error: { message: error.message, code: error.code, details: error.details ?? undefined } },
          { status: error.status, headers: { 'Cache-Control': 'no-store' } },
        )
      }
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              message: 'Some fields need attention',
              code: 'VALIDATION_ERROR',
              details: error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
              })),
            },
          },
          { status: 422, headers: { 'Cache-Control': 'no-store' } },
        )
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return NextResponse.json(
            { error: { message: 'That record already exists', code: 'CONFLICT' } },
            { status: 409, headers: { 'Cache-Control': 'no-store' } },
          )
        }
        if (error.code === 'P2025') {
          return NextResponse.json(
            { error: { message: 'Record not found', code: 'NOT_FOUND' } },
            { status: 404, headers: { 'Cache-Control': 'no-store' } },
          )
        }
      }
      logger.error('Unhandled API error', {
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 4).join(' | ') : undefined,
      })
      return NextResponse.json(
        { error: { message: 'Something went wrong on our side', code: 'INTERNAL_ERROR' } },
        { status: 500, headers: { 'Cache-Control': 'no-store' } },
      )
    }
  }
}

/** Parse and validate a JSON body, throwing a 422 on failure. */
export async function parseBody<S extends ZodTypeAny>(request: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    throw badRequest('Expected a JSON request body')
  }
  return schema.parse(raw)
}

/** Orders an audit/website list deterministically (newest first). */
export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null
}
