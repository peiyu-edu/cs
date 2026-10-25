import * as content from './data.js';
const { modules, lessons, glossary, sources } = content;
import { mountLab } from './labs.js';

const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];
const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  home: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  path: '<path d="M5 4v13a3 3 0 0 0 3 3h11M5 8h12a3 3 0 0 1 0 6H9"/><circle cx="5" cy="4" r="2"/><circle cx="19" cy="20" r="2"/>',
  flask: '<path d="M9 3h6m-5 0v7L4 19a1.3 1.3 0 0 0 1 2h14a1.3 1.3 0 0 0 1-2l-6-9V3M7 15h10"/><path d="M10 17h.01M14 19h.01"/>',
  book: '<path d="M12 5C8 2 3 4 3 4v16s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1v16"/>',
  chart: '<path d="M4 3v17h17M8 15v-4m5 4V7m5 8v-6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 20"/>',
  binary: '<rect x="3" y="5" width="7" height="14" rx="3"/><path d="m15 8 3-3v14m-3 0h6"/>',
  nodes: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="m10.5 8-4 8m7-8 4 8"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.code}</svg>`;
const fresh = () => ({ visited: [], mastered: [], bookmarks: [], answers: {}, predictions: {}, notes: {}, cards: [], last: null, activity: [] });
let state = fresh();
try {
  const stored = JSON.parse(localStorage.getItem('peiyu-cs-v1') || 'null');
  if (stored && typeof stored === 'object') {
    state = { ...fresh(), ...stored };
    for (const key of ['visited', 'mastered', 'bookmarks', 'cards', 'activity']) if (!Array.isArray(state[key])) state[key] = [];
    for (const key of ['answers', 'predictions', 'notes']) if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) state[key] = {};
  }
} catch { /* A fresh learning space is still usable without storage. */ }
let cleanups = [], route, moduleFilter = 'all', labType = 'binary', quizChoice = null;
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2800); }
function save() { try { localStorage.setItem('peiyu-cs-v1', JSON.stringify(state)); } catch { toast('浏览器未允许保存，当前学习仍可继续。'); } }
function log(text) { state.activity.unshift({ text, time: new Date().toISOString() }); state.activity = state.activity.slice(0, 30); }
function go(path) { if (location.hash === `#/${path}`) render(); else location.hash = `#/${path}`; }
const lessonById = id => lessons.find(l => l.id === id);
const completed = id => state.mastered.includes(id);
const progress = ids => Math.round(ids.filter(completed).length / (ids.length || 1) * 100);
function currentRoute() { const raw = location.hash.slice(2).split('?'); return { parts: (raw[0] || 'home').split('/'), params: new URLSearchParams(raw[1] || '') }; }

const nav = [ ['home', 'home', '学习概览'], ['courses', 'path', '学习路径'], ['labs', 'flask', '交互实验室'], ['wiki', 'book', '知识卡片'], ['records', 'chart', '我的学习'] ];
function shell(content) {
  const active = route.parts[0] === 'lesson' ? 'courses' : route.parts[0];
  const title = route.parts[0] === 'lesson' ? '课程学习' : nav.find(n => n[0] === active)?.[2] || '关于培玉 CS';
  return `<div class="workspace">
    <aside class="sidebar" id="sidebar" aria-label="主导航">
      <a class="brand" href="#/home"><img src="./logo.svg" alt="培玉" width="39" height="39"><span>培玉 <strong>CS</strong><small>计算机科学 · 从好奇出发</small></span></a>
      <div class="space-label">我的学习空间 <span class="tiny-dot"></span></div>
      <nav>${nav.map(([id, glyph, name]) => `<a href="#/${id}" class="nav-link ${id === active ? 'active' : ''}" ${id === active ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${name}</span>${id === 'labs' ? '<span class="nav-new">动手试</span>' : ''}</a>`).join('')}</nav>
      <div class="sidebar-note"><div class="little-sprout" aria-hidden="true">{ <span>✦</span> }</div><p>把问题拆小，<br>把理解做深。</p><small>每天一个小发现。</small></div>
      <div class="sidebar-bottom"><a href="#/about">${icon('info')}关于这个学习空间</a><div class="local-note"><span class="tiny-dot"></span>进度保存在此浏览器</div></div>
    </aside>
    <div class="sidebar-shade" data-menu-close></div>
    <div class="main-area"><header class="topbar"><div class="breadcrumbs"><button class="icon-button mobile-menu" data-menu aria-label="展开导航">${icon('menu')}</button><span>学习空间</span>${icon('chevron')}<strong>${title}</strong></div><div class="topbar-right"><button class="search-trigger" data-search aria-label="搜索课程和概念">${icon('search')}<span>搜索课程、概念…</span><kbd>⌘ K</kbd></button><span class="avatar" title="本机学习空间" aria-label="本机学习空间">培</span></div></header>
    <main id="main" tabindex="-1">${content}</main><footer class="footer"><span>培玉 CS <span class="footer-sep">/</span> 给好奇心一个探索的地方</span><a href="#/about">关于与参考</a></footer></div></div>`;
}
function pageHead(title, sub, extra = '') { return `<div class="page-heading"><div><h1>${title}</h1><p>${sub}</p></div>${extra}</div>`; }
function moduleArt(m) {
  if (m.id === 'foundations') return '<div class="course-art binary-art" aria-hidden="true"><span>0</span><span class="lit">1</span><span>0</span><span class="lit">1</span><i>信息，有了自己的语言。</i></div>';
  if (m.id === 'python') return '<div class="course-art code-art" aria-hidden="true"><code><span>for</span> idea <span>in</span> curiosity:<br>&nbsp;&nbsp;&nbsp;&nbsp;<b>build</b>(idea)</code><i>让想法，开始运行。</i></div>';
  return '<div class="course-art tree-art" aria-hidden="true"><svg viewBox="0 0 240 90"><path d="M120 20 65 65M120 20l55 45"/><circle cx="120" cy="20" r="14"/><circle cx="65" cy="65" r="14"/><circle cx="175" cy="65" r="14"/><text x="120" y="25">8</text><text x="65" y="70">3</text><text x="175" y="70">12</text></svg><i>找到解决问题的好办法。</i></div>';
}
function home() {
  const last = lessonById(state.last) || lessons[0];
  return `${pageHead('你好，探索者。', '每一个「为什么」，都可以成为一次新的发现。', '<span class="quiet-tag">循序渐进 · 动手理解</span>')}
    <section class="hero"><div class="hero-copy"><span class="hero-label"><span class="tiny-dot"></span>培玉计算机科学</span><h2>从 0 和 1，<br>理解一个新的世界。</h2><p>把抽象的概念变成看得见的实验。<br>从第一段思考，到亲手解决一个问题。</p><div class="hero-actions"><a class="button primary" href="#/lesson/${last.id}">${state.last ? '继续学习' : '开启第一课'}${icon('arrow')}</a><a class="text-button" href="#/labs">先玩一个实验 ${icon('chevron')}</a></div><div class="hero-caption">${icon('clock')}每节约 10–15 分钟，按自己的节奏来。</div></div>
    <div class="hero-playground"><div class="playground-top"><span><span class="live-dot"></span>二进制，试着点一下</span><span class="code-label">8 bit</span></div><div class="bitboard">${[0,1,0,0,0,0,0,1].map((v,i) => `<div><span class="bit-weight">${2 ** (7-i)}</span><button class="hero-bit ${v ? 'on' : ''}" aria-label="位权 ${2 ** (7-i)}，当前 ${v}" aria-pressed="${!!v}" data-bit="${i}">${v}</button></div>`).join('')}</div><div class="bit-connector"><span></span>${icon('arrow')}<span></span></div><div class="binary-result"><div><span>十进制</span><strong id="hero-decimal">65</strong></div><span class="equals">=</span><div><span>ASCII 字符</span><strong id="hero-character">A</strong></div></div><p class="playground-hint" id="hero-bit-hint">一个字母的背后，是一组开与关。</p></div></section>
    <section class="journey-section"><div class="section-heading"><div><h2>一条清晰的学习路径</h2><p>先建立直觉，再写下代码，最后学会更好地解决问题。</p></div><a class="text-button" href="#/courses">查看全部课程 ${icon('arrow')}</a></div><div class="journey-grid">${modules.map((m,i) => `<a class="journey-card ${m.color}" href="#/courses?module=${m.id}"><div class="course-top"><span class="stage">阶段 ${['一','二','三'][i]}</span><span class="level-label">${m.level}</span></div>${moduleArt(m)}<div class="course-heading">${icon(m.icon)}<h3>${m.title}</h3>${icon('arrow')}</div><p>${m.subtitle}</p><div class="course-bottom"><span>${m.lessons.length} 节精选课程</span><span>${progress(m.lessons) ? `已掌握 ${progress(m.lessons)}%` : '从这里出发'}</span></div></a>`).join('')}</div></section>
    <div class="home-lower"><section class="next-lesson"><div class="section-heading"><h2>${state.last ? '接着上次的发现' : '你的第一步'}</h2><span class="quiet-tag">${state.last ? '学习足迹' : '零基础友好'}</span></div><div class="next-body"><div class="lesson-glyph">${icon(state.last ? 'book' : 'binary')}</div><div><span class="small-muted">${modules.find(m=>m.id === last.module)?.title} / ${last.tag}</span><h3>${last.title}</h3><p>${last.summary}</p></div><a class="round-arrow" aria-label="学习${escape(last.title)}" href="#/lesson/${last.id}">${icon('arrow')}</a></div></section><section class="curiosity"><span class="curiosity-icon">${icon('spark')}</span><div><span class="small-muted">留给好奇心的一分钟</span><h3>为什么二分查找每次都能排除一半？</h3><a href="#/lesson/search">用一个实验找到答案 ${icon('chevron')}</a></div></section></div>
    <section class="learning-loop"><span>在培玉，你会这样学习</span><div><span>先想一想</span>${icon('chevron')}<span>看懂概念</span>${icon('chevron')}<span>动手试试</span>${icon('chevron')}<span>检查理解</span></div><span>理解，比赶进度更重要。</span></section>`;
}
function courses() {
  const chosen = route.params.get('module');
  moduleFilter = chosen && modules.some(m=>m.id===chosen) ? chosen : 'all';
  return `${pageHead('沿着好奇，走得更远。', '三段路线，九个起点。每节都包含讲解、动手探索和一题检查。')}
  <div class="filter-bar" role="group" aria-label="筛选课程">${[['all','全部课程'],...modules.map(m=>[m.id,m.title])].map(([id,label])=>`<button class="chip ${moduleFilter===id?'active':''}" data-filter="${id}">${label}</button>`).join('')}<span class="filter-note">${state.mastered.length} / ${lessons.length} 节已掌握</span></div>
  <div class="course-list">${modules.filter(m=>moduleFilter==='all'||m.id===moduleFilter).map((m,i)=>`<section class="module-panel ${m.color}"><div class="module-intro"><span class="module-symbol">${icon(m.icon)}</span><div><span class="small-muted">${m.level} · ${m.lessons.length} 节课</span><h2>${m.title}</h2><p>${m.description || m.subtitle}</p></div><div class="module-progress"><span>${progress(m.lessons)}%</span><div class="progress-track"><i style="width:${progress(m.lessons)}%"></i></div></div></div><div class="lesson-rows">${m.lessons.map((id,j)=>{const l=lessonById(id);return `<a class="lesson-row" href="#/lesson/${id}"><span class="lesson-index ${completed(id)?'done':''}">${completed(id)?icon('check'):String(j+1).padStart(2,'0')}</span><div><h3>${l.title}</h3><p>${l.summary}</p></div><span class="lesson-time">${icon('clock')}${l.duration} 分钟</span><span class="status ${completed(id)?'done':state.visited.includes(id)?'started':''}">${completed(id)?'已掌握':state.visited.includes(id)?'学习中':'开始学习'}</span>${icon('chevron')}</a>`}).join('')}</div></section>`).join('')}</div>${furtherHTML()}`;
}
const labMeta = {binary:{title:'二进制开关',desc:'拨动 8 个开关，看数字和字母如何被表示。',icon:'binary',lesson:'binary',tag:'信息表示'},logic:{title:'逻辑门电路',desc:'组合两个输入，观察与、或、异或的区别。',icon:'code',lesson:'logic',tag:'布尔逻辑'},sorting:{title:'冒泡排序剧场',desc:'逐步比较、交换，看一组数字如何排好队。',icon:'chart',lesson:'sorting',tag:'算法可视化'},search:{title:'二分查找探险',desc:'每次把范围减半，找出藏在序列里的数字。',icon:'search',lesson:'search',tag:'算法可视化'}};
function labs() {
  labType = route.parts[1] && labMeta[route.parts[1]] ? route.parts[1] : 'binary';
  return `${pageHead('抽象的概念，亲手试出来。', '不用安装，不怕试错。改变一个输入，看看会发生什么。')}<div class="lab-tabs" role="group" aria-label="选择实验">${Object.entries(labMeta).map(([id,l])=>`<a href="#/labs/${id}" class="lab-tab ${id===labType?'active':''}" ${id===labType?'aria-current="true"':''}>${icon(l.icon)}${l.title}</a>`).join('')}</div><section class="experiment-panel"><div class="experiment-title"><div><span class="small-muted">${labMeta[labType].tag}</span><h2>${labMeta[labType].title}</h2><p>${labMeta[labType].desc}</p></div><a class="button secondary" href="#/lesson/${labMeta[labType].lesson}">学习相关课程 ${icon('arrow')}</a></div><div id="active-lab"></div></section><div class="lab-tip">${icon('info')}<span>试试先预测结果，再点击操作。能解释「为什么」，才是这次实验最好的收获。</span></div>`;
}
function quizHTML(l, isPractice = false) {
  const answer = state.answers[l.id];
  return `<section class="quiz-panel" id="practice"><div class="section-number">${isPractice ? icon('spark') : '04'}</div><div class="quiz-content"><span class="small-muted">检查理解 · ${l.tag}</span><h2>${isPractice ? '再想一遍，理解会更深。' : '把刚刚的发现，用起来。'}</h2><p class="quiz-prompt">${l.question.prompt}</p><form data-quiz="${l.id}"><fieldset><legend class="sr-only">${escape(l.question.prompt)}</legend>${l.question.options.map((o,i)=>`<label class="quiz-option"><input type="radio" name="answer" value="${i}" required ${answer?.choice===i?'checked':''}><span class="option-letter">${'ABCD'[i]}</span><span>${escape(o)}</span></label>`).join('')}</fieldset><div class="quiz-actions"><button class="button primary" type="submit">检查答案 ${icon('check')}</button><button class="text-button" type="button" data-hint="${l.id}">给我一点提示</button></div><div class="quiz-feedback" aria-live="polite">${answer?`<div class="feedback-box ${answer.correct?'success':'try-again'}"><strong>${answer.correct?'这道题已答对，也可以再次验证理解。':'上次的选择已保留，可以修改后再试。'}</strong><p>${l.question.explanation}</p></div>`:''}</div></form></div></section>`;
}
function miniCode(l) {
  const configs = {
    algorithm: { label:'一共有多少本书？', value:8, min:1, max:32, action:'拆解步骤', text:v=>`任务：逐本贴标签。\n1. 准备 ${v} 本书和标签。\n2. 每次取出一本，贴好标签。\n3. 重复 ${v} 次。\n4. 检查：已贴标签 ${v} 本，剩余 0 本。` },
    variable:{label:'给变量 score 一个新值',value:10,min:0,max:100,action:'运行赋值',text:v=>`score = ${v}\nscore = score + 5\nprint(score)\n\n输出：${v+5}\n解释：先读取旧值 ${v}，加 5 后，把 ${v+5} 存回 score。`},
    condition:{label:'这次考了多少分？',value:75,min:0,max:100,action:'运行判断',text:v=>`score = ${v}\nif score >= 60:\n    print("通过")\nelse:\n    print("再练习一次")\n\n判断 ${v} >= 60 为 ${v>=60?'True':'False'}\n输出：${v>=60?'通过':'再练习一次'}`},
    loop:{label:'想让循环重复几次？',value:3,min:1,max:8,action:'逐行展开',text:v=>`for i in range(${v}):\n    print(i)\n\n${Array.from({length:v},(_,i)=>`第 ${i+1} 次：i = ${i}，输出 ${i}`).join('\n')}\n循环结束，共输出 ${v} 个数字。`},
    complexity:{label:'有序数组有多少个元素？',value:16,min:1,max:1024,action:'比较查找次数',text:v=>`规模 n = ${v}\n\n线性查找：最坏需比较 ${v} 次。\n二分查找：最坏需比较 ${Math.floor(Math.log2(v))+1} 次。\n\n当数据已经有序，每次将候选区间减半，\n增长速度就从 O(n) 变为 O(log n)。`}
  };
  const c=configs[l.id] || configs.algorithm;
  return `<div class="mini-code" data-mini="${l.id}"><div class="mini-code-controls"><label>${c.label}<input type="number" min="${c.min}" max="${c.max}" value="${c.value}" data-mini-input></label><button class="button secondary" data-mini-run>${icon('code')}${c.action}</button></div><pre data-mini-output aria-live="polite">${escape(c.text(c.value))}</pre><p class="small-muted">这是本课的固定规则演示。修改数值，再观察运行过程。</p></div>`;
}
function lessonView(id) {
  const l = lessonById(id);
  if (!l) return `<div class="empty-state"><h1>还没有这节课</h1><p>回到学习路径，选择一个感兴趣的问题。</p><a class="button primary" href="#/courses">查看学习路径</a></div>`;
  if (!state.visited.includes(id)) state.visited.push(id);
  state.last=id; save();
  const m=modules.find(m=>m.id===l.module), idx=lessons.indexOf(l), next=lessons[idx+1];
  return `<a href="#/courses" class="back-link">${icon('arrow','flip')}返回学习路径</a><div class="lesson-layout"><aside class="lesson-outline"><span class="small-muted">${m.title}</span><h2>这一段学习旅程</h2>${m.lessons.map((key,i)=>`<a class="outline-item ${key===id?'active':''}" href="#/lesson/${key}" ${key===id?'aria-current="page"':''}><span>${completed(key)?icon('check'):i+1}</span>${lessonById(key).title}</a>`).join('')}<div class="outline-tip">${icon('spark')}先预测，再验证。<br>给思考留一点时间。</div></aside><div class="lesson-main"><div class="lesson-heading"><div class="lesson-meta"><span>${m.title}</span><span>${icon('clock')}${l.duration} 分钟</span><span>${completed(id)?'已掌握':'学习中'}</span></div><h1>${l.title}</h1><p>${l.summary}</p><button class="bookmark-button ${state.bookmarks.includes(id)?'saved':''}" data-bookmark="${id}" aria-pressed="${state.bookmarks.includes(id)}">${icon('bookmark')}${state.bookmarks.includes(id)?'已收藏':'收藏这节课'}</button></div><nav class="lesson-steps" aria-label="本课步骤">${[['wonder','先想一想'],['concept','看懂概念'],['experiment','动手试试'],['practice','检查理解']].map(([anchor,label],i)=>`<button data-scroll="${anchor}"><span>${i+1}</span>${label}</button>`).join('')}</nav><article class="lesson-article"><section class="wonder-box" id="wonder"><span class="section-number">01</span><div><span class="small-muted">先想一想</span><h2>从一个问题开始</h2><p>${l.intro}</p><p class="wonder-reminder">先停留几秒，想一个自己的答案。带着它继续探索。</p>${predictionHTML(l)}</div></section><section class="concept-section" id="concept"><div class="section-title"><span class="section-number">02</span><h2>一点点，把概念看清。</h2></div>${l.sections.map(s=>`<div class="concept-block"><h3>${s.title}</h3><p>${s.body}</p>${s.code?`<pre><code>${escape(s.code)}</code></pre>`:''}</div>`).join('')}</section><section class="lesson-experiment" id="experiment"><div class="section-title"><span class="section-number">03</span><div><h2>轮到你动手了</h2><p>改一改输入，把你的预测变成一次实验。</p></div></div>${l.lab?'<div id="lesson-lab"></div>':miniCode(l)}</section>${quizHTML(l)}${takeawaysHTML(l)}<details class="note-box"><summary>${icon('book')}记下自己的理解 <span>笔记自动保存在本机</span></summary><label class="sr-only" for="lesson-note">本课笔记</label><textarea id="lesson-note" data-note="${l.id}" placeholder="用自己的话说说，你今天发现了什么？">${escape(state.notes[id]||'')}</textarea><span class="note-status" aria-live="polite"></span></details><div class="lesson-next"><a class="text-button" href="#/courses">回到学习路径</a>${next?`<a class="button primary" href="#/lesson/${next.id}">下一课：${next.title}${icon('arrow')}</a>`:'<a class="button primary" href="#/records">看看我的学习记录'+icon('arrow')+'</a>'}</div></article></div></div>`;
}
function wiki() {
  return `${pageHead('给新概念，找一个落点。', '用自己的话理解计算机科学。先回忆，再翻开卡片。')}<label class="wiki-search">${icon('search')}<input type="search" id="wiki-search" placeholder="搜索概念，例如「变量」「二分」" aria-label="搜索知识卡片"></label><div class="wiki-counter"><span>共 ${glossary.length} 张知识卡片</span><span>${state.cards.length} 张已记住</span></div><div class="glossary-grid">${glossary.map((g,i)=>`<article class="glossary-card" data-term="${escape(g.term+' '+g.english+' '+g.definition)}"><div class="glossary-top">${icon('book')}<span>${state.cards.includes(g.term)?'已记住':'回忆一下'}</span></div><h2>${g.term}</h2><p class="english-term">${g.english}</p><details><summary>想好了，翻开看看 ${icon('chevron')}</summary><p>${g.definition}</p><div class="glossary-actions"><button class="text-button" data-remember="${escape(g.term)}" aria-pressed="${state.cards.includes(g.term)}">${state.cards.includes(g.term)?'再复习一次':'我记住了'}${icon('check')}</button><a href="#/lesson/${g.lesson}">回到课程 ${icon('chevron')}</a></div></details></article>`).join('')}</div><p class="empty-filter" hidden>还没有匹配的概念，试试「算法」或「变量」。</p>`;
}
function records() {
  const correct=state.mastered.length, wrong=Object.entries(state.answers).filter(([id,a])=>!a.correct&&lessonById(id));
  return `${pageHead('每一点理解，都留下足迹。', '这里只记录你实际做过的探索。记录保存在当前浏览器。', '<button class="button secondary" data-export>'+icon('download')+'导出记录</button>')}<div class="record-stats"><div><span>已探索课程</span><strong>${state.visited.filter(id=>lessonById(id)).length}<small> / ${lessons.length}</small></strong></div><div><span>已掌握课程</span><strong>${correct}<small> 节</small></strong></div><div><span>已记住概念</span><strong>${state.cards.length}<small> 张</small></strong></div><div><span>待巩固问题</span><strong>${wrong.length}<small> 道</small></strong></div></div><div class="records-columns"><section class="record-panel"><h2>我的学习进度</h2>${modules.map(m=>`<div class="record-progress"><div><span>${icon(m.icon)}${m.title}</span><strong>${m.lessons.filter(completed).length} / ${m.lessons.length}</strong></div><div class="progress-track"><i style="width:${progress(m.lessons)}%"></i></div></div>`).join('')}${state.last?`<a class="button primary" href="#/lesson/${state.last}">继续上次学习${icon('arrow')}</a>`:'<a class="button primary" href="#/lesson/binary">开始第一课'+icon('arrow')+'</a>'}</section><section class="record-panel"><h2>再给这些问题一点时间</h2>${wrong.length?wrong.map(([id])=>`<a class="record-link" href="#/lesson/${id}?section=practice"><span>${lessonById(id).title}<small>回到练习，重新验证理解</small></span>${icon('arrow')}</a>`).join(''):`<div class="record-empty">${icon('spark')}<p>${state.visited.length?'目前没有待巩固的错题。':'还没有练习记录。'}</p><span>完成课程里的小练习，看看自己理解了多少。</span></div>`}</section></div><section class="record-panel bookmark-panel"><h2>我收藏的课程</h2>${state.bookmarks.filter(lessonById).length?state.bookmarks.filter(lessonById).map(id=>`<a class="record-link" href="#/lesson/${id}"><span>${lessonById(id).title}<small>${lessonById(id).summary}</small></span>${icon('arrow')}</a>`).join(''):'<p class="small-muted">遇到想再看一遍的课程，点击课内的「收藏这节课」。</p>'}</section><section class="record-panel activity-panel"><h2>最近的学习足迹</h2>${state.activity.length?state.activity.slice(0,6).map(a=>`<div class="activity-item"><span class="tiny-dot"></span><span>${escape(a.text)}</span><time>${new Date(a.time).toLocaleDateString('zh-CN',{month:'short',day:'numeric'})}</time></div>`).join(''):'<p class="small-muted">第一次答题、记住概念之后，足迹会出现在这里。</p>'}</section><div class="record-privacy"><span>${icon('info')}使用同一个浏览器，可以接着上次的学习。</span><button class="text-button danger" data-reset>清除本机记录</button></div>`;
}
function about() {
  return `${pageHead('理解，从亲自探索开始。', '培玉 CS 是一个面向中文学习者的计算机科学学习原型。')}<article class="about-panel"><img src="./logo.svg" width="64" height="64" alt="培玉"><h2>把数学里的好奇，带进计算机科学。</h2><p>我们借鉴「培玉高中数学」的学习方式，让你先观察一个问题，读懂一个概念，再通过实验和练习验证自己的理解。第一版从信息表示、Python 基础和算法开始，并参考 Boxi Yu 课程站的可交互讲义结构，为每节加入预测、逐步实验和自测。</p><h3>这版可以做什么</h3><p>九节入门课程、四个可交互实验、带解释的课内练习、知识卡片、课程收藏、笔记，以及在本机保存的学习记录。课程中的数值演示按固定规则运行；目前没有通用 Python 执行环境、账号同步或 AI 教师。</p><h3>我们参考的学习体验</h3><div class="source-list">${sources.map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer"><span><strong>${s.title}</strong><small>${s.note}</small></span>${icon('arrow')}</a>`).join('')}</div><p class="small-muted">以上站点是交互研究参考。本网站的中文入门讲解和实验为本原型编写，与这些课程没有隶属或认证关系。</p><a class="button primary" href="#/courses">开始探索${icon('arrow')}</a></article>`;
}

function predictionHTML(l) {
  const p=l.prediction;if(!p)return '';
  return `<form class="prediction-box" data-prediction="${l.id}"><p class="prediction-prompt">${p.prompt}</p><fieldset><legend class="sr-only">${escape(p.prompt)}</legend>${p.options.map((o,i)=>`<label><input type="radio" name="prediction-${l.id}" value="${i}" required ${state.predictions[l.id]===i?'checked':''}><span>${escape(o)}</span></label>`).join('')}</fieldset><button class="button secondary" type="submit">记录预测，看看思路</button><div class="prediction-feedback" aria-live="polite"></div></form>`;
}
function takeawaysHTML(l) {
  if(!l.takeaways)return '';
  return `<section class="takeaways"><span class="section-number">${icon('check')}</span><div><h2>带走这三个发现</h2><ul>${l.takeaways.map(t=>`<li>${t}</li>`).join('')}</ul></div></section>`;
}
function furtherHTML() {
  const list=content.furtherCourses||[];if(!list.length)return '';
  return `<section class="further-courses"><div class="section-heading"><div><h2>继续向计算机科学深处走</h2><p>完成入门后，可以从这些参考讲义继续探索。</p></div><span class="quiet-tag">外部课程</span></div><div class="further-list">${list.map(c=>`<a href="${escape(c.url)}" target="_blank" rel="noopener noreferrer"><span class="further-level">${c.level}</span><div><h3>${c.title}</h3><p>${c.description}</p></div><span class="external-label">查看讲义 ↗</span></a>`).join('')}</div></section>`;
}

function render() {
  cleanups.forEach(fn=>fn?.()); cleanups=[]; quizChoice=null; route=currentRoute();
  const name=route.parts[0];
  const content=name==='home'?home():name==='courses'?courses():name==='labs'?labs():name==='lesson'?lessonView(route.parts[1]):name==='wiki'?wiki():name==='records'?records():about();
  $('#app').innerHTML=shell(content);
  document.title=`${name==='lesson'?(lessonById(route.parts[1])?.title||'课程'):nav.find(n=>n[0]===name)?.[2]||'关于'} · 培玉 CS`;
  window.scrollTo({top:0,behavior:'instant'});
  if(name==='labs') cleanups.push(mountLab($('#active-lab'),labType));
  if(name==='lesson') {
    const l=lessonById(route.parts[1]);
    if(l?.lab) cleanups.push(mountLab($('#lesson-lab'),l.lab));
    if(route.params.has('section')) requestAnimationFrame(()=>document.getElementById(route.params.get('section'))?.scrollIntoView({block:'start'}));
  }
  $$('[data-prediction]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const l=lessonById(form.dataset.prediction),answer=Number($('input:checked',form)?.value);if(!Number.isInteger(answer))return;state.predictions[l.id]=answer;save();$('.prediction-feedback',form).innerHTML=`<strong>${answer===l.prediction.answer?'你的预测很准确。':'这是一个值得验证的猜想。'}</strong><p>${l.prediction.explanation}</p><button type="button" class="text-button" data-scroll="experiment">现在去实验里验证 ${icon('arrow')}</button>`;}));
  const search=$('#wiki-search');
  search?.addEventListener('input',()=>{let count=0; $$('.glossary-card').forEach(el=>{el.hidden=!el.dataset.term.toLowerCase().includes(search.value.trim().toLowerCase()); if(!el.hidden)count++;}); $('.empty-filter').hidden=!!count;});
  $$('[data-quiz]').forEach(form=>form.addEventListener('submit',e=>{
    e.preventDefault();const l=lessonById(form.dataset.quiz), checked=$('input:checked',form); if(!checked)return;
    const answer=Number(checked.value), correct=answer===l.question.answer;
    state.answers[l.id]={choice:answer,correct};
    if(correct&&!state.mastered.includes(l.id)){state.mastered.push(l.id);log(`掌握了「${l.title}」`);}
    if(!correct){state.mastered=state.mastered.filter(x=>x!==l.id);log(`正在巩固「${l.title}」`);}
    save();
    $$('.quiz-option',form).forEach((el,i)=>{el.classList.toggle('correct',i===l.question.answer);el.classList.toggle('incorrect',i===answer&&!correct);});
    $('.quiz-feedback',form).innerHTML=`<div class="feedback-box ${correct?'success':'try-again'}"><strong>${correct?'理解得很准确。':'再想一想，你离答案更近了。'}</strong><p>${l.question.explanation}</p>${!correct?'<span>可以修改选择，再检查一次。</span>':''}</div>`;
    if(correct)toast('这一课的理解已记录。');
  }));
}

document.addEventListener('click',e=>{
  const action=e.target.closest('button, a, [data-menu-close]'); if(!action)return;
  if(action.getAttribute('href')==='#main'){e.preventDefault();$('#main').focus();$('#main').scrollIntoView();return;}
  if(action.hasAttribute('data-menu')){$('#sidebar').classList.toggle('open');$('.sidebar-shade').classList.toggle('open');}
  if(action.hasAttribute('data-menu-close')){$('#sidebar').classList.remove('open');$('.sidebar-shade').classList.remove('open');}
  if(action.hasAttribute('data-search')) openSearch();
  if(action.hasAttribute('data-close-search')) $('#search-dialog').close();
  if(action.dataset.filter){moduleFilter=action.dataset.filter;history.replaceState(null,'',`#/courses${moduleFilter==='all'?'':`?module=${moduleFilter}`}`);render();}
  if(action.dataset.scroll){const id=action.dataset.scroll;document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});history.replaceState(null,'',`#/lesson/${route.parts[1]}?section=${id}`);}
  if(action.matches('.hero-bit')){const on=action.getAttribute('aria-pressed')!=='true';action.setAttribute('aria-pressed',on);action.classList.toggle('on',on);action.textContent=on?'1':'0';action.setAttribute('aria-label',`位权 ${2**(7-Number(action.dataset.bit))}，当前 ${on?1:0}`);const n=$$('.hero-bit').reduce((s,b)=>s+(b.getAttribute('aria-pressed')==='true'?2**(7-Number(b.dataset.bit)):0),0);$('#hero-decimal').textContent=n;$('#hero-character').textContent=n>=32&&n<=126?String.fromCharCode(n):'—';$('#hero-bit-hint').textContent=n>=32&&n<=126?'开关变了，它表示的字符也变了。':n<32||n===127?'这是控制字符，不显示为普通字母。':'这个数超出标准 ASCII 的 0–127 范围。';}
  if(action.dataset.bookmark){const id=action.dataset.bookmark;const exists=state.bookmarks.includes(id);state.bookmarks=exists?state.bookmarks.filter(x=>x!==id):[...state.bookmarks,id];save();action.classList.toggle('saved',!exists);action.setAttribute('aria-pressed',!exists);action.innerHTML=icon('bookmark')+(exists?'收藏这节课':'已收藏');toast(exists?'已取消收藏':'已收藏，可在「我的学习」找到。');}
  if(action.dataset.hint){const l=lessonById(action.dataset.hint);$('.quiz-feedback',action.closest('form')).innerHTML=`<div class="feedback-box hint"><strong>一个小提示</strong><p>${l.question.hint}</p></div>`;}
  if(action.hasAttribute('data-mini-run'))runMini(action.closest('[data-mini]'));
  if(action.dataset.remember){const term=action.dataset.remember, has=state.cards.includes(term);state.cards=has?state.cards.filter(x=>x!==term):[...state.cards,term];if(!has)log(`记住了概念「${term}」`);save();action.setAttribute('aria-pressed',!has);action.innerHTML=(has?'我记住了':'再复习一次')+icon('check');$('.glossary-top span',action.closest('article')).textContent=has?'回忆一下':'已记住';$('.wiki-counter span:last-child').textContent=`${state.cards.length} 张已记住`;toast(has?'已放回复习列表':'这个概念已记住。');}
  if(action.hasAttribute('data-export')){const blob=new Blob([JSON.stringify({app:'培玉 CS',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='培玉CS-学习记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('学习记录已导出。');}
  if(action.hasAttribute('data-reset')&&confirm('清除当前浏览器里的课程进度、错题、收藏和笔记？此操作无法撤销。建议先导出记录。')){state=fresh();save();render();toast('本机记录已清除，可以重新出发。');}
});
document.addEventListener('input',e=>{if(e.target.dataset.note){state.notes[e.target.dataset.note]=e.target.value;save();$('.note-status').textContent='已保存';}});
function runMini(el){const l=el.dataset.mini,raw=$('[data-mini-input]',el).value,v=Number(raw), limits={algorithm:[1,32],variable:[0,100],condition:[0,100],loop:[1,8],complexity:[1,1024]}, [min,max]=limits[l]||[1,32];const output=$('[data-mini-output]',el);if(!raw.trim()||!Number.isInteger(v)||v<min||v>max){output.textContent=`请输入 ${min} 到 ${max} 之间的整数。`;return;}if(l==='variable')output.textContent=`score = ${v}\nscore = score + 5\nprint(score)\n\n输出：${v+5}\n解释：先读取旧值 ${v}，加 5 后，把 ${v+5} 存回 score。`;else if(l==='condition')output.textContent=`score = ${v}\nif score >= 60:\n    print("通过")\nelse:\n    print("再练习一次")\n\n判断 ${v} >= 60 为 ${v>=60?'True':'False'}\n输出：${v>=60?'通过':'再练习一次'}`;else if(l==='loop')output.textContent=`for i in range(${v}):\n    print(i)\n\n${Array.from({length:v},(_,i)=>`第 ${i+1} 次：i = ${i}，输出 ${i}`).join('\n')}\n循环结束，共输出 ${v} 个数字。`;else if(l==='complexity')output.textContent=`规模 n = ${v}\n\n线性查找：最坏需比较 ${v} 次。\n二分查找：最坏需比较 ${Math.floor(Math.log2(v))+1} 次。\n\n每次把候选区间减半，增长速度由 O(n) 变为 O(log n)。`;else output.textContent=`任务：逐本贴标签。\n1. 准备 ${v} 本书和标签。\n2. 每次取出一本，贴好标签。\n3. 重复 ${v} 次。\n4. 已贴标签 ${v} 本，剩余 0 本。`;}
function openSearch(){const dialog=$('#search-dialog');if(!dialog.open)dialog.showModal();$('#global-search').value='';searchResults('');$('#global-search').focus();}
function searchResults(query){const q=query.trim().toLowerCase(), found=lessons.filter(l=>(l.title+l.tag+l.summary+(modules.find(m=>m.id===l.module)?.title||'')+Object.values(labMeta).filter(t=>t.lesson===l.id).map(t=>t.title+t.desc).join('')).toLowerCase().includes(q)||glossary.some(g=>g.lesson===l.id&&(g.term+g.english+g.definition).toLowerCase().includes(q)));$('#search-results').innerHTML=`<p class="result-label">${q?`找到 ${found.length} 节相关课程`:'从这些问题开始'}</p>${found.length?found.map(l=>`<a class="search-result" href="#/lesson/${l.id}"><span class="search-result-icon">${icon(l.lab?'flask':'book')}</span><span><strong>${l.title}</strong><small>${l.tag} · ${l.duration} 分钟</small></span>${icon('arrow')}</a>`).join(''):'<p class="no-results">还没有找到，试试「二进制」「Python」或「排序」。</p>'}`;}
$('#global-search').addEventListener('input',e=>searchResults(e.target.value));
$('#search-results').addEventListener('click',e=>{if(e.target.closest('a'))$('#search-dialog').close();});
$('#search-dialog').addEventListener('click',e=>{if(e.target===$('#search-dialog'))$('#search-dialog').close();});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}if(e.key==='Escape'){$('#sidebar')?.classList.remove('open');$('.sidebar-shade')?.classList.remove('open');}});
window.addEventListener('hashchange',render);
render();
