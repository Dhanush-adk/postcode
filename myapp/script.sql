/* ==============================================================
   0.  DATABASE  (edit name if you like)
   ============================================================ */
CREATE DATABASE IF NOT EXISTS userdb
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE userdb;

/* ==============================================================
   1.  USERS  — add is_verified if migrating
   ============================================================ */
CREATE TABLE IF NOT EXISTS users (
  user_id       CHAR(36)     NOT NULL PRIMARY KEY,          -- UUID
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  is_verified   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- If you already had a users table, run only this:
-- ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER phone;
-- add retry attempt
/* ==============================================================
   2.  OTPS  — one-time passwords for register / login
   ============================================================ */
CREATE TABLE IF NOT EXISTS otps (
  otp_id      CHAR(36)                                 PRIMARY KEY,  -- UUID
  email       VARCHAR(255)            NOT NULL,
  code_hash   CHAR(60)                NOT NULL,       -- bcrypt of 6-digit code
  purpose     ENUM('register','login')NOT NULL,
  expires_at  TIMESTAMP               NOT NULL,
  created_at  TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otps_email_purpose (email, purpose)
) ENGINE = InnoDB;

/* ==============================================================
   3.  USER SESSIONS  — short-lived JWT + long-lived refresh token
   ============================================================ */
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id         CHAR(36)     NOT NULL PRIMARY KEY,          -- UUID
  user_id            CHAR(36)     NOT NULL,
  refresh_token_hash CHAR(60)     NOT NULL,     -- bcrypt hash of RT
  jwt                VARCHAR(500) NOT NULL,     -- current short-lived token
  is_active          TINYINT(1)   NOT NULL DEFAULT 1,
  last_seen          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at         TIMESTAMP    NOT NULL,
  CONSTRAINT fk_sessions_user
      FOREIGN KEY (user_id) REFERENCES users(user_id)
      ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_jwt  (jwt(255))
) ENGINE = InnoDB;



-- Nightly purge job (example)
-- DELETE FROM user_sessions
--  WHERE (is_active = 0)
--     OR (last_seen  < NOW() - INTERVAL 30 DAY)
--     OR (expires_at < NOW());
-- Run that via a cron, AWS Lambda + CloudWatch Events, or RDS event scheduler.



