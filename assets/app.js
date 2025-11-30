const state = {
  manifest: null,
  categoryIndex: {},
  docCache: {},
  current: { categoryId: null, pageId: null },
  searchIndex: null,
};
let VERSION = '20251130-01';

function getPreferredTheme() {
  const t = localStorage.getItem('theme');
  if (t) return t;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(t) {
  const body = document.body;
  if (t === 'dark') body.classList.add('theme-dark'); else body.classList.remove('theme-dark');
  const light = document.getElementById('hljs-light');
  const dark = document.getElementById('hljs-dark');
  if (light && dark) {
    if (t === 'dark') { light.disabled = true; dark.disabled = false; } else { light.disabled = false; dark.disabled = true; }
  }
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = t === 'dark' ? '🌞' : '🌙';
  const logo = document.getElementById('site-logo');
  if (logo) {
    const preferGif = localStorage.getItem('logoType') === 'gif';
    if (preferGif) logo.src = 'assets/android-badge.gif?v=' + VERSION;
    else logo.src = (t === 'dark' ? 'assets/android-badge-dark.svg' : 'assets/android-badge-light.svg') + '?v=' + VERSION;
  }
  const fav = document.getElementById('favicon');
  if (fav) {
    const preferGif = localStorage.getItem('logoType') === 'gif';
    fav.href = preferGif ? ('assets/android-badge.gif?v=' + VERSION) : ((t === 'dark' ? 'assets/android-badge-dark.svg' : 'assets/android-badge-light.svg') + '?v=' + VERSION);
  }
  document.querySelectorAll('#bc-home').forEach(img => {
    img.src = (t === 'dark' ? 'assets/home-dark.svg' : 'assets/home-light.svg') + '?v=' + VERSION;
  });
}

function setupThemeToggle() {
  applyTheme(getPreferredTheme());
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.onclick = () => {
      const current = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      applyTheme(next);
    };
  }
}

async function loadManifest() {
  const override = localStorage.getItem('manifestOverride');
  let data;
  if (override) {
    try { data = JSON.parse(override); } catch { data = null; }
  }
  if (!data) {
    const res = await fetch('content/index.json?v=' + VERSION, { cache: 'no-cache', headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error('无法加载内容清单 index.json');
    data = await res.json();
  }
  state.manifest = data;
  // Build quick indices
  data.categories.forEach((cat, ci) => {
    state.categoryIndex[cat.id] = { ...cat, ci };
  });
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';
  state.manifest.categories.forEach((cat) => {
    const h = document.createElement('h2');
    h.textContent = cat.title;
    sidebar.appendChild(h);
    // Special: "写在开头" 作为单页入口，不展示子列表
    if (cat.id === 'intro' && cat.pages && cat.pages[0]) {
      h.classList.add('single');
      h.onclick = () => { location.hash = `#/${cat.id}/${cat.pages[0].id}`; };
      return;
    }
    const group = document.createElement('div');
    group.className = 'sidebar-group collapsible';
    sidebar.appendChild(group);
    const isCurrent = state.current.categoryId === cat.id;
    if (isCurrent) { h.classList.add('expanded'); group.classList.add('expanded'); setTimeout(() => { group.style.maxHeight = group.scrollHeight + 'px'; }, 0); }
    else { group.classList.add('collapsed'); }
    h.onclick = () => { location.hash = `#/category/${cat.id}`; };
    cat.pages.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'page-row';
      const fold = document.createElement('span');
      fold.className = 'page-fold';
      fold.textContent = p.children && p.children.length ? '▾' : '';
      const link = document.createElement('a');
      link.href = `#/${cat.id}/${p.id}`;
      link.textContent = p.title;
      if (state.current.categoryId === cat.id && state.current.pageId === p.id) link.classList.add('active');
      row.appendChild(fold);
      row.appendChild(link);
      group.appendChild(row);
      if (!p.children || p.children.length === 0) {
        row.onclick = () => { location.hash = `#/${cat.id}/${p.id}`; };
        link.style.pointerEvents = 'none';
      }
      let childBox = null;
      if (p.children && p.children.length) {
        childBox = document.createElement('div');
        childBox.className = 'children expanded';
        group.appendChild(childBox);
        p.children.forEach(c => {
          const ca = document.createElement('a');
          ca.href = `#/${cat.id}/${c.id}`;
          ca.textContent = c.title;
          if (state.current.categoryId === cat.id && state.current.pageId === c.id) ca.classList.add('active');
          childBox.appendChild(ca);
        });
        row.onclick = () => {
          const collapsed = childBox.classList.contains('collapsed');
          if (collapsed) {
            childBox.classList.remove('collapsed');
            childBox.classList.add('expanded');
            childBox.style.maxHeight = childBox.scrollHeight + 'px';
            fold.classList.remove('collapsed');
          } else {
            childBox.style.maxHeight = '0px';
            childBox.classList.add('collapsed');
            childBox.classList.remove('expanded');
            fold.classList.add('collapsed');
          }
        };
      }
    });
  });
}

function makeCollapsibleSections() {
  const body = document.getElementById('doc-body');
  const children = Array.from(body.children);
  let content = null;
  children.forEach(node => {
    const tag = node.tagName ? node.tagName.toLowerCase() : '';
    if (tag === 'h2' || tag === 'h3') {
      const wrapper = document.createElement('div');
      wrapper.className = 'section';
      const title = node;
      title.classList.add('section-title');
      const container = document.createElement('div');
      container.className = 'section-content';
      body.insertBefore(wrapper, title);
      body.removeChild(title);
      wrapper.appendChild(title);
      wrapper.appendChild(container);
      title.onclick = () => { wrapper.classList.toggle('collapsed'); };
      content = container;
    } else if (content) {
      content.appendChild(node);
    }
  });
}

async function loadDoc(catId, pageId) {
  const cat = state.categoryIndex[catId];
  if (!cat) return;
  const page = findPage(cat, pageId);
  if (!page) return;
  const key = `${catId}/${pageId}`;
  if (!state.docCache[key]) {
    const res = await fetch(`content/${page.file}?v=${VERSION}`, { cache: 'no-cache', headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error(`无法加载文档 ${page.file}`);
    const md = await res.text();
    state.docCache[key] = md;
  }
  const md = state.docCache[key];
  const titleEl = document.getElementById('doc-title');
  const bodyEl = document.getElementById('doc-body');
  const resultsEl = document.getElementById('search-results');
  resultsEl.hidden = true;
  titleEl.textContent = page.title;
  bodyEl.innerHTML = marked.parse(md);
  bodyEl.style.display = '';
  if (window.hljs) window.hljs.highlightAll();
  makeCollapsibleSections();
  enhanceMedia();
  renderBreadcrumb(catId, page);
  const toolbar = document.getElementById('doc-toolbar');
  if (toolbar) toolbar.hidden = false;
  const cards = document.getElementById('index-cards');
  if (cards) { cards.hidden = true; cards.innerHTML = ''; }
  if (titleEl) {
    titleEl.onclick = null;
    titleEl.classList.remove('has-children');
  }
  state.current = { categoryId: catId, pageId };
  const tocEl = document.getElementById('toc');
  if (tocEl) {
    tocEl.style.display = '';
    buildTOC();
  }
  renderSidebar();
  updatePrevNext(catId, pageId);
  window.scrollTo({ top: 0, behavior: 'auto' });
  // keep sidebar state across navigation on mobile
  if (window.__pendingSearchTerm) {
    if (window.__pendingAnchor) {
      ensureSectionVisible(window.__pendingAnchor);
      const el = document.getElementById(window.__pendingAnchor);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    highlightInDoc(window.__pendingSearchTerm);
    window.__pendingAnchor = null;
    window.__pendingSearchTerm = null;
  }
}

function updatePrevNext(catId, pageId) {
  const all = flattenAllPages();
  const idx = all.findIndex(p => p.catId === catId && p.id === pageId);
  if (idx === -1) return;
  const prev = all[idx - 1];
  const next = all[idx + 1];
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (prevBtn && nextBtn) {
    prevBtn.disabled = !prev;
    nextBtn.disabled = !next;
    prevBtn.onclick = () => { if (prev) location.hash = `#/${prev.catId}/${prev.id}`; };
    nextBtn.onclick = () => { if (next) location.hash = `#/${next.catId}/${next.id}`; };
  }

  const bottom = document.getElementById('bottom-nav');
  const bPrev = document.getElementById('bottom-prev');
  const bNext = document.getElementById('bottom-next');
  if (prev || next) bottom.hidden = false; else bottom.hidden = true;
  let visiblePrev = false, visibleNext = false;
  if (prev) {
    bPrev.hidden = false; bPrev.style.display = '';
    bPrev.href = `#/${prev.catId}/${prev.id}`;
    bPrev.innerHTML = `<div class="meta">上一页</div><div class="title">${prev.title}</div>`;
    visiblePrev = true;
  } else {
    bPrev.hidden = true; bPrev.style.display = 'none';
    bPrev.removeAttribute('href');
    bPrev.innerHTML = '';
  }
  if (next) {
    bNext.hidden = false; bNext.style.display = '';
    bNext.href = `#/${next.catId}/${next.id}`;
    bNext.innerHTML = `<div class="meta">下一页</div><div class="title">${next.title}</div>`;
    visibleNext = true;
  } else {
    bNext.hidden = true; bNext.style.display = 'none';
    bNext.removeAttribute('href');
    bNext.innerHTML = '';
  }
  if (bottom) {
    bottom.style.display = bottom.hidden ? 'none' : 'flex';
    bottom.style.justifyContent = (visiblePrev && visibleNext) ? 'space-between' : (visibleNext ? 'flex-end' : 'flex-start');
  }
}

async function handleRoute() {
  const hash = location.hash.replace(/^#\//, '');
  if (!hash) {
    const home = getHomeCategory();
    if (home && home.pages && home.pages[0]) {
      location.hash = `#/${home.id}/${home.pages[0].id}`;
    } else {
      const firstCat = state.manifest.categories[0];
      const firstPage = firstCat.pages[0];
      location.hash = `#/${firstCat.id}/${firstPage.id}`;
    }
    return;
  }
  const parts = hash.split('/');
  if (parts[0] === 'category' && parts[1]) {
    await loadCategoryIndex(parts[1]);
    return;
  }
  const [catId, pageId] = parts;
  await loadDoc(catId, pageId);
}

function normalizeText(s) {
  return s.toLowerCase().replace(/\s+/g, '');
}

async function performSearch(q) {
  const input = q.trim();
  const resultsEl = document.getElementById('search-results');
  const bodyEl = document.getElementById('doc-body');
  const titleEl = document.getElementById('doc-title');
  if (!input) {
    resultsEl.hidden = true;
    const bc = document.getElementById('breadcrumb');
    if (bc) bc.innerHTML = '';
    // 恢复当前视图
    if (state.current && state.current.categoryId) {
      if (state.current.pageId) {
        await loadDoc(state.current.categoryId, state.current.pageId);
      } else {
        await loadCategoryIndex(state.current.categoryId);
      }
    } else {
      await handleRoute();
    }
    return;
  }
  await ensureSearchIndex();
  const nq = normalizeText(input);
  const re = new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const matches = [];
  for (const seg of state.searchIndex) {
    const hit = normalizeText(seg.text).includes(nq);
    if (hit) {
      let snippet = seg.text;
      const idx = seg.text.toLowerCase().indexOf(input.toLowerCase());
      const start = Math.max(0, idx - 40);
      const end = Math.min(seg.text.length, idx + input.length + 60);
      snippet = (start > 0 ? '…' : '') + seg.text.substring(start, end) + (end < seg.text.length ? '…' : '');
      const highlighted = snippet.replace(re, m => `<mark>${m}</mark>`);
      matches.push({
        catId: seg.catId,
        pageId: seg.pageId,
        pageTitle: seg.pageTitle,
        scope: seg.type === 'title' ? '标题' : (seg.type === 'heading' ? '段落' : '内容'),
        anchorId: seg.anchorId,
        snippetHtml: highlighted,
      });
    }
  }
  titleEl.textContent = `搜索：${input}`;
  bodyEl.innerHTML = '';
  resultsEl.innerHTML = '';
  const toolbar = document.getElementById('doc-toolbar'); if (toolbar) toolbar.hidden = true;
  const bottomNavEl = document.getElementById('bottom-nav');
  if (bottomNavEl) { bottomNavEl.hidden = true; bottomNavEl.style.display = 'none'; }
  const bc = document.getElementById('breadcrumb');
  if (bc) bc.innerHTML = `<span class="current">搜索结果</span>`;
  if (matches.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'result-item';
    empty.textContent = '未找到相关内容';
    resultsEl.appendChild(empty);
  } else {
    matches.forEach(r => {
      const item = document.createElement('div');
      item.className = 'result-item';
      const t = document.createElement('div');
      t.className = 'title';
      t.textContent = `${r.pageTitle} · ${r.scope}`;
      const s = document.createElement('div');
      s.className = 'snippet';
      s.innerHTML = r.snippetHtml || '';
      item.appendChild(t);
      item.appendChild(s);
      item.onclick = () => {
        window.__pendingAnchor = r.anchorId;
        window.__pendingSearchTerm = input;
        location.hash = `#/${r.catId}/${r.pageId}`;
      };
      resultsEl.appendChild(item);
    });
  }
  resultsEl.hidden = false;
}

function renderBreadcrumb(catId, page) {
  const bc = document.getElementById('breadcrumb');
  if (!bc) return;
  const cat = state.categoryIndex[catId];
  if (!cat || !page) { bc.innerHTML = ''; return; }
  const parent = findParent(cat, page.id);
  const homeCat = getHomeCategory();
  const homeHref = `#/${homeCat ? homeCat.id : catId}/${homeCat && homeCat.pages && homeCat.pages[0] ? homeCat.pages[0].id : (cat.pages[0] ? cat.pages[0].id : '')}`;
  const isDark = document.body.classList.contains('theme-dark');
  let trail = `
    <a href="${homeHref}" class="home-link"><img class="home-icon" id="bc-home" src="${isDark ? 'assets/home-dark.svg' : 'assets/home-light.svg'}" alt="首页"/></a>
  `;
  if (cat.id !== 'intro') {
    trail += `
      <span class="sep">›</span>
      <a href="#/category/${cat.id}">${cat.title}</a>
    `;
  }
  if (parent) {
    trail += `
      <span class="sep">›</span>
      <a href="#/${cat.id}/${parent.id}">${parent.title}</a>
    `;
  }
  trail += `
    <span class="sep">›</span>
    <a class="current" href="#/${cat.id}/${page.id}">${page.title}</a>
  `;
  bc.innerHTML = trail;
}

function flattenPages(cat) {
  const out = [];
  cat.pages.forEach(p => {
    out.push(p);
    if (p.children) p.children.forEach(c => out.push(c));
  });
  return out;
}

function flattenAllPages() {
  const out = [];
  state.manifest.categories.forEach(cat => {
    if (cat.id === 'guide') return;
    cat.pages.forEach(p => {
      out.push({ catId: cat.id, id: p.id, title: p.title });
      if (p.children) p.children.forEach(c => out.push({ catId: cat.id, id: c.id, title: c.title }));
    });
  });
  return out;
}

function findPage(cat, id) {
  for (const p of cat.pages) {
    if (p.id === id) return p;
    if (p.children) {
      const f = p.children.find(c => c.id === id);
      if (f) return f;
    }
  }
  return null;
}

function findParent(cat, id) {
  for (const p of cat.pages) {
    if (p.children && p.children.find(c => c.id === id)) return p;
  }
  return null;
}

function ensureSectionVisible(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const section = el.closest('.section');
  if (section && section.classList.contains('collapsed')) {
    section.classList.remove('collapsed');
  }
}

async function main() {
  setupMarkdown();
  await loadVersion();
  await loadManifest();
  renderSidebar();
  await handleRoute();
  window.addEventListener('hashchange', handleRoute);
  const searchEl = document.getElementById('search-input');
  if (searchEl) searchEl.addEventListener('input', (e) => performSearch(e.target.value));
  setupThemeToggle();
  setupLightbox();
  setupTopActions();
  setupMenuToggle();
  // mobile TOC disabled
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('assets/sw.js', { scope: '/' });
    } catch {}
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      location.reload();
    });
  }
}

async function loadVersion() {
  try {
    const res = await fetch('assets/version.json', { cache: 'no-cache', headers: { 'Cache-Control': 'no-cache' } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.version) VERSION = String(data.version);
    }
  } catch {}
}

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-');
}

function buildTOC() {
  const toc = document.getElementById('toc');
  toc.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = '目录';
  toc.appendChild(title);
  const headings = Array.from(document.querySelectorAll('#doc-body h1, #doc-body h2, #doc-body h3, #doc-body h4, #doc-body h5'));
  const rootUl = document.createElement('ul');
  rootUl.className = 'toc-list';
  toc.appendChild(rootUl);
  const stack = [{ level: 0, ul: rootUl, li: null }];
  headings.forEach((h, i) => {
    const level = parseInt(h.tagName.substring(1), 10);
    const text = h.textContent || '';
    const id = h.id || slugify(text);
    h.id = id;
    while (stack.length && level <= stack[stack.length - 1].level) stack.pop();
    const parent = stack[stack.length - 1];
    const li = document.createElement('li');
    li.className = 'toc-item';
    const row = document.createElement('div');
    row.className = `toc-row lvl-${level}`;
    const fold = document.createElement('span');
    fold.className = 'fold';
    fold.textContent = '▾';
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = text;
    row.appendChild(fold);
    row.appendChild(label);
    row.dataset.target = id;
    row.onclick = (e) => {
      setActiveTOC(id);
      ensureSectionVisible(id);
      const el = document.getElementById(id);
      if (el) {
        window.__tocProgrammaticUntil = Date.now() + 600;
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
      // mobile TOC disabled
    };
    li.appendChild(row);
    parent.ul.appendChild(li);
    const next = headings[i + 1];
    const nextLevel = next ? parseInt(next.tagName.substring(1), 10) : 0;
    if (next && nextLevel > level) {
      const ul = document.createElement('ul');
      ul.className = 'collapsible expanded';
      li.appendChild(ul);
      fold.onclick = (e) => {
        e.stopPropagation();
        const collapsed = ul.classList.contains('collapsed');
        if (collapsed) {
          ul.classList.remove('collapsed');
          ul.classList.add('expanded');
          ul.style.maxHeight = ul.scrollHeight + 'px';
          li.classList.remove('collapsed');
        } else {
          ul.style.maxHeight = '0px';
          ul.classList.add('collapsed');
          ul.classList.remove('expanded');
          li.classList.add('collapsed');
        }
      };
      stack.push({ level, ul, li });
    } else {
      fold.style.visibility = 'hidden';
      stack.push({ level, ul: document.createElement('ul'), li });
    }
  });
  updateTOCActive();
  window.addEventListener('scroll', updateTOCActive, { passive: true });
}

function setupIndexCards(catId, page) {
  const container = document.getElementById('index-cards');
  const bodyEl = document.getElementById('doc-body');
  const titleEl = document.getElementById('doc-title');
  const items = page.children && page.children.length ? page.children : state.categoryIndex[catId].pages;
  titleEl.classList.toggle('has-children', items && items.length);
  if (!items || items.length === 0) { container.hidden = true; return; }
  container.innerHTML = '';
  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';
    const ct = document.createElement('div'); ct.className = 'card-title'; ct.textContent = it.title;
    const cd = document.createElement('div'); cd.className = 'card-desc'; cd.textContent = it.summary || '';
    card.appendChild(ct); card.appendChild(cd);
    card.onclick = () => { location.hash = `#/${catId}/${it.id}`; };
    container.appendChild(card);
  });
  titleEl.onclick = () => {
    const showing = !container.hidden;
    container.hidden = showing;
    bodyEl.style.display = showing ? '' : 'none';
  };
}

async function loadCategoryIndex(catId) {
  const cat = state.categoryIndex[catId];
  if (!cat) return;
  const titleEl = document.getElementById('doc-title');
  const bodyEl = document.getElementById('doc-body');
  const resultsEl = document.getElementById('search-results');
  resultsEl.hidden = true;
  titleEl.textContent = cat.title;
  bodyEl.innerHTML = '';
  const toolbar = document.getElementById('doc-toolbar'); if (toolbar) toolbar.hidden = true;
  setupCategoryCards(catId);
  renderBreadcrumbForCategory(catId);
  state.current = { categoryId: catId, pageId: null };
  renderSidebar();
  updatePrevNextForCategory(catId);
  window.scrollTo({ top: 0, behavior: 'auto' });
  // keep sidebar state across navigation on mobile
}

function setupCategoryCards(catId) {
  const container = document.getElementById('index-cards');
  const bodyEl = document.getElementById('doc-body');
  const pages = state.categoryIndex[catId].pages || [];
  container.innerHTML = '';
  pages.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';
    const ct = document.createElement('div'); ct.className = 'card-title'; ct.textContent = it.title;
    const cd = document.createElement('div'); cd.className = 'card-desc'; cd.textContent = it.summary || '';
    card.appendChild(ct); card.appendChild(cd);
    card.onclick = () => { location.hash = `#/${catId}/${it.id}`; };
    container.appendChild(card);
  });
  container.hidden = false;
  bodyEl.style.display = 'none';
}

function renderBreadcrumbForCategory(catId) {
  const bc = document.getElementById('breadcrumb');
  if (!bc) return;
  const cat = state.categoryIndex[catId];
  const homeCat = getHomeCategory();
  const homeHref = `#/${homeCat ? homeCat.id : catId}/${homeCat && homeCat.pages && homeCat.pages[0] ? homeCat.pages[0].id : (cat.pages[0] ? cat.pages[0].id : '')}`;
  const isDark2 = document.body.classList.contains('theme-dark');
  bc.innerHTML = `
    <a href="${homeHref}" class="home-link"><img class="home-icon" id="bc-home" src="${isDark2 ? 'assets/home-dark.svg' : 'assets/home-light.svg'}" alt="首页"/></a>
    <span class="sep">›</span>
    <a class="current" href="#/category/${cat.id}">${cat.title}</a>
  `;
}

function getHomeCategory() {
  const byId = state.manifest.categories.find(c => c.id === 'intro');
  if (byId) return byId;
  const byTitle = state.manifest.categories.find(c => c.title === '写在开头');
  return byTitle || state.manifest.categories[0];
}

function setupTopActions() {
  const newBtn = document.getElementById('new-cat-btn');
  const exportBtn = document.getElementById('export-btn');
  if (newBtn) {
    newBtn.onclick = () => {
      const title = prompt('请输入新分类名称');
      if (!title) return;
      const id = slugify(title.replace(/\s+/g, ' '));
      if (state.categoryIndex[id]) { alert('该分类已存在'); return; }
      const cat = { id, title, pages: [] };
      state.manifest.categories.push(cat);
      state.categoryIndex[id] = { ...cat, ci: state.manifest.categories.length - 1 };
      localStorage.setItem('manifestOverride', JSON.stringify(state.manifest));
      renderSidebar();
      alert('已创建分类：' + title + '（请在 content/ 下添加页面并更新清单后提交到仓库）');
    };
  }
  if (exportBtn) {
    exportBtn.onclick = () => {
      const blob = new Blob([JSON.stringify(state.manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'index.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  }
}

function setupMenuToggle() {
  const btn = document.getElementById('menu-toggle');
  const overlay = document.getElementById('mobile-overlay');
  if (btn) btn.onclick = () => {
    const willShow = !document.body.classList.contains('show-sidebar');
    document.body.classList.toggle('show-sidebar');
    document.body.style.overflow = willShow ? 'hidden' : '';
  };
  if (overlay) overlay.onclick = () => { document.body.classList.remove('show-sidebar'); document.body.style.overflow = ''; };
}

/* TOC mobile toggle removed */

async function ensureSearchIndex() {
  if (state.searchIndex) return;
  const list = [];
  for (const cat of state.manifest.categories) {
    for (const p of cat.pages) {
      list.push({ catId: cat.id, pageId: p.id, pageTitle: p.title, file: p.file });
      if (p.children) p.children.forEach(c => list.push({ catId: cat.id, pageId: c.id, pageTitle: c.title, file: c.file }));
    }
  }
  const index = [];
  for (const it of list) {
    const res = await fetch(`content/${it.file}?v=${VERSION}`, { cache: 'no-cache', headers: { 'Cache-Control': 'no-cache' } });
    const md = await res.text();
    const tokens = marked.lexer(md);
    let lastHeadingId = null;
    index.push({ type: 'title', text: it.pageTitle, anchorId: null, catId: it.catId, pageId: it.pageId, pageTitle: it.pageTitle });
    tokens.forEach(tok => {
      if (tok.type === 'heading') {
        const id = slugify(tok.text || '');
        lastHeadingId = id;
        index.push({ type: 'heading', text: tok.text || '', anchorId: id, catId: it.catId, pageId: it.pageId, pageTitle: it.pageTitle });
      } else if (tok.type === 'paragraph' || tok.type === 'text') {
        const t = typeof tok.text === 'string' ? tok.text.replace(/[#*_`>\-]/g, ' ') : '';
        if (t.trim()) index.push({ type: 'paragraph', text: t, anchorId: lastHeadingId, catId: it.catId, pageId: it.pageId, pageTitle: it.pageTitle });
      } else if (tok.type === 'list') {
        const t = (tok.items || []).map(i => i.text).join(' ');
        if (t.trim()) index.push({ type: 'paragraph', text: t, anchorId: lastHeadingId, catId: it.catId, pageId: it.pageId, pageTitle: it.pageTitle });
      }
    });
  }
  state.searchIndex = index;
}

function highlightInDoc(term) {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const container = document.getElementById('doc-body');
  const nodes = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, p, li'));
  nodes.forEach(el => {
    if (el.closest('pre, code')) return;
    const html = el.innerHTML;
    const replaced = html.replace(re, m => `<mark>${m}</mark>`);
    if (replaced !== html) el.innerHTML = replaced;
  });
}

function updateTOCActive() {
  if (window.__tocProgrammaticUntil && Date.now() < window.__tocProgrammaticUntil) return;
  const headings = Array.from(document.querySelectorAll('#doc-body h1, #doc-body h2, #doc-body h3, #doc-body h4, #doc-body h5'));
  const links = Array.from(document.querySelectorAll('#toc .toc-row[data-target]'));
  let currentId = null;
  const offset = 90;
  for (const h of headings) {
    const top = h.getBoundingClientRect().top;
    if (top - offset <= 0) currentId = h.id; else break;
  }
  links.forEach(a => a.parentElement.classList.remove('active'));
  if (currentId) {
    const active = links.find(a => a.dataset.target === currentId);
    if (active) active.parentElement.classList.add('active');
  }
}

function setActiveTOC(id) {
  const links = Array.from(document.querySelectorAll('#toc .toc-row[data-target]'));
  links.forEach(a => a.parentElement.classList.remove('active'));
  const target = links.find(a => a.dataset.target === id);
  if (target) target.parentElement.classList.add('active');
}

function withVersion(u) {
  if (!u) return u;
  if (/^https?:\/\//.test(u)) return u;
  return u + (u.includes('?') ? '&' : '?') + 'v=' + VERSION;
}

function ensureContentPath(src) {
  if (!src) return src;
  if (/^https?:\/\//.test(src)) return src;
  if (src.startsWith('/') || src.startsWith('content/')) return src;
  return 'content/' + src.replace(/^\.\//, '');
}

function setupLightbox() {
  if (document.getElementById('lightbox')) return;
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.id = 'lightbox';
  const img = document.createElement('img');
  lb.appendChild(img);
  lb.onclick = () => lb.classList.remove('show');
  document.body.appendChild(lb);
}

function showLightbox(src) {
  const lb = document.getElementById('lightbox');
  const img = lb.querySelector('img');
  img.src = src;
  lb.classList.add('show');
}

function enhanceMedia() {
  const body = document.getElementById('doc-body');
  const imgs = Array.from(body.querySelectorAll('img'));
  imgs.forEach(img => {
    img.loading = 'lazy';
    img.src = withVersion(ensureContentPath(img.getAttribute('src')));
    const alt = img.getAttribute('alt');
    const fig = document.createElement('figure');
    const parent = img.parentElement;
    parent.insertBefore(fig, img);
    parent.removeChild(img);
    fig.appendChild(img);
    if (alt) { const cap = document.createElement('figcaption'); cap.textContent = alt; fig.appendChild(cap); }
    img.style.cursor = 'zoom-in';
    img.onclick = () => showLightbox(img.src);
  });
}

main().catch(err => {
  const c = document.getElementById('content');
  c.innerHTML = `<div class="result-item">初始化失败：${err.message}</div>`;
});
function updatePrevNextForCategory(catId) {
  const all = flattenAllPages();
  const cat = state.categoryIndex[catId];
  if (!cat || !cat.pages || !cat.pages[0]) return;
  const first = { catId, id: cat.pages[0].id, title: cat.pages[0].title };
  const idx = all.findIndex(p => p.catId === first.catId && p.id === first.id);
  const prev = all[idx - 1];
  const next = first;
  const bottom = document.getElementById('bottom-nav');
  const bPrev = document.getElementById('bottom-prev');
  const bNext = document.getElementById('bottom-next');
  if (!bottom || !bPrev || !bNext) return;
  if (prev || next) bottom.hidden = false; else bottom.hidden = true;
  let visiblePrev = false, visibleNext = false;
  if (prev) {
    bPrev.hidden = false; bPrev.style.display = '';
    bPrev.href = `#/${prev.catId}/${prev.id}`;
    bPrev.innerHTML = `<div class=\"meta\">上一页</div><div class=\"title\">${prev.title}</div>`;
    visiblePrev = true;
  } else {
    bPrev.hidden = true; bPrev.style.display = 'none'; bPrev.removeAttribute('href'); bPrev.innerHTML = '';
  }
  if (next) {
    bNext.hidden = false; bNext.style.display = '';
    bNext.href = `#/${next.catId}/${next.id}`;
    bNext.innerHTML = `<div class=\"meta\">下一页</div><div class=\"title\">${next.title}</div>`;
    visibleNext = true;
  } else {
    bNext.hidden = true; bNext.style.display = 'none'; bNext.removeAttribute('href'); bNext.innerHTML = '';
  }
  bottom.style.display = bottom.hidden ? 'none' : 'flex';
  bottom.style.justifyContent = (visiblePrev && visibleNext) ? 'space-between' : (visibleNext ? 'flex-end' : 'flex-start');
}
function setupMarkdown() {
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      langPrefix: 'language-',
      highlight: (code, lang) => {
        if (typeof hljs !== 'undefined') {
          try {
            if (lang && hljs.getLanguage(lang)) {
              return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
          } catch (e) { return code; }
        }
        return code;
      },
    });
  }
}
