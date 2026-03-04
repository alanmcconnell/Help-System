// Copyright (c) 2026 Great Lakes Heritage, LLC
// All rights reserved.
//
// FILE: help-api.js  (endpoint folder)
//
// INSTALL INSTRUCTIONS
// --------------------
// 1. Copy this file to your server folder.
// 2. In your server.mjs (or app.js), add:
//
//      import helpRoutes from './help-api.js';
//      app.use('/api', helpRoutes);
//
//    If your server uses CommonJS (require), rename to help-api.cjs and use:
//      const helpRoutes = require('./help-api.cjs');
//
// 3. Add the video static route to server.mjs (if using local video files):
//      app.use('/videos', express.static(process.env.HELP_VIDEOS_ROOT_PATH || './videos'));
//
// 4. Add to your .env file:
//      HELP_VIDEOS_ROOT_PATH=C:\path\to\your\videos
//
// 5. Run the DB migration script:  help-db-setup.sql
//
// DEPENDENCIES
// ------------
// - express, mysql2/promise, jsonwebtoken  (already in package.json for most apps)
// - process.env.DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
// - process.env.JWT_SECRET
//
// AUTH
// ----
// DELETE endpoints require a valid JWT with user_role === 'Admin'.
// GET and POST/PUT endpoints are open (no token required) so the help panel
// works for all users including unauthenticated visitors.

import express from 'express';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const router = express.Router();

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

function authenticateToken(req, res, next) {
    const token = (req.headers['authorization'] || '').split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.user_role !== 'Admin')
        return res.status(403).json({ error: 'Admin role required' });
    next();
}

// ── Help Editor: Pages ────────────────────────────────────────────────────────

// GET all pages
router.get('/help-editor/pages', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute('SELECT * FROM help_content ORDER BY app, page_key');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) await conn.end(); }
});

// POST create page
router.post('/help-editor/page', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [result] = await conn.execute(
            'INSERT INTO help_content (page_key, app, page_title) VALUES (?, ?, ?)',
            [req.body.page_key, req.body.app, req.body.page_key]
        );
        res.json({ id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) await conn.end(); }
});

// PUT update page
router.put('/help-editor/page/:id', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        await conn.execute(
            'UPDATE help_content SET page_key = ?, app = ? WHERE help_content_id = ?',
            [req.body.page_key, req.body.app, req.params.id]
        );
        res.json({ message: 'Updated' });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) await conn.end(); }
});

// DELETE page (Admin only)
router.delete('/help-editor/page/:id', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        await conn.execute('DELETE FROM help_sections WHERE help_content_id = ?', [req.params.id]);
        await conn.execute('DELETE FROM help_content WHERE help_content_id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) await conn.end(); }
});

// ── Help Editor: Sections ─────────────────────────────────────────────────────

// GET sections for a page
router.get('/help-editor/sections/:pageId', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute(
            'SELECT * FROM help_sections WHERE help_content_id = ? ORDER BY display_order',
            [req.params.pageId]
        );
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) await conn.end(); }
});

// POST create section
router.post('/help-editor/section', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const { help_content_id, section_title, section_text, client_text, video_content, display_order } = req.body;
        const [result] = await conn.execute(
            'INSERT INTO help_sections (help_content_id, section_title, section_text, client_text, video_content, display_order) VALUES (?, ?, ?, ?, ?, ?)',
            [help_content_id, section_title, section_text, client_text, video_content, display_order]
        );
        res.json({ id: result.insertId });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) await conn.end(); }
});

// PUT update section
router.put('/help-editor/section/:id', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const { section_title, section_text, client_text, video_content, display_order } = req.body;
        await conn.execute(
            'UPDATE help_sections SET section_title = ?, section_text = ?, client_text = ?, video_content = ?, display_order = ? WHERE help_sections_id = ?',
            [section_title, section_text, client_text, video_content, display_order, req.params.id]
        );
        res.json({ message: 'Updated' });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) await conn.end(); }
});

// DELETE section (Admin only)
router.delete('/help-editor/section/:id', authenticateToken, requireAdmin, async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        await conn.execute('DELETE FROM help_sections WHERE help_sections_id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
    finally { if (conn) await conn.end(); }
});

// ── Public Help Panel: fetch sections by page key ─────────────────────────────

// GET /api/help/:pageKey
router.get('/help/:pageKey', async (req, res) => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [pages] = await conn.execute(
            'SELECT help_content_id FROM help_content WHERE page_key = ?',
            [req.params.pageKey]
        );
        if (pages.length === 0) return res.json([]);
        const [sections] = await conn.execute(
            'SELECT section_title, section_text, client_text, video_content, display_order FROM help_sections WHERE help_content_id = ? ORDER BY display_order',
            [pages[0].help_content_id]
        );
        res.json(sections);
    } catch (e) {
        console.error('Error fetching help content:', e);
        res.status(500).json({ error: 'Failed to fetch help content' });
    } finally { if (conn) await conn.end(); }
});

export default router;
