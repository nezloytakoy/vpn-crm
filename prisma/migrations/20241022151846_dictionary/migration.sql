-- CreateTable
CREATE TABLE "DictionaryEntry" (
    "id" BIGSERIAL NOT NULL,
    "word" VARCHAR(255) NOT NULL,
    "language" VARCHAR(50) NOT NULL,
    "dictionary" VARCHAR(100) NOT NULL,

    CONSTRAINT "DictionaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_word" ON "DictionaryEntry"("word");

-- CreateIndex
CREATE INDEX "idx_language" ON "DictionaryEntry"("language");

-- CreateIndex
CREATE INDEX "idx_word_language" ON "DictionaryEntry"("word", "language");
