import { redirect } from 'next/navigation';

export default function CoursesPage() {
  // Redirect obsolete mega-courses catalog directly to track cards on Home page
  redirect('/#tracks');
}
