import { notFound } from "next/navigation";
import { getVisitItem } from "@/lib/data";
import VisitForm from "@/components/VisitForm";

export const dynamic = "force-dynamic";

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getVisitItem(id);
  if (!item) notFound();
  return <VisitForm item={item} />;
}
