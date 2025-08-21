import { getAllCourses } from "@/lib/actions";
import { CoursesClientPage } from "./_components/client-page";

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <div className="container mx-auto py-10">
      <CoursesClientPage courses={courses} />
    </div>
  );
}