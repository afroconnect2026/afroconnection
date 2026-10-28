'use client'

import ModerationList from '@/components/admin/ModerationList'
import EventFormModal from '@/components/admin/EventFormModal'

export default function AdminEventsPage() {
  return (
    <ModerationList
      contentType="event"
      renderModal={({ isOpen, onClose, item, onSuccess }) => (
        <EventFormModal isOpen={isOpen} onClose={onClose} event={item} onSuccess={onSuccess} />
      )}
    />
  )
}
