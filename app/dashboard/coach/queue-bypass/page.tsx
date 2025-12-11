// This page redirects to the main queue page
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/dashboard/coach/queue');
}
