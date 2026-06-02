import { PrismaClient } from "@prisma/client";
import { buildAllSlots } from "../src/lib/slots";

const prisma = new PrismaClient();

async function main() {
  const slots = buildAllSlots();
  for (const s of slots) {
    await prisma.interviewSlot.upsert({
      where: { day_slotNo: { day: new Date(s.day), slotNo: s.slotNo } },
      update: { label: s.label, startTime: s.startTime, endTime: s.endTime },
      create: {
        day: new Date(s.day),
        slotNo: s.slotNo,
        label: s.label,
        startTime: s.startTime,
        endTime: s.endTime,
      },
    });
  }
  console.log(`✅ seeded ${slots.length} interview slots`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
