/*
  Warnings:

  - You are about to drop the column `maxScore` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Grade` table. All the data in the column will be lost.
  - Added the required column `period` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Grade` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Grade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "maxValue" REAL NOT NULL DEFAULT 100,
    "weight" REAL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Grade_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Grade" ("courseId", "id", "studentId", "weight") SELECT "courseId", "id", "studentId", "weight" FROM "Grade";
DROP TABLE "Grade";
ALTER TABLE "new_Grade" RENAME TO "Grade";
CREATE UNIQUE INDEX "Grade_studentId_courseId_period_type_key" ON "Grade"("studentId", "courseId", "period", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
