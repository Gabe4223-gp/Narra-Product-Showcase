-- migrations/20231010123456-create-payments-table.sql
CREATE TABLE IF NOT EXISTS "Payments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "client_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "dateOfPayment" TIMESTAMP WITH TIME ZONE NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "invoiceUrl" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_payments_client_id" ON "Payments" ("client_id");
CREATE INDEX IF NOT EXISTS "idx_payments_dateOfPayment" ON "Payments" ("dateOfPayment");
