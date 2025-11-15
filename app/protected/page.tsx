import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  // Redirect to home page - this page is no longer needed
  redirect("/");
}

