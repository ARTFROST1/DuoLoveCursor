import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // create dev user with id 1 if not exists
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      telegramId: "dev_user_1",
      displayName: "Developer",
    },
  });
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

  // Seed Quiz Love questions
const quizQuestions = [
  {
    text: "Какой жанр фильма любит ваш партнёр?",
    options: ["Комедия", "Драма", "Боевик", "Фантастика"],
    order: 1,
  },
  {
    text: "Какой напиток выберет ваш партнёр утром?",
    options: ["Кофе", "Чай", "Смузи", "Вода"],
    order: 2,
  },
  {
    text: "Любимое время года вашего партнёра?",
    options: ["Весна", "Лето", "Осень", "Зима"],
    order: 3,
  },
  {
    text: "Какое домашнее животное больше нравится партнёру?",
    options: ["Собака", "Кошка", "Хомяк", "Попугай"],
    order: 4,
  },
  {
    text: "Выходной мечты партнёра — это…",
    options: ["Пляж", "Горы", "Городской тур", "Дома с книгой"],
    order: 5,
  },
];

for (const q of quizQuestions) {
  await prisma.quizQuestion.upsert({
    where: { id: q.order }, // simplistic: order as id if same
    update: {},
    create: {
      quizId: "quiz_love",
      text: q.text,
      optionsJson: q.options,
      order: q.order,
      isActive: true,
    },
  });
}

console.log(`Seeded ${games.length} games and ${quizQuestions.length} quiz questions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
