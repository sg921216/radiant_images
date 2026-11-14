ALTER TABLE lifecycle_state ADD COLUMN restore_status integer NOT NULL DEFAULT 0 CHECK(restore_status IN (0,1,2));
