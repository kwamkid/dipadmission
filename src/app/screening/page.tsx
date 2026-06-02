import { getScreeningData } from "@/lib/data";
import ScreeningBoard from "@/components/ScreeningBoard";

export const dynamic = "force-dynamic";

export default async function ScreeningPage() {
  const { candidates, slots } = await getScreeningData();
  return <ScreeningBoard candidates={candidates} slots={slots} />;
}
