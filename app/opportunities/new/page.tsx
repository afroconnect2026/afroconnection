import { redirect } from 'next/navigation'

// Legacy route. The old form here wrote columns that do not exist
// (requirements, compensation, deadline). The maintained form is /opportunities/create.
export default function NewOpportunityRedirect() {
  redirect('/opportunities/create')
}
