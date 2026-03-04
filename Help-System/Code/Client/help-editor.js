// Copyright (c) 2026 Great Lakes Heritage, LLC
// All rights reserved.
//
// INSTALL: Copy to your web app client folder alongside help-editor.html.
// CONFIG:  Set HELP_API_BASE_PATH if your server uses a different API prefix than /api.
//          Set HELP_VIDEO_PORT if your video static route is on a different port.

let API_BASE = '';
let currentPageId = null;
let currentSectionId = null;
let pages = [];
let quill = null;
let quillClient = null;

async function loadConfig() {
    API_BASE = `http://localhost:${SERVER_PORT}/api`;
}

async function loadPages() {
    const res = await fetch(`${API_BASE}/help-editor/pages`);
    const data = await res.json();
    pages = Array.isArray(data) ? data : [];
    const grid = document.getElementById('pagesGrid');
    grid.innerHTML = '';
    pages
        .sort((a, b) => a.page_key.localeCompare(b.page_key))
        .forEach(p => {
        const row = document.createElement('div');
        row.className = 'grid-row' + (p.help_content_id === currentPageId ? ' selected' : '');
        row.textContent = p.page_key;
        row.onclick = () => selectPage(p);
        grid.appendChild(row);
    });
}

function selectPage(p) {
    currentPageId = p.help_content_id;
    document.getElementById('page_key').value = p.page_key;
    loadSections();
    loadPages();
}

async function loadSections() {
    if (!currentPageId) return;
    const res = await fetch(`${API_BASE}/help-editor/sections/${currentPageId}`);
    const sections = await res.json();
    const list = document.getElementById('sectionsList');
    list.innerHTML = '';
    sections.forEach(s => {
        const row = document.createElement('div');
        row.className = 'section-row' + (s.help_sections_id === currentSectionId ? ' selected' : '');
        row.onclick = () => selectSection(s);
        row.innerHTML = `<span>${s.display_order}. ${s.section_title}</span>
            <div>
                <button onclick="event.stopPropagation(); editSection(${JSON.stringify(s).replace(/"/g, '&quot;')})">Edit</button>
                <button onclick="event.stopPropagation(); deleteSection(${s.help_sections_id})">Del</button>
            </div>`;
        list.appendChild(row);
    });
}

function selectSection(s) {
    currentSectionId = s.help_sections_id;
    document.getElementById('sectionForm').style.display = 'none';
    loadSections();
}

function editSection(s) {
    currentSectionId = s.help_sections_id;
    document.getElementById('section_title').value = s.section_title;
    quill.clipboard.dangerouslyPasteHTML(s.section_text || '');
    quillClient.clipboard.dangerouslyPasteHTML(s.client_text || '');
    document.getElementById('display_order').value = s.display_order;
    document.getElementById('video_content').value = s.video_content || '';
    document.getElementById('sectionForm').style.display = '';
    setTimeout(() => loadSections(), 0);
}

async function deleteSection(id) {
    const r = await acm_SecurePopUp('Delete this section?', 'Yes:yes', 'No:no');
    if (r !== 'yes') return;
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_BASE}/help-editor/section/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) { await acm_SecurePopUp('Delete failed: ' + (await res.text()), 'OK:ok'); return; }
    await loadSections();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();

    const Font = Quill.import('formats/font');
    Font.whitelist = ['arial', 'courier', 'georgia', 'tahoma', 'times', 'verdana'];
    Quill.register(Font, true);

    const Size = Quill.import('attributors/style/size');
    Size.whitelist = ['10px','12px','14px','16px','18px','20px','24px','28px','32px'];
    Quill.register(Size, true);

    const toolbarConfig = {
        container: [
            [{ font: Font.whitelist }],
            [{ size: Size.whitelist }],
            ['bold','italic','underline'],
            ['link'],
            [{ color: [] }],
            ['clean']
        ]
    };

    quill = new Quill('#section_text_editor', {
        theme: 'snow',
        modules: {
            toolbar: {
                ...toolbarConfig,
                handlers: {
                    clean() {
                        const range = quill.getSelection();
                        if (range && range.length > 0) quill.removeFormat(range.index, range.length);
                        else quill.removeFormat(0, quill.getLength());
                    }
                }
            }
        }
    });

    quillClient = new Quill('#client_text_editor', {
        theme: 'snow',
        modules: {
            toolbar: {
                ...toolbarConfig,
                handlers: {
                    clean() {
                        const range = quillClient.getSelection();
                        if (range && range.length > 0) quillClient.removeFormat(range.index, range.length);
                        else quillClient.removeFormat(0, quillClient.getLength());
                    }
                }
            }
        }
    });

    const urlKey = new URLSearchParams(window.location.search).get('page');
    if (urlKey) document.getElementById('page_key').value = urlKey;

    await loadPages();

    if (urlKey) {
        const match = pages.find(p => p.page_key === urlKey);
        if (match) selectPage(match);
    }

    document.getElementById('addPageBtn').addEventListener('click', () => {
        currentPageId = null;
        document.getElementById('page_key').value = '';
        document.getElementById('sectionsList').innerHTML = '';
        document.getElementById('sectionForm').style.display = 'none';
        loadPages();
    });

    document.getElementById('deletePageBtn').addEventListener('click', async () => {
        if (!currentPageId) { await acm_SecurePopUp('No page selected', 'OK:ok'); return; }
        const r = await acm_SecurePopUp('Delete this page and all its sections?', 'Yes:yes', 'No:no');
        if (r !== 'yes') return;
        await fetch(`${API_BASE}/help-editor/page/${currentPageId}`, { method: 'DELETE' });
        currentPageId = null;
        document.getElementById('page_key').value = '';
        document.getElementById('sectionsList').innerHTML = '';
        loadPages();
    });

    document.getElementById('savePageBtn').addEventListener('click', async () => {
        const page_key = document.getElementById('page_key').value.trim();
        if (!page_key) { await acm_SecurePopUp('Page key is required', 'OK:ok'); return; }
        const method = currentPageId ? 'PUT' : 'POST';
        const url = currentPageId ? `${API_BASE}/help-editor/page/${currentPageId}` : `${API_BASE}/help-editor/page`;
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page_key }) });
        const data = await res.json();
        if (!currentPageId) currentPageId = data.id;
        await loadPages();
    });

    document.getElementById('addSectionBtn').addEventListener('click', () => {
        if (!currentPageId) { acm_SecurePopUp('Save the page first', 'OK:ok'); return; }
        currentSectionId = null;
        document.getElementById('section_title').value = '';
        quill.root.innerHTML = '';
        quillClient.root.innerHTML = '';
        document.getElementById('display_order').value = '0';
        document.getElementById('video_content').value = '';
        document.getElementById('sectionForm').style.display = '';
    });

    document.getElementById('saveSectionBtn').addEventListener('click', async () => {
        const body = {
            help_content_id: currentPageId,
            section_title: document.getElementById('section_title').value.trim(),
            section_text: quill.root.innerHTML,
            client_text: quillClient.root.innerHTML,
            video_content: document.getElementById('video_content').value.trim(),
            display_order: parseInt(document.getElementById('display_order').value) || 0
        };
        if (!body.section_title) { await acm_SecurePopUp('Title is required', 'OK:ok'); return; }
        const isUpdate = currentSectionId && currentSectionId > 0;
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate ? `${API_BASE}/help-editor/section/${currentSectionId}` : `${API_BASE}/help-editor/section`;
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        document.getElementById('sectionForm').style.display = 'none';
        currentSectionId = null;
        loadSections();
    });

    document.getElementById('cancelSectionBtn').addEventListener('click', () => {
        document.getElementById('sectionForm').style.display = 'none';
        currentSectionId = null;
    });
});
