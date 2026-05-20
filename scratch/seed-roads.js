const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const initialRoads = [
    {
      slug: "beginner",
      title: "初任者ロード",
      description: "新しい環境での学びや日々の小さな気づきを記録します。",
      icon: "🌱",
      isActive: true,
    },
    {
      slug: "side-hustle",
      title: "副業ロード",
      description: "本業とは別の挑戦や、プロジェクトの進行状況を記録します。",
      icon: "💻",
      isActive: true,
    },
    {
      slug: "resignation",
      title: "退職ロード",
      description: "次のステップへ向けた準備や、感情の整理を記録します。",
      icon: "🚪",
      isActive: true,
    },
  ];

  console.log("Seeding roads...");

  for (const road of initialRoads) {
    const existing = await prisma.road.findUnique({
      where: { slug: road.slug }
    });

    if (!existing) {
      await prisma.road.create({
        data: road
      });
      console.log(`Created road: ${road.title}`);
    } else {
      // Update description/icon if already exists
      await prisma.road.update({
        where: { slug: road.slug },
        data: {
          title: road.title,
          description: road.description,
          icon: road.icon,
        }
      });
      console.log(`Updated existing road: ${road.title}`);
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
