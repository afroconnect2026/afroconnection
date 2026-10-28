'use client'

import ModerationList from '@/components/admin/ModerationList'
import OpportunityFormModal from '@/components/admin/OpportunityFormModal'

export default function AdminOpportunitiesPage() {
  return (
    <ModerationList
      contentType="opportunity"
      renderModal={({ isOpen, onClose, item, onSuccess }) => (
        <OpportunityFormModal isOpen={isOpen} onClose={onClose} opportunity={item} onSuccess={onSuccess} />
      )}
    />
  )
}
