-- Copyright (c) 2026 Great Lakes Heritage, LLC
-- All rights reserved.
--
-- FILE: help-db-setup.sql  (Server folder)
--
-- INSTALL: Run this script once against your MySQL database.
--   mysql -u <user> -p <database> < help-db-setup.sql
--
-- Creates two tables:
--   help_content  — one row per page (page_key + app)
--        (Change field: app default value to the name of your application)
--   help_sections — one or more sections per page
--
-- Safe to run multiple times (uses IF NOT EXISTS).

-- glhcollections.help_content definition

CREATE TABLE `help_content` (
  `help_content_id` int NOT NULL AUTO_INCREMENT,
  `page_key` varchar(100) NOT NULL,
  `page_title` varchar(150) NOT NULL,
  `is_active` tinyint(1) DEFAULT '-1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`help_content_id`),
  UNIQUE KEY `help_content_app_IDX` (`page_key`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS help_sections (
    help_sections_id INT          NOT NULL AUTO_INCREMENT,
    help_content_id  INT          NOT NULL,
    section_title    VARCHAR(200) NOT NULL,
    section_text     MEDIUMTEXT,
    client_text      MEDIUMTEXT,
    video_content    VARCHAR(500),
    display_order    INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (help_sections_id),
    KEY idx_help_sections_content (help_content_id),
    CONSTRAINT fk_help_sections_content
        FOREIGN KEY (help_content_id) REFERENCES help_content (help_content_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
