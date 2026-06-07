import { redirect } from 'next/navigation'

export default function CreateUserRedirectPage() {
  redirect('/admin/users/create')
}
