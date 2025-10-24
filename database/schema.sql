-- ============================================
-- FILE: database/schema.sql
-- PostgreSQL Database Schema for Fundraising Portal
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (FR-001)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('donor', 'organizer', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- EVENTS TABLE (FR-002, FR-003, FR-004)
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(12, 2) DEFAULT 0.00,
    category VARCHAR(50),
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- ============================================
-- PLEDGES TABLE (FR-005, FR-006, FR-008)
-- ============================================
CREATE TABLE pledges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    is_anonymous BOOLEAN DEFAULT FALSE,
    message TEXT,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for queries
CREATE INDEX idx_pledges_event ON pledges(event_id);
CREATE INDEX idx_pledges_donor ON pledges(donor_id);
CREATE INDEX idx_pledges_created_at ON pledges(created_at DESC);

-- ============================================
-- REPORTS TABLE (FR-014)
-- ============================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generated_by UUID NOT NULL REFERENCES users(id),
    report_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- ============================================
-- AUDIT_LOGS TABLE (NFR-004)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- NOTIFICATIONS TABLE (FR-009, FR-015)
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pledges_updated_at BEFORE UPDATE ON pledges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Update event current_amount (FR-006)
-- ============================================
CREATE OR REPLACE FUNCTION update_event_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE events
    SET current_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM pledges
        WHERE event_id = NEW.event_id AND payment_status = 'completed'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_amount
AFTER INSERT OR UPDATE ON pledges
FOR EACH ROW
EXECUTE FUNCTION update_event_amount();

-- ============================================
-- FUNCTION: Notify when target reached (FR-015)
-- ============================================
CREATE OR REPLACE FUNCTION check_target_reached()
RETURNS TRIGGER AS $$
DECLARE
    v_target DECIMAL;
    v_current DECIMAL;
    v_organizer_id UUID;
BEGIN
    SELECT target_amount, current_amount, organizer_id
    INTO v_target, v_current, v_organizer_id
    FROM events
    WHERE id = NEW.id;

    IF v_current >= v_target THEN
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
        VALUES (
            v_organizer_id,
            'target_reached',
            'Congratulations! Target Reached',
            'Your event "' || NEW.title || '" has reached its funding target!',
            'event',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_target_reached
AFTER UPDATE OF current_amount ON events
FOR EACH ROW
WHEN (NEW.current_amount >= NEW.target_amount AND OLD.current_amount < OLD.target_amount)
EXECUTE FUNCTION check_target_reached();

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Active events with pledge statistics
CREATE OR REPLACE VIEW v_active_events_stats AS
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    u.name AS organizer_name,
    e.target_amount,
    e.current_amount,
    ROUND((e.current_amount / e.target_amount * 100), 2) AS progress_percentage,
    COUNT(p.id) AS total_pledges,
    COUNT(DISTINCT p.donor_id) AS unique_donors,
    e.category,
    e.status,
    e.created_at,
    e.end_date
FROM events e
LEFT JOIN users u ON e.organizer_id = u.id
LEFT JOIN pledges p ON e.id = p.event_id AND p.payment_status = 'completed'
WHERE e.status = 'active'
GROUP BY e.id, u.name;

-- Top donors view
CREATE OR REPLACE VIEW v_top_donors AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(p.id) AS total_pledges,
    SUM(p.amount) AS total_donated,
    MAX(p.created_at) AS last_donation_date
FROM users u
INNER JOIN pledges p ON u.id = p.donor_id
WHERE p.payment_status = 'completed' AND p.is_anonymous = FALSE
GROUP BY u.id
ORDER BY total_donated DESC;

-- ============================================
-- SEED DATA (Optional - for development)
-- ============================================

-- Insert admin user (password: Admin@123)
INSERT INTO users (name, email, password_hash, role, is_verified) VALUES
('Admin User', 'admin@fundraising.com', '$2a$10$xQZ8kqGmN5LjJZqg5yYz3eXQZ8kqGmN5LjJZqg5yYz3eXQZ8kqGmN5', 'admin', TRUE);

-- Insert sample organizer (password: Organizer@123)
INSERT INTO users (name, email, password_hash, role, is_verified) VALUES
('John Organizer', 'organizer@example.com', '$2a$10$xQZ8kqGmN5LjJZqg5yYz3eXQZ8kqGmN5LjJZqg5yYz3eXQZ8kqGmN5', 'organizer', TRUE);

-- Insert sample donors
INSERT INTO users (name, email, password_hash, role, is_verified) VALUES
('Alice Donor', 'alice@example.com', '$2a$10$xQZ8kqGmN5LjJZqg5yYz3eXQZ8kqGmN5LjJZqg5yYz3eXQZ8kqGmN5', 'donor', TRUE),
('Bob Donor', 'bob@example.com', '$2a$10$xQZ8kqGmN5LjJZqg5yYz3eXQZ8kqGmN5LjJZqg5yYz3eXQZ8kqGmN5', 'donor', TRUE);

-- ============================================
-- DATABASE MAINTENANCE
-- ============================================

-- Function to clean old audit logs (keep only 1 year as per NFR-004)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 year';
END;
$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension in production)
-- SELECT cron.schedule('cleanup-audit-logs', '0 0 * * 0', 'SELECT cleanup_old_audit_logs()');

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fundraising_app_user;