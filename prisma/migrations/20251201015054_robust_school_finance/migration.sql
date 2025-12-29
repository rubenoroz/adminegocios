/*
  Warnings:

  - You are about to drop the `SchoolFeeType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `feeTypeId` on the `StudentFee` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SchoolFeeType";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SchoolFeeTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "recurrence" TEXT NOT NULL,
    "dayDue" INTEGER,
    "lateFee" REAL,
    "businessId" TEXT NOT NULL,
    CONSTRAINT "SchoolFeeTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "percentage" REAL,
    "amount" REAL,
    "studentId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Scholarship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudentFee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "studentId" TEXT NOT NULL,
    "templateId" TEXT,
    "originalAmount" REAL,
    "discountApplied" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentFee_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SchoolFeeTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StudentFee" ("amount", "createdAt", "dueDate", "id", "status", "studentId", "title", "updatedAt") SELECT "amount", "createdAt", "dueDate", "id", "status", "studentId", "title", "updatedAt" FROM "StudentFee";
DROP TABLE "StudentFee";
ALTER TABLE "new_StudentFee" RENAME TO "StudentFee";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
