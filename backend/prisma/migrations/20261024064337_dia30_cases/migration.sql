-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('SUSPECTED', 'EXAM_SCHEDULED', 'EXAM_DONE', 'EXAM_TO_RESCHEDULE', 'REPORT_PENDING_CONFIRMATION', 'DIAGNOSIS_CONFIRMED', 'TREATMENT_STARTED', 'DISCARDED', 'CLOSED_EXCEPTION');

-- CreateEnum
CREATE TYPE "CaseTrigger" AS ENUM ('BIRADS_4', 'BIRADS_5', 'CLINICAL_SUSPICION');

-- CreateEnum
CREATE TYPE "CaseEventType" AS ENUM ('CASE_CREATED', 'EXAM_SCHEDULED', 'EXAM_DONE', 'REPORT_RECEIVED', 'REPORT_CONFIRMED', 'TREATMENT_STARTED', 'EXCEPTION_NOTED', 'CASE_CLOSED_EXCEPTION', 'CORRECTION', 'ALERT_ACKNOWLEDGED', 'CONTACT_LOGGED');

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "cns" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "trigger" "CaseTrigger" NOT NULL,
    "requested_at" DATE NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'SUSPECTED',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_events" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "type" "CaseEventType" NOT NULL,
    "occurred_at" DATE NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,
    "corrects_event_id" UUID,
    "payload" JSONB NOT NULL,

    CONSTRAINT "case_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_extractions" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "fallback_reason" TEXT,
    "suggestion" JSONB NOT NULL,
    "demo_raw_text" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMP(3),
    "consumed_by_event_id" UUID,

    CONSTRAINT "report_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_access_tokens" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "patient_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_clock_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "offset_days" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_clock_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cases_status_requested_at_idx" ON "cases"("status", "requested_at");

-- CreateIndex
CREATE INDEX "case_events_case_id_recorded_at_idx" ON "case_events"("case_id", "recorded_at");

-- CreateIndex
CREATE INDEX "case_events_corrects_event_id_idx" ON "case_events"("corrects_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_extractions_consumed_by_event_id_key" ON "report_extractions"("consumed_by_event_id");

-- CreateIndex
CREATE INDEX "report_extractions_case_id_created_at_idx" ON "report_extractions"("case_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "patient_access_tokens_token_hash_key" ON "patient_access_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "patient_access_tokens_case_id_idx" ON "patient_access_tokens"("case_id");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_corrects_event_id_fkey" FOREIGN KEY ("corrects_event_id") REFERENCES "case_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_extractions" ADD CONSTRAINT "report_extractions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_extractions" ADD CONSTRAINT "report_extractions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_access_tokens" ADD CONSTRAINT "patient_access_tokens_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_access_tokens" ADD CONSTRAINT "patient_access_tokens_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
