import { eventQueries } from '@/features/events/queries'
import { programQueries } from '@/features/programs/queries'
import { EventsManager } from './components/EventsManager'

export default async function AdminEventsPage() {
  const [allEvents, programs] = await Promise.all([
    eventQueries.getEvents(undefined, 0, 100),
    programQueries.getProgramsForCalendar(),
  ])

  return (
    <EventsManager
      initialEvents={allEvents.map((event) => ({
        id: event.id,
        programId: event.programId,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        status: event.status,
        program: event.program
          ? {
              id: event.program.id,
              name: event.program.name,
            }
          : null,
      }))}
      programs={programs.map((program) => ({
        id: program.id,
        name: program.name,
        department: program.department
          ? {
              name: program.department.name,
            }
          : null,
      }))}
    />
  )
}
