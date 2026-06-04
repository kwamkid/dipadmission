import { getWinners, getLeads } from "@/lib/data";
import FinalBoard from "@/components/FinalBoard";

export const dynamic = "force-dynamic";

export default async function FinalPage() {
  const [winners, leads] = await Promise.all([getWinners(), getLeads()]);
  const phones = new Set(winners.map((c) => c.phone).filter(Boolean) as string[]);
  const companyAddress: Record<string, string> = {};
  for (const l of leads) {
    if (l.phoneNorm && phones.has(l.phoneNorm) && l.companyAddress) {
      companyAddress[l.phoneNorm] = l.companyAddress;
    }
  }
  return <FinalBoard winners={winners} companyAddress={companyAddress} />;
}
