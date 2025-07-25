import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const games = [
    {
      slug: "quiz_love",
      title: "Love Quiz",
      category: "quiz",
      description: "Викторина о партнёре и отношениях.",
    },
    {
      slug: "reaction_duo",
      title: "Fast Reaction",
      category: "reaction",
      description: "Мини-игра на реакцию: кто быстрее нажмёт?",
    },
    {
      slug: "association_match",
      title: "Word Association",
      category: "association",
      description: "Подберите одинаковые ассоциации с партнёром.",
    },
    {
      slug: "memory_pairs",
      title: "Memory Pairs",
      category: "memory",
      description: "Классическая игра в пары на запоминание.",
    },
    {
      slug: "cooperative_puzzle",
      title: "Co-op Puzzle",
      category: "cooperative",
      description: "Решайте головоломку вместе в реальном времени.",
    },
  ];

  for (const g of games) {
    await prisma.game.upsert({
      where: { slug: g.slug },
      update: {},
      create: {
        ...g,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${games.length} games.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
