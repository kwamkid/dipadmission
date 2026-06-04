import { getWinners } from "@/lib/data";
import FinalBoard from "@/components/FinalBoard";

export const dynamic = "force-dynamic";

export default async function FinalPage() {
  const winners = await getWinners();
  return <FinalBoard winners={winners} />;
}
