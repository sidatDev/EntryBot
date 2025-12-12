-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "extractedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "userId" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "approvalDate" DATETIME,
    "rejectionReason" TEXT,
    "comments" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("approvalDate", "approvalStatus", "approverId", "category", "comments", "createdAt", "deletedAt", "extractedText", "id", "name", "notes", "rejectionReason", "size", "status", "type", "updatedAt", "url", "userId") SELECT "approvalDate", "approvalStatus", "approverId", "category", "comments", "createdAt", "deletedAt", "extractedText", "id", "name", "notes", "rejectionReason", "size", "status", "type", "updatedAt", "url", "userId" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
