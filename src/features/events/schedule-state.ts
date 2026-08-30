export type EventScheduleState = 'UPCOMING' | 'DUE' | 'PAST_DUE'

/**
 * Schedule state is derived from planned dates only. It must never be used as
 * evidence that an agenda was actually executed.
 */
export function getEventScheduleState(
  startDate: Date,
  endDate: Date,
  now: Date,
): EventScheduleState {
  if (now < startDate) return 'UPCOMING'
  if (now > endDate) return 'PAST_DUE'
  return 'DUE'
}

export function requiresStatusConfirmation(scheduleState: EventScheduleState) {
  return scheduleState === 'PAST_DUE'
}
