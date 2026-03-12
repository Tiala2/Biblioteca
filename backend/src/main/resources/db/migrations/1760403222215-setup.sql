--liquibase formatted sql
--changeset iuri:1760403222215 splitStatements:false endDelimiter:GO

CREATE
    EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION trigger_updated_at()
    RETURNS TRIGGER AS $BODY$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql;
COMMENT ON FUNCTION trigger_updated_at() IS 'Trigger function to update the updated_at timestamp on row update';