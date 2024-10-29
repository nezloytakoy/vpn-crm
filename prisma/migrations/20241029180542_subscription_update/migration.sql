/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Subscription_name_key" ON "Subscription"("name");
