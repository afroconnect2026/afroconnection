/** Documents an admin can ask a user to provide during verification. */
export const REQUESTABLE_DOCUMENTS = [
  'Government-issued ID (passport, national ID or driving licence)',
  'Business registration certificate',
  'Proof of address (utility bill or bank statement, last 3 months)',
  'Tax identification certificate',
  'Proof of role / employment letter',
  'Complete LinkedIn profile URL',
  'Company website',
] as const

export const VERIFICATION_BUCKET = 'verification-documents'
export const MAX_DOC_SIZE = 10 * 1024 * 1024
export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export interface VerificationDocument {
  path: string
  name: string
  type?: string
  size?: number
  uploaded_at?: string
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  info_needed: 'Info Needed',
  approved: 'Approved',
  rejected: 'Rejected',
  all: 'All',
}
