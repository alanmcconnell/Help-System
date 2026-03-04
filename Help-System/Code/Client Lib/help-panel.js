// Copyright (c) 2026 Great Lakes Heritage, LLC
// All rights reserved.
//
// FILE: help-panel.js  (Client Lib folder)
//
// INSTALL INSTRUCTIONS
// --------------------
// This file adds the Help Panel to any web app that uses menu.js.
//
// Option A — Standalone (menu.js does NOT already have help panel code):
//   1. Copy this file to your client/lib/ folder.
//   2. Add this line to every HTML page AFTER menu.js:
//        <script src="lib/help-panel.js"></script>
//
// Option B — Merge into existing menu.js:
//   Copy the functions below into your menu.js file.
//
// CONFIG
// ------
// Set HELP_VIDEO_PORT if your video static route runs on a different port than the API.
// Set HELP_API_URL_OVERRIDE to a full URL string if your API is on a different origin;
//   leave null to auto-detect from _CONFIG.SERVER_API_URL or window.location.

function _helpGetApiBase() {
    if (HELP_API_URL_OVERRIDE) return HELP_API_URL_OVERRIDE;
    return `http://localhost:${SERVER_PORT}/api`;
}

function _helpVideoUrl(filename) {
    if (filename.startsWith('http')) return filename;
    const apiBase = _helpGetApiBase();
    if (HELP_VIDEO_PORT) {
        const url = new URL(apiBase);
        return `${url.protocol}//${url.hostname}:${HELP_VIDEO_PORT}/videos/${filename}`;
    }
    const url = new URL(apiBase);
    return `${url.protocol}//${url.hostname}:${url.port}/videos/${filename}`;
}

async function openHelpPanel() {
    const panel = document.getElementById('helpPanel');
    const content = document.getElementById('helpPanelContent');
    const header = document.getElementById('helpPanelHeader');
    panel.classList.add('open');
    content.innerHTML = '<p style="padding:10px;">Loading...</p>';

    const pageKey = window.location.pathname.split('/').pop().replace(/\.html$/i, '') || 'index';
    const pageTitle = document.title.split(' - ')[0] || pageKey;
    header.innerHTML = `<strong>Help — ${pageTitle}</strong>`;

    try {
        const apiBase = _helpGetApiBase();
        const r1 = await fetch(`${apiBase}/help/${encodeURIComponent(pageKey)}`);
        if (!r1.ok) { content.innerHTML = _helpNoHelpMsg(apiBase, pageKey); return; }
        const sections = await r1.json();
        if (!sections.length) { content.innerHTML = _helpNoHelpMsg(apiBase, pageKey); return; }

        content.innerHTML = sections.map((s, i) =>
            `<div class="help-section">
                <h3 class="help-section-title" onclick="toggleHelpSection(${i})">
                    <span class="help-toggle">▼</span> ${s.section_title}
                </h3>
                <div class="help-section-body" id="help-body-${i}">
                    ${s.section_text || ''}
                    ${s.client_text && s.client_text.replace(/<[^>]*>/g,'').trim() ? `<div class="help-divider">${'&#9660;'.repeat(30)}</div>${s.client_text}` : ''}
                    ${s.video_content ? (() => {
                        const vurl = _helpVideoUrl(s.video_content);
                        const ytMatch = vurl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
                        if (ytMatch) return `<div class="help-video-wrap"><iframe width="100%" height="215" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen style="margin-top:8px;"></iframe></div>`;
                        const vimeoMatch = vurl.match(/vimeo\.com\/(\d+)/);
                        if (vimeoMatch) return `<div class="help-video-wrap"><iframe width="100%" height="215" src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allowfullscreen style="margin-top:8px;"></iframe></div>`;
                        return `<div class="help-video-wrap"><video controls style="width:100%;margin-top:8px;"><source src="${vurl}"><a href="${vurl}" target="_blank">&#127916; Watch Video</a></video></div>`;
                    })() : ''}
                </div>
            </div>`
        ).join('');
    } catch (e) {
        content.innerHTML = '<p style="padding:10px;">Error loading help content.</p>';
    }
}

function _helpNoHelpMsg(apiBase, pageKey) {
    const token = typeof acm_GetAppToken === 'function' ? acm_GetAppToken() : null;
    const isAdmin = token && token.user_role === 'Admin';
    return '<p style="padding:10px;">No help available for this page.</p>' +
        (isAdmin ? `<p style="padding:0 10px;"><a href="help-editor.html?page=${encodeURIComponent(pageKey)}" style="color:#003399;">+ Add help for this page</a></p>` : '');
}

function toggleHelpSection(i) {
    const body = document.getElementById('help-body-' + i);
    const toggle = body.previousElementSibling.querySelector('.help-toggle');
    const collapsed = body.style.display === 'none';
    body.style.display = collapsed ? '' : 'none';
    toggle.textContent = collapsed ? '▼' : '►';
}

function collapseAllHelpSections() {
    document.querySelectorAll('#helpPanelContent .help-section-body').forEach((body) => {
        body.style.display = 'none';
        body.previousElementSibling.querySelector('.help-toggle').textContent = '►';
    });
}

function closeHelpPanel() {
    document.getElementById('helpPanel').classList.remove('open');
}

function printHelpPanel() {
    const header = document.getElementById('helpPanelHeader').innerHTML;
    const body = document.getElementById('helpPanelContent').innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Help</title><style>
        body{font-family:Arial,sans-serif;margin:1in;color:#000}
        h3{color:#003399;border-bottom:1px solid #ccc;padding-bottom:4px}
        .help-section{margin-bottom:20px}
        .help-toggle{display:none}
        .help-section-title{cursor:default}
    </style></head><body><h2>${header}</h2>${body}</body></html>`);
    w.document.close();
    w.print();
}

// Auto-inject help panel and wire keyboard shortcuts on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('helpPanel')) {
        const panel = document.createElement('div');
        panel.id = 'helpPanel';
        panel.innerHTML = `
            <div id="helpPanelHeader"><strong>Help</strong></div>
            <div id="helpPanelContent"></div>
            <div id="helpPanelFooter">
                <button onclick="collapseAllHelpSections()">Collapse All</button>
                <button onclick="printHelpPanel()">Print</button>
                <button onclick="closeHelpPanel()">Close</button>
            </div>
        `;
        document.body.appendChild(panel);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'F1') { e.preventDefault(); openHelpPanel(); }
        if (e.key === 'Escape') { closeHelpPanel(); }
    });
});
