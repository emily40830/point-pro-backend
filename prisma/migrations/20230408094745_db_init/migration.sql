-- CreateTable
CREATE TABLE "member" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "account" VARCHAR(50) NOT NULL,
    "passhash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);
