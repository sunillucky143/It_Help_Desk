-- Migration: add is_internal to ticket_messages, indexes, and unique primary assignment index
BEGIN;

ALTER TABLE ticket_messages
  ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_ticket_messages_time ON ticket_messages(ticket_id, message_time DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_ticket_primary ON ticket_assignments (ticket_id) WHERE is_primary;

-- Ensure inbox query performs well
CREATE INDEX IF NOT EXISTS idx_ticket_priority ON support_tickets (priority_id);
CREATE INDEX IF NOT EXISTS idx_ticket_org ON support_tickets (organization_id);

COMMIT;
