-- Preserve the feedback attached to options and tokens when the normalized
-- catalog is read back through Prisma.
ALTER TABLE "ActivityVersionOption" ADD COLUMN "feedback" TEXT;
ALTER TABLE "ActivityVersionToken" ADD COLUMN "feedback" TEXT;
