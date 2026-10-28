'use client'

import { useParams } from 'next/navigation'
import EventForm from '@/components/events/EventForm'

export default function EditEventPage() {
  const params = useParams()
  return <EventForm eventId={params.id as string} />
}
