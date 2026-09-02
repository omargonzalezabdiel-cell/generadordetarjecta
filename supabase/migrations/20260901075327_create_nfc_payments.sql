/*
# Create nfc_payments table for NFC payment transactions

1. New Tables
- `nfc_payments`
  - `id` (uuid, primary key)
  - `card_id` (text, identifies which generated card made the payment)
  - `card_number` (text, masked card number, last 4 digits only)
  - `card_holder` (text, name on card)
  - `card_brand` (text, visa/mastercard/amex)
  - `amount` (numeric, payment amount)
  - `currency` (text, default USD)
  - `merchant` (text, merchant name)
  - `status` (text, pending/approved/declined)
  - `created_at` (timestamp)
2. Security
- Enable RLS on `nfc_payments`.
- Allow anon + authenticated CRUD (single-tenant, no auth app).
*/

CREATE TABLE IF NOT EXISTS nfc_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id text NOT NULL,
  card_number text NOT NULL,
  card_holder text NOT NULL,
  card_brand text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  merchant text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nfc_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_payments" ON nfc_payments;
CREATE POLICY "anon_select_payments" ON nfc_payments FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_payments" ON nfc_payments;
CREATE POLICY "anon_insert_payments" ON nfc_payments FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_payments" ON nfc_payments;
CREATE POLICY "anon_update_payments" ON nfc_payments FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_payments" ON nfc_payments;
CREATE POLICY "anon_delete_payments" ON nfc_payments FOR DELETE
TO anon, authenticated USING (true);
