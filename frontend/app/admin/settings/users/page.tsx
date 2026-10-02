import { redirect } from "next/navigation";

// Old address of the team page.
export default function OldAdminUsers() {
  redirect("/admin/team");
}
