import { requireAdminPage } from "@/lib/admin-auth";
import TeamClient from "./TeamClient";

export const dynamic = "force-dynamic";

export default async function AdminTeam() {
  await requireAdminPage("team");
  return <TeamClient />;
}
