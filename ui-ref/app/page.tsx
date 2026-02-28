import { redirect } from "next/navigation"

export default function Page() {
  // In production, check session/cookie and redirect accordingly.
  // For now, redirect to the dashboard (mock authenticated state).
  redirect("/dashboard")
}