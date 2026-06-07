import { redirect } from 'next/navigation'

export default function CreatePostRedirectPage() {
  redirect('/admin/posts/create')
}
