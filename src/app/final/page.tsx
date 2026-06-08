import { getWinners, getLeads } from "@/lib/data";
import FinalBoard from "@/components/FinalBoard";

export const dynamic = "force-dynamic";

export default async function FinalPage() {
  const [winners, leads] = await Promise.all([getWinners(), getLeads()]);
  const phones = new Set(winners.map((c) => c.phone).filter(Boolean) as string[]);
  const companyAddress: Record<string, string> = {};
  const emailByPhone: Record<string, string> = {};
  for (const l of leads) {
    if (l.phoneNorm && phones.has(l.phoneNorm)) {
      if (l.companyAddress) companyAddress[l.phoneNorm] = l.companyAddress;
      if (l.email) emailByPhone[l.phoneNorm] = l.email;
    }
  }
  return <FinalBoard winners={winners} companyAddress={companyAddress} emailByPhone={emailByPhone} />;
}
