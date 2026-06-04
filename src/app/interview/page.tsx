import { getInterviewees, getLeads } from "@/lib/data";
import type { LeadDTO } from "@/lib/types";
import InterviewBoard from "@/components/InterviewBoard";

export const dynamic = "force-dynamic";

export default async function InterviewPage() {
  const [candidates, leads] = await Promise.all([getInterviewees(), getLeads()]);
  const phones = new Set(candidates.map((c) => c.phone).filter(Boolean) as string[]);
  const leadByPhone: Record<string, LeadDTO> = {};
  for (const l of leads) if (l.phoneNorm && phones.has(l.phoneNorm)) leadByPhone[l.phoneNorm] = l;
  return <InterviewBoard candidates={candidates} leadByPhone={leadByPhone} />;
}
