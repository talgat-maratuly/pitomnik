-- CreateTable
CREATE TABLE "objects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sections" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "object_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT,
    "culture" TEXT,
    "custom_text" TEXT,
    "qr_code_url" TEXT,
    "form_url" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "radius_meters" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sections_object_id_fkey" FOREIGN KEY ("object_id") REFERENCES "objects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_other" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "work_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "section_id" INTEGER NOT NULL,
    "worker_full_name" TEXT NOT NULL,
    "work_type_id" INTEGER,
    "custom_work_type" TEXT,
    "work_volume" TEXT NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "photo_urls" TEXT NOT NULL DEFAULT '[]',
    "latitude" REAL,
    "longitude" REAL,
    "location_accuracy" REAL,
    "location_allowed" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "work_logs_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "work_logs_work_type_id_fkey" FOREIGN KEY ("work_type_id") REFERENCES "work_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "section_code_counter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "value" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "sections_code_key" ON "sections"("code");

-- CreateIndex
CREATE UNIQUE INDEX "work_types_name_key" ON "work_types"("name");

-- CreateIndex
CREATE INDEX "work_logs_submitted_at_idx" ON "work_logs"("submitted_at");

-- CreateIndex
CREATE INDEX "work_logs_worker_full_name_idx" ON "work_logs"("worker_full_name");
