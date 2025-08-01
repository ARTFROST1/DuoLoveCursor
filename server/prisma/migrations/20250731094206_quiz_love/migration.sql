-- CreateTable
CREATE TABLE "QuizProfile" (
    "userId" INTEGER NOT NULL,
    "quizId" TEXT NOT NULL,
    "answersJson" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "quizId"),
    CONSTRAINT "QuizProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quizId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "optionsJson" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
