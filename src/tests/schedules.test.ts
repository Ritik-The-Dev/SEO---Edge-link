import { describe, expect, it } from 'vitest'
import { nextMonthlyRun } from '@/server/schedules'

describe('nextMonthlyRun', () => {
  it('uses the current month when the day is still ahead', () => {
    const from = new Date('2026-10-05T00:00:00.000Z')
    expect(nextMonthlyRun(15, 3, from).toISOString()).toBe('2026-10-15T03:00:00.000Z')
  })

  it('rolls into the next month when the day has passed', () => {
    const from = new Date('2026-10-29T00:00:00.000Z')
    expect(nextMonthlyRun(1, 3, from).toISOString()).toBe('2026-11-01T03:00:00.000Z')
  })

  it('rolls into the next month when the time is the same day but later', () => {
    const from = new Date('2026-10-15T04:00:00.000Z')
    expect(nextMonthlyRun(15, 3, from).toISOString()).toBe('2026-11-15T03:00:00.000Z')
  })

  it('handles December → January rollover', () => {
    const from = new Date('2026-12-20T00:00:00.000Z')
    expect(nextMonthlyRun(5, 9, from).toISOString()).toBe('2027-01-05T09:00:00.000Z')
  })

  it('clamps day 31 to 28 so February is never skipped', () => {
    const from = new Date('2027-01-30T00:00:00.000Z')
    expect(nextMonthlyRun(31, 3, from).toISOString()).toBe('2027-02-28T03:00:00.000Z')
  })

  it('clamps invalid hours into the UTC day', () => {
    const from = new Date('2026-10-05T00:00:00.000Z')
    expect(nextMonthlyRun(10, 99, from).toISOString()).toBe('2026-10-10T23:00:00.000Z')
  })
})
