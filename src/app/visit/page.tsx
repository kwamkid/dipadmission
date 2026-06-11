import { getVisitList } from "@/lib/data";
import VisitBoard from "@/components/VisitBoard";

export const dynamic = "force-dynamic";

export default async function VisitPage() {
  const items = await getVisitList();
  return <VisitBoard items={items} />;
}
