-- CreateTable
CREATE TABLE "OpenAi" (
    "id" SERIAL NOT NULL,
    "maxRequests" INTEGER NOT NULL,
    "promt" TEXT NOT NULL,

    CONSTRAINT "OpenAi_pkey" PRIMARY KEY ("id")
);
