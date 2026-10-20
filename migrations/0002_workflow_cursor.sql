-- Durable round-robin position; no subscriber data or message payloads.
CREATE TABLE automation_cursor (
 state TEXT PRIMARY KEY CHECK(state IN ('pending','running')),
 position INTEGER NOT NULL DEFAULT 0
);
