-- CreateTable
CREATE TABLE "Moderator" (
    "id" BIGSERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'moderator',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Moderator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Moderator_login_key" ON "Moderator"("login");

-- CreateIndex
CREATE UNIQUE INDEX "Moderator_telegramId_key" ON "Moderator"("telegramId");
