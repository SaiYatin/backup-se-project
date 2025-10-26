-- Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('FRAUD', 'INAPPROPRIATE', 'SCAM', 'OTHER')),
  description TEXT NOT NULL CHECK (LENGTH(description) BETWEEN 10 AND 1000),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
  evidence_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  resolution_notes TEXT CHECK (LENGTH(resolution_notes) <= 1000),
  resolver_id UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX reports_event_status_idx ON reports(event_id, status);
CREATE INDEX reports_reporter_idx ON reports(reporter_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
