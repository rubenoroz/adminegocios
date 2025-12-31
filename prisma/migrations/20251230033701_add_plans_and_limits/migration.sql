/*
  Warnings:

  - You are about to drop the column `birthDate` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `guardianName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `guardianPhone` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,courseId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Attendance_date_studentId_courseId_key";

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "interval" TEXT NOT NULL DEFAULT 'monthly',
    "maxCourses" INTEGER DEFAULT 2,
    "maxTeachers" INTEGER DEFAULT 2,
    "maxStudents" INTEGER DEFAULT 3,
    "maxBranches" INTEGER DEFAULT 1,
    "maxInventoryItems" INTEGER DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduledPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "studentId" TEXT,
    "feeTemplateId" TEXT,
    "employeeId" TEXT,
    "recurrence" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "nextRunDate" DATETIME NOT NULL,
    "dayOfMonth" INTEGER,
    "dayOfWeek" INTEGER,
    "customDays" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" DATETIME,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduledPayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduledPayment_feeTemplateId_fkey" FOREIGN KEY ("feeTemplateId") REFERENCES "SchoolFeeTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduledPayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduledPayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParentAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParentAccount_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentParent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT,
    "classroomId" TEXT,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClassSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassSchedule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ClassSchedule_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ClassSchedule_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassSchedule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "building" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Classroom_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "targetType" TEXT NOT NULL DEFAULT 'ALL',
    "targetId" TEXT,
    "attachments" TEXT,
    "businessId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Announcement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SchoolEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "location" TEXT,
    "type" TEXT NOT NULL DEFAULT 'ACTIVITY',
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SchoolEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommissionSettlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "note" TEXT,
    "employeeId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommissionSettlement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommissionSettlement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoOrientation" TEXT DEFAULT 'SQUARE',
    "primaryColor" TEXT DEFAULT '#3b82f6',
    "sidebarColor" TEXT DEFAULT '#0f172a',
    "logoHeight" INTEGER DEFAULT 64,
    "gradingConfig" TEXT,
    "planId" TEXT DEFAULT 'free',
    "coursesCount" INTEGER NOT NULL DEFAULT 0,
    "teachersCount" INTEGER NOT NULL DEFAULT 0,
    "studentsCount" INTEGER NOT NULL DEFAULT 0,
    "inventoryCount" INTEGER NOT NULL DEFAULT 0,
    "expenseReservePercentage" REAL DEFAULT 0,
    "benefitsReservePercentage" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Business_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Business" ("createdAt", "id", "logoHeight", "logoOrientation", "logoUrl", "name", "primaryColor", "sidebarColor", "type", "updatedAt") SELECT "createdAt", "id", "logoHeight", "logoOrientation", "logoUrl", "name", "primaryColor", "sidebarColor", "type", "updatedAt" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gradeLevel" TEXT,
    "schedule" TEXT,
    "room" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "teacherId" TEXT,
    "classroomId" TEXT,
    CONSTRAINT "Course_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Course_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("branchId", "businessId", "description", "gradeLevel", "id", "name", "room", "schedule", "teacherId") SELECT "branchId", "businessId", "description", "gradeLevel", "id", "name", "room", "schedule", "teacherId" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE INDEX "Course_businessId_idx" ON "Course"("businessId");
CREATE INDEX "Course_teacherId_idx" ON "Course"("teacherId");
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "paymentModel" TEXT NOT NULL DEFAULT 'FIXED',
    "salary" REAL,
    "hourlyRate" REAL,
    "commissionPercentage" REAL,
    "reservePercentage" REAL,
    "paymentFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "paymentDay" INTEGER,
    "lastPaymentDate" DATETIME,
    "hireDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    CONSTRAINT "Employee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("branchId", "businessId", "email", "firstName", "hireDate", "id", "lastName", "phone", "role", "salary") SELECT "branchId", "businessId", "email", "firstName", "hireDate", "id", "lastName", "phone", "role", "salary" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE TABLE "new_Grade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "maxValue" REAL NOT NULL DEFAULT 100,
    "weight" REAL,
    "period" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Grade_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Grade" ("courseId", "createdAt", "id", "maxValue", "period", "studentId", "type", "updatedAt", "value", "weight") SELECT "courseId", "createdAt", "id", "maxValue", "period", "studentId", "type", "updatedAt", "value", "weight" FROM "Grade";
DROP TABLE "Grade";
ALTER TABLE "new_Grade" RENAME TO "Grade";
CREATE INDEX "Grade_courseId_period_idx" ON "Grade"("courseId", "period");
CREATE INDEX "Grade_studentId_courseId_idx" ON "Grade"("studentId", "courseId");
CREATE UNIQUE INDEX "Grade_studentId_courseId_period_type_key" ON "Grade"("studentId", "courseId", "period", "type");
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "dateOfBirth" DATETIME,
    "matricula" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Student_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("address", "branchId", "businessId", "email", "firstName", "id", "lastName", "matricula", "phone") SELECT "address", "branchId", "businessId", "email", "firstName", "id", "lastName", "matricula", "phone" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");
CREATE UNIQUE INDEX "Student_matricula_key" ON "Student"("matricula");
CREATE INDEX "Student_businessId_idx" ON "Student"("businessId");
CREATE INDEX "Student_matricula_idx" ON "Student"("matricula");
CREATE INDEX "Student_lastName_firstName_idx" ON "Student"("lastName", "firstName");
CREATE TABLE "new_StudentFee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "studentId" TEXT NOT NULL,
    "templateId" TEXT,
    "courseId" TEXT,
    "originalAmount" REAL,
    "discountApplied" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentFee_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SchoolFeeTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StudentFee_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StudentFee" ("amount", "createdAt", "discountApplied", "dueDate", "id", "originalAmount", "status", "studentId", "templateId", "title", "updatedAt") SELECT "amount", "createdAt", "discountApplied", "dueDate", "id", "originalAmount", "status", "studentId", "templateId", "title", "updatedAt" FROM "StudentFee";
DROP TABLE "StudentFee";
ALTER TABLE "new_StudentFee" RENAME TO "StudentFee";
CREATE INDEX "StudentFee_studentId_status_idx" ON "StudentFee"("studentId", "status");
CREATE INDEX "StudentFee_dueDate_idx" ON "StudentFee"("dueDate");
CREATE TABLE "new_StudentNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OBSERVATION',
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentNote_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudentNote" ("authorId", "content", "courseId", "createdAt", "id", "studentId", "type", "updatedAt") SELECT "authorId", "content", "courseId", "createdAt", "id", "studentId", "type", "updatedAt" FROM "StudentNote";
DROP TABLE "StudentNote";
ALTER TABLE "new_StudentNote" RENAME TO "StudentNote";
CREATE TABLE "new_StudentPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "studentFeeId" TEXT NOT NULL,
    "teacherId" TEXT,
    "teacherCommission" REAL,
    "reserveAmount" REAL,
    "schoolAmount" REAL,
    "settlementId" TEXT,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "transactionId" TEXT,
    CONSTRAINT "StudentPayment_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "StudentFee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentPayment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StudentPayment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "CommissionSettlement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StudentPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StudentPayment" ("amount", "date", "id", "method", "studentFeeId", "transactionId") SELECT "amount", "date", "id", "method", "studentFeeId", "transactionId" FROM "StudentPayment";
DROP TABLE "StudentPayment";
ALTER TABLE "new_StudentPayment" RENAME TO "StudentPayment";
CREATE UNIQUE INDEX "StudentPayment_transactionId_key" ON "StudentPayment"("transactionId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "businessId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "branchId" TEXT,
    "hourlyRate" REAL DEFAULT 0,
    "paymentModel" TEXT DEFAULT 'HOURLY',
    "commissionPercentage" REAL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("branchId", "businessId", "email", "emailVerified", "id", "image", "name", "password", "role") SELECT "branchId", "businessId", "email", "emailVerified", "id", "image", "name", "password", "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE INDEX "ScheduledPayment_businessId_active_idx" ON "ScheduledPayment"("businessId", "active");

-- CreateIndex
CREATE INDEX "ScheduledPayment_nextRunDate_idx" ON "ScheduledPayment"("nextRunDate");

-- CreateIndex
CREATE UNIQUE INDEX "ParentAccount_email_key" ON "ParentAccount"("email");

-- CreateIndex
CREATE INDEX "ParentAccount_businessId_idx" ON "ParentAccount"("businessId");

-- CreateIndex
CREATE INDEX "ParentAccount_email_idx" ON "ParentAccount"("email");

-- CreateIndex
CREATE INDEX "StudentParent_studentId_idx" ON "StudentParent"("studentId");

-- CreateIndex
CREATE INDEX "StudentParent_parentId_idx" ON "StudentParent"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentParent_studentId_parentId_key" ON "StudentParent"("studentId", "parentId");

-- CreateIndex
CREATE INDEX "ClassSchedule_courseId_idx" ON "ClassSchedule"("courseId");

-- CreateIndex
CREATE INDEX "ClassSchedule_businessId_idx" ON "ClassSchedule"("businessId");

-- CreateIndex
CREATE INDEX "Classroom_businessId_idx" ON "Classroom"("businessId");

-- CreateIndex
CREATE INDEX "Announcement_businessId_idx" ON "Announcement"("businessId");

-- CreateIndex
CREATE INDEX "SchoolEvent_businessId_idx" ON "SchoolEvent"("businessId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "CommissionSettlement_employeeId_idx" ON "CommissionSettlement"("employeeId");

-- CreateIndex
CREATE INDEX "CommissionSettlement_businessId_idx" ON "CommissionSettlement"("businessId");

-- CreateIndex
CREATE INDEX "Attendance_courseId_date_idx" ON "Attendance"("courseId", "date");

-- CreateIndex
CREATE INDEX "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_courseId_date_key" ON "Attendance"("studentId", "courseId", "date");
