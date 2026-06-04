import { getLeads } from "@/lib/data";
import ApplicantsBoard from "@/components/ApplicantsBoard";

export const dynamic = "force-dynamic";

export default async function ApplicantsPage() {
  const leads = await getLeads();
  return <ApplicantsBoard leads={leads} />;
}
