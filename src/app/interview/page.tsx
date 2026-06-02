import { getInterviewees } from "@/lib/data";
import InterviewBoard from "@/components/InterviewBoard";

export const dynamic = "force-dynamic";

export default async function InterviewPage() {
  const candidates = await getInterviewees();
  return <InterviewBoard candidates={candidates} />;
}
