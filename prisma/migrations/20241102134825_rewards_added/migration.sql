-- CreateTable
CREATE TABLE "Rewards" (
    "id" SERIAL NOT NULL,
    "userReward" INTEGER NOT NULL,
    "mentorReward" INTEGER NOT NULL,
    "assistantReward" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rewards_pkey" PRIMARY KEY ("id")
);
