/**
 * The SnipVault single-page app, served inline by Express so the whole product
 * (API + UI) ships as one deployable unit. No build step, no framework.
 */
export const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SnipVault</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f6f7f9; color: #1c2024; }
  header { background: #111827; color: #fff; padding: 18px 24px; }
  header h1 { margin: 0; font-size: 20px; letter-spacing: -0.01em; }
  header p { margin: 4px 0 0; color: #9ca3af; font-size: 13px; }
  main { max-width: 900px; margin: 24px auto; padding: 0 16px; display: grid; gap: 20px; grid-template-columns: 1fr; }
  .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; }
  .card h2 { margin: 0 0 12px; font-size: 15px; }
  label { display: block; font-size: 12px; color: #6b7280; margin: 10px 0 4px; }
  input, select, textarea { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font: inherit; }
  textarea { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; min-height: 120px; }
  button { margin-top: 12px; background: #2563eb; color: #fff; border: 0; border-radius: 6px; padding: 9px 16px; font: inherit; font-weight: 600; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  .snippet { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
  .snippet .meta { font-size: 12px; color: #6b7280; display: flex; gap: 8px; align-items: center; }
  .snippet pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 6px; overflow: auto; font-size: 13px; margin: 8px 0 0; }
  .tag { background: #eef2ff; color: #4338ca; border-radius: 999px; padding: 1px 8px; font-size: 11px; font-weight: 600; }
  a { color: #2563eb; }
</style>
</head>
<body>
<header>
  <h1>SnipVault</h1>
  <p>Share code snippets with a link.</p>
</header>
<main>
  <div class="card">
    <h2>New snippet</h2>
    <label for="title">Title</label>
    <input id="title" placeholder="Debounce in JS" />
    <label for="language">Language</label>
    <select id="language">
      <option>javascript</option><option>python</option><option>bash</option>
      <option>go</option><option>sql</option><option>text</option>
    </select>
    <label for="code">Code</label>
    <textarea id="code" placeholder="const x = 1;"></textarea>
    <button id="save">Save snippet</button>
  </div>
  <div class="card">
    <h2>Recent snippets</h2>
    <div id="list">Loading…</div>
  </div>
</main>
<script>
  const api = (p, opts) => fetch('/api' + p, opts).then((r) => r.json());
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  async function load() {
    const data = await api('/snippets');
    const items = data.snippets || [];
    document.getElementById('list').innerHTML = items.length
      ? items.map((s) => \`<div class="snippet">
          <div class="meta"><span class="tag">\${esc(s.language)}</span>
            <strong>\${esc(s.title)}</strong> · <span>by \${esc(s.author)}</span></div>
          <pre>\${esc(s.code)}</pre></div>\`).join('')
      : '<p style="color:#6b7280">No snippets yet.</p>';
  }

  document.getElementById('save').addEventListener('click', async () => {
    const body = {
      title: document.getElementById('title').value,
      language: document.getElementById('language').value,
      code: document.getElementById('code').value,
    };
    await api('/snippets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    document.getElementById('title').value = '';
    document.getElementById('code').value = '';
    load();
  });

  load();
</script>
</body>
</html>`;

export default PAGE;
