import * as zhContent from './data.js';
import * as enContent from './data.en.js';
import { mountLab } from './labs.js';
import { t, getLanguage, setLanguage, syncDocumentLanguage } from './i18n.js';

let content, modules, lessons, glossary, sources;
function selectContent() {
  content = getLanguage() === 'en' ? enContent : zhContent;
  ({ modules, lessons, glossary, sources } = content);
}
selectContent();
const $ = (q, el = document) => el.querySelector(q);
const $$ = (q, el = document) => [...el.querySelectorAll(q)];
const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brand = () => t('培玉 CS', 'Peiyu CS');
const cardId = g => g.id || g.term;
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
} catch { /* Learning remains available when browser storage is unavailable. */ }
// Old card records used the Chinese term, now kept as the stable ID in both languages.
state.cards = [...new Set(state.cards.map(value => {
  const card = [...zhContent.glossary, ...enContent.glossary].find(g => cardId(g) === value || g.term === value);
  return card ? cardId(card) : value;
}))];
state.activity = state.activity.map(activity => {
  if (activity.type || !activity.text) return activity;
  const lesson = zhContent.lessons.find(l => activity.text.includes(`「${l.title}」`));
  if (lesson) return { type: activity.text.startsWith('掌握了') ? 'mastered' : 'review', lessonId: lesson.id, time: activity.time };
  const card = zhContent.glossary.find(g => activity.text.includes(`「${g.term}」`));
  return card ? { type: 'remember', cardId: cardId(card), time: activity.time } : activity;
});
let cleanups = [], route, moduleFilter = 'all', labType = 'binary', toastTimer;
const lessonById = id => lessons.find(l => l.id === id);
const completed = id => state.mastered.includes(id);
const progress = ids => Math.round(ids.filter(completed).length / (ids.length || 1) * 100);
const nav = () => [
  ['home', 'home', t('学习概览', 'Overview')],
  ['courses', 'path', t('学习路径', 'Learning paths')],
  ['labs', 'flask', t('交互实验室', 'Interactive labs')],
  ['wiki', 'book', t('知识卡片', 'Concept cards')],
  ['records', 'chart', t('我的学习', 'My learning')]
];
function toast(message) {
  $('#toast').textContent = message; $('#toast').classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2800);
}
function save() {
  try { localStorage.setItem('peiyu-cs-v1', JSON.stringify(state)); }
  catch { toast(t('浏览器未允许保存，当前学习仍可继续。', 'Storage is unavailable in this browser. You can still keep learning.')); }
}
function log(type, id) {
  state.activity.unshift({ type, ...(type === 'remember' ? { cardId: id } : { lessonId: id }), time: new Date().toISOString() });
  state.activity = state.activity.slice(0, 30);
}
function currentRoute() {
  const raw = location.hash.slice(2).split('?');
  return { parts: (raw[0] || 'home').split('/'), params: new URLSearchParams(raw[1] || '') };
}
function activityText(activity) {
  const title = lessonById(activity.lessonId)?.title;
  const term = glossary.find(g => cardId(g) === activity.cardId)?.term;
  if (activity.type === 'mastered' && title) return t(`掌握了「${title}」`, `Mastered “${title}”`);
  if (activity.type === 'review' && title) return t(`正在巩固「${title}」`, `Revisiting “${title}”`);
  if (activity.type === 'remember' && term) return t(`记住了概念「${term}」`, `Remembered “${term}”`);
  return t(activity.text || '一次学习探索', 'Earlier learning activity');
}
function languageSwitch() {
  return `<div class="language-switch" role="group" aria-label="${t('选择语言', 'Choose language')}">
    <button class="language-option ${getLanguage() === 'zh' ? 'active' : ''}" data-language="zh" lang="zh-CN" aria-label="${t('切换为中文', 'Switch to Chinese')}" aria-pressed="${getLanguage() === 'zh'}">中文</button>
    <button class="language-option ${getLanguage() === 'en' ? 'active' : ''}" data-language="en" lang="en" aria-label="${t('切换为英文', 'Switch to English')}" aria-pressed="${getLanguage() === 'en'}">EN</button>
  </div>`;
}
function shell(body) {
  const active = route.parts[0] === 'lesson' ? 'courses' : route.parts[0];
  const title = route.parts[0] === 'lesson' ? t('课程学习', 'Lesson') : nav().find(n => n[0] === active)?.[2] || t('关于培玉 CS', 'About Peiyu CS');
  return `<div class="workspace"><aside class="sidebar" id="sidebar" aria-label="${t('主导航', 'Main navigation')}">
    <a class="brand" href="#/home"><img src="./logo.svg" alt="${t('培玉', 'Peiyu')}" width="39" height="39"><span>${t('培玉', 'Peiyu')} <strong>CS</strong><small>${t('计算机科学 · 从好奇出发', 'Computer science, led by curiosity')}</small></span></a>
    <div class="space-label">${t('我的学习空间', 'My learning space')} <span class="tiny-dot"></span></div>
    <nav>${nav().map(([id, glyph, name]) => `<a href="#/${id}" class="nav-link ${id === active ? 'active' : ''}" ${id === active ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${name}</span>${id === 'labs' ? `<span class="nav-new">${t('动手试', 'Try it')}</span>` : ''}</a>`).join('')}</nav>
    <div class="sidebar-note"><div class="little-sprout" aria-hidden="true">{ <span>✦</span> }</div><p>${t('把问题拆小，<br>把理解做深。', 'Smaller questions.<br>Deeper understanding.')}</p><small>${t('每天一个小发现。', 'A small discovery, every day.')}</small></div>
    <div class="sidebar-bottom"><a href="#/about">${icon('info')}${t('关于这个学习空间', 'About this learning space')}</a><div class="local-note"><span class="tiny-dot"></span>${t('进度保存在此浏览器', 'Progress saved in this browser')}</div></div>
  </aside><div class="sidebar-shade" data-menu-close></div>
  <div class="main-area"><header class="topbar"><div class="breadcrumbs"><button class="icon-button mobile-menu" data-menu aria-label="${t('展开导航', 'Open navigation')}">${icon('menu')}</button><span>${t('学习空间', 'Learning space')}</span>${icon('chevron')}<strong>${title}</strong></div><div class="topbar-right"><button class="search-trigger" data-search aria-label="${t('搜索课程和概念', 'Search lessons and concepts')}">${icon('search')}<span>${t('搜索课程、概念…', 'Search lessons, concepts…')}</span><kbd>⌘ K</kbd></button>${languageSwitch()}<span class="avatar" title="${t('本机学习空间', 'Local learning space')}" aria-label="${t('本机学习空间', 'Local learning space')}">${t('培', 'P')}</span></div></header>
  <main id="main" tabindex="-1">${body}</main><footer class="footer"><span>${brand()} <span class="footer-sep">/</span> ${t('给好奇心一个探索的地方', 'A place for curiosity to explore')}</span><a href="#/about">${t('关于与参考', 'About & references')}</a></footer></div></div>`;
}
function pageHead(title, sub, extra = '') { return `<div class="page-heading"><div><h1>${title}</h1><p>${sub}</p></div>${extra}</div>`; }
function moduleArt(m) {
  if (m.id === 'foundations') return `<div class="course-art binary-art" aria-hidden="true"><span>0</span><span class="lit">1</span><span>0</span><span class="lit">1</span><i>${t('信息，有了自己的语言。', 'A language for information.')}</i></div>`;
  if (m.id === 'python') return `<div class="course-art code-art" aria-hidden="true"><code><span>for</span> idea <span>in</span> curiosity:<br>&nbsp;&nbsp;&nbsp;&nbsp;<b>build</b>(idea)</code><i>${t('让想法，开始运行。', 'Put your ideas into motion.')}</i></div>`;
  return `<div class="course-art tree-art" aria-hidden="true"><svg viewBox="0 0 240 90"><path d="M120 20 65 65M120 20l55 45"/><circle cx="120" cy="20" r="14"/><circle cx="65" cy="65" r="14"/><circle cx="175" cy="65" r="14"/><text x="120" y="25">8</text><text x="65" y="70">3</text><text x="175" y="70">12</text></svg><i>${t('找到解决问题的好办法。', 'Find a better way to solve it.')}</i></div>`;
}
function home() {
  const last = lessonById(state.last) || lessons[0];
  return `${pageHead(t('你好，探索者。', 'Hello, explorer.'), t('每一个「为什么」，都可以成为一次新的发现。', 'Every “why?” can be the start of a new discovery.'), `<span class="quiet-tag">${t('循序渐进 · 动手理解', 'Step by step · Learn by doing')}</span>`)}
  <section class="hero"><div class="hero-copy"><span class="hero-label"><span class="tiny-dot"></span>${t('培玉计算机科学', 'Peiyu Computer Science')}</span><h2>${t('从 0 和 1，<br>理解一个新的世界。', 'From zeros and ones,<br>to a new way of thinking.')}</h2><p>${t('把抽象的概念变成看得见的实验。<br>从第一段思考，到亲手解决一个问题。', 'Turn abstract ideas into experiments you can see.<br>Think it through, then try it yourself.')}</p><div class="hero-actions"><a class="button primary" href="#/lesson/${last.id}">${state.last ? t('继续学习', 'Continue learning') : t('开启第一课', 'Start your first lesson')}${icon('arrow')}</a><a class="text-button" href="#/labs">${t('先玩一个实验', 'Try a lab first')} ${icon('chevron')}</a></div><div class="hero-caption">${icon('clock')}${t('每节约 10–15 分钟，按自己的节奏来。', 'About 10–15 minutes a lesson. Go at your own pace.')}</div></div>
  <div class="hero-playground"><div class="playground-top"><span><span class="live-dot"></span>${t('二进制，试着点一下', 'Binary: click a switch')}</span><span class="code-label">8 bit</span></div><div class="bitboard">${[0,1,0,0,0,0,0,1].map((v,i) => `<div><span class="bit-weight">${2 ** (7-i)}</span><button class="hero-bit ${v ? 'on' : ''}" aria-label="${t(`位权 ${2 ** (7-i)}，当前 ${v}`, `Place value ${2 ** (7-i)}, currently ${v}`)}" aria-pressed="${!!v}" data-bit="${i}">${v}</button></div>`).join('')}</div><div class="bit-connector"><span></span>${icon('arrow')}<span></span></div><div class="binary-result"><div><span>${t('十进制', 'Decimal')}</span><strong id="hero-decimal">65</strong></div><span class="equals">=</span><div><span>${t('ASCII 字符', 'ASCII character')}</span><strong id="hero-character">A</strong></div></div><p class="playground-hint" id="hero-bit-hint">${t('一个字母的背后，是一组开与关。', 'Behind a letter is a pattern of on and off.')}</p></div></section>
  <section class="journey-section"><div class="section-heading"><div><h2>${t('一条清晰的学习路径', 'A clear path to understanding')}</h2><p>${t('先建立直觉，再写下代码，最后学会更好地解决问题。', 'Build intuition, write code, then discover better ways to solve problems.')}</p></div><a class="text-button" href="#/courses">${t('查看全部课程', 'Browse all lessons')} ${icon('arrow')}</a></div><div class="journey-grid">${modules.map((m,i) => `<a class="journey-card ${m.color}" href="#/courses?module=${m.id}"><div class="course-top"><span class="stage">${t(`阶段 ${['一','二','三'][i]}`, `Stage ${i+1}`)}</span><span class="level-label">${m.level}</span></div>${moduleArt(m)}<div class="course-heading">${icon(m.icon)}<h3>${m.title}</h3>${icon('arrow')}</div><p>${m.subtitle}</p><div class="course-bottom"><span>${t(`${m.lessons.length} 节精选课程`, `${m.lessons.length} focused lessons`)}</span><span>${progress(m.lessons) ? t(`已掌握 ${progress(m.lessons)}%`, `${progress(m.lessons)}% mastered`) : t('从这里出发', 'Begin here')}</span></div></a>`).join('')}</div></section>
  <div class="home-lower"><section class="next-lesson"><div class="section-heading"><h2>${state.last ? t('接着上次的发现', 'Pick up where you left off') : t('你的第一步', 'Your first step')}</h2><span class="quiet-tag">${state.last ? t('学习足迹', 'Your journey') : t('零基础友好', 'No experience needed')}</span></div><div class="next-body"><div class="lesson-glyph">${icon(state.last ? 'book' : 'binary')}</div><div><span class="small-muted">${modules.find(m=>m.id === last.module)?.title} / ${last.tag}</span><h3>${last.title}</h3><p>${last.summary}</p></div><a class="round-arrow" aria-label="${escape(t(`学习${last.title}`, `Study ${last.title}`))}" href="#/lesson/${last.id}">${icon('arrow')}</a></div></section><section class="curiosity"><span class="curiosity-icon">${icon('spark')}</span><div><span class="small-muted">${t('留给好奇心的一分钟', 'One minute for curiosity')}</span><h3>${t('为什么二分查找每次都能排除一半？', 'Why can binary search rule out half the options?')}</h3><a href="#/lesson/search">${t('用一个实验找到答案', 'Find out in a lab')} ${icon('chevron')}</a></div></section></div>
  <section class="learning-loop"><span>${t('在培玉，你会这样学习', 'How you learn at Peiyu')}</span><div><span>${t('先想一想', 'Predict')}</span>${icon('chevron')}<span>${t('看懂概念', 'Understand')}</span>${icon('chevron')}<span>${t('动手试试', 'Experiment')}</span>${icon('chevron')}<span>${t('检查理解', 'Check')}</span></div><span>${t('理解，比赶进度更重要。', 'Understanding matters more than speed.')}</span></section>`;
}
function courses() {
  const chosen = route.params.get('module');
  moduleFilter = chosen && modules.some(m=>m.id===chosen) ? chosen : 'all';
  return `${pageHead(t('沿着好奇，走得更远。', 'Follow your curiosity further.'), t('三段路线，九个起点。每节都包含讲解、动手探索和一题检查。', 'Three stages, nine starting points. Every lesson includes an explanation, an experiment and a check.'))}
  <div class="filter-bar" role="group" aria-label="${t('筛选课程', 'Filter lessons')}">${[['all',t('全部课程','All lessons')],...modules.map(m=>[m.id,m.title])].map(([id,label])=>`<button class="chip ${moduleFilter===id?'active':''}" data-filter="${id}">${label}</button>`).join('')}<span class="filter-note">${t(`${state.mastered.length} / ${lessons.length} 节已掌握`, `${state.mastered.length} / ${lessons.length} lessons mastered`)}</span></div>
  <div class="course-list">${modules.filter(m=>moduleFilter==='all'||m.id===moduleFilter).map(m=>`<section class="module-panel ${m.color}"><div class="module-intro"><span class="module-symbol">${icon(m.icon)}</span><div><span class="small-muted">${m.level} · ${t(`${m.lessons.length} 节课`,`${m.lessons.length} lessons`)}</span><h2>${m.title}</h2><p>${m.description || m.subtitle}</p></div><div class="module-progress"><span>${progress(m.lessons)}%</span><div class="progress-track"><i style="width:${progress(m.lessons)}%"></i></div></div></div><div class="lesson-rows">${m.lessons.map((id,j)=>{const l=lessonById(id);return `<a class="lesson-row" href="#/lesson/${id}"><span class="lesson-index ${completed(id)?'done':''}">${completed(id)?icon('check'):String(j+1).padStart(2,'0')}</span><div><h3>${l.title}</h3><p>${l.summary}</p></div><span class="lesson-time">${icon('clock')}${t(`${l.duration} 分钟`,`${l.duration} min`)}</span><span class="status ${completed(id)?'done':state.visited.includes(id)?'started':''}">${completed(id)?t('已掌握','Mastered'):state.visited.includes(id)?t('学习中','In progress'):t('开始学习','Start lesson')}</span>${icon('chevron')}</a>`}).join('')}</div></section>`).join('')}</div>${furtherHTML()}`;
}
function labMetadata() {
  return {
    binary:{title:t('二进制开关','Binary switches'),desc:t('拨动 8 个开关，看数字和字母如何被表示。','Flip eight switches to see how numbers and letters are represented.'),icon:'binary',lesson:'binary',tag:t('信息表示','Representing information')},
    logic:{title:t('逻辑门电路','Logic gates'),desc:t('组合两个输入，观察与、或、异或的区别。','Combine two inputs and compare AND, OR and XOR.'),icon:'code',lesson:'logic',tag:t('布尔逻辑','Boolean logic')},
    sorting:{title:t('冒泡排序剧场','Bubble sort theatre'),desc:t('逐步比较、交换，看一组数字如何排好队。','Compare and swap, one step at a time, to put numbers in order.'),icon:'chart',lesson:'sorting',tag:t('算法可视化','Visualising algorithms')},
    search:{title:t('二分查找探险','Binary search explorer'),desc:t('每次把范围减半，找出藏在序列里的数字。','Halve the search space to find a number in an ordered list.'),icon:'search',lesson:'search',tag:t('算法可视化','Visualising algorithms')}
  };
}
function labs() {
  const labMeta=labMetadata();
  labType=route.parts[1] && labMeta[route.parts[1]] ? route.parts[1] : 'binary';
  return `${pageHead(t('抽象的概念，亲手试出来。','Make an abstract idea tangible.'),t('不用安装，不怕试错。改变一个输入，看看会发生什么。','Nothing to install. Change an input, make a prediction and see what happens.'))}<div class="lab-tabs" role="group" aria-label="${t('选择实验','Choose an experiment')}">${Object.entries(labMeta).map(([id,l])=>`<a href="#/labs/${id}" class="lab-tab ${id===labType?'active':''}" ${id===labType?'aria-current="true"':''}>${icon(l.icon)}${l.title}</a>`).join('')}</div><section class="experiment-panel"><div class="experiment-title"><div><span class="small-muted">${labMeta[labType].tag}</span><h2>${labMeta[labType].title}</h2><p>${labMeta[labType].desc}</p></div><a class="button secondary" href="#/lesson/${labMeta[labType].lesson}">${t('学习相关课程','Read the related lesson')} ${icon('arrow')}</a></div><div id="active-lab"></div></section><div class="lab-tip">${icon('info')}<span>${t('试试先预测结果，再点击操作。能解释「为什么」，才是这次实验最好的收获。','Predict the result before you click. Being able to explain why is the most useful result of an experiment.')}</span></div>`;
}
function savedQuizFeedback(l) {
  const answer=state.answers[l.id];
  return answer ? `<div class="feedback-box ${answer.correct?'success':'try-again'}"><strong>${answer.correct?t('这道题已答对，也可以再次验证理解。','You answered this correctly. You can still check your understanding again.'):t('上次的选择已保留，可以修改后再试。','Your previous answer is saved. You can change it and try again.')}</strong><p>${escape(l.question.explanation)}</p></div>` : '';
}
function quizHTML(l) {
  const answer=state.answers[l.id];
  return `<section class="quiz-panel" id="practice"><div class="section-number">04</div><div class="quiz-content"><span class="small-muted">${t('检查理解','Check your understanding')} · ${l.tag}</span><h2>${t('把刚刚的发现，用起来。','Put your discovery to work.')}</h2><p class="quiz-prompt">${escape(l.question.prompt)}</p><form data-quiz="${l.id}" novalidate><fieldset><legend class="sr-only">${escape(l.question.prompt)}</legend>${l.question.options.map((o,i)=>`<label class="quiz-option ${answer && i===l.question.answer?'correct':answer && i===answer.choice && !answer.correct?'incorrect':''}"><input type="radio" name="answer" value="${i}" required ${answer?.choice===i?'checked':''}><span class="option-letter">${'ABCD'[i]}</span><span>${escape(o)}</span></label>`).join('')}</fieldset><div class="quiz-actions"><button class="button primary" type="submit">${t('检查答案','Check answer')} ${icon('check')}</button><button class="text-button" type="button" data-hint="${l.id}">${t('给我一点提示','Give me a hint')}</button></div><div class="quiz-feedback" aria-live="polite">${savedQuizFeedback(l)}</div></form></div></section>`;
}
function miniConfig(id) {
  const configs={
    algorithm:{label:t('一共有多少本书？','How many books are there?'),value:8,min:1,max:32,action:t('拆解步骤','Break it into steps')},
    variable:{label:t('给变量 score 一个新值','Give score a new value'),value:10,min:0,max:100,action:t('运行赋值','Run assignment')},
    condition:{label:t('这次考了多少分？','What is the score?'),value:75,min:0,max:100,action:t('运行判断','Run the condition')},
    loop:{label:t('想让循环重复几次？','How many times should the loop run?'),value:3,min:1,max:8,action:t('逐行展开','Trace the loop')},
    complexity:{label:t('有序数组有多少个元素？','How many items are in the sorted array?'),value:16,min:1,max:1024,action:t('比较查找次数','Compare search counts')}
  };
  return configs[id] || configs.algorithm;
}
function miniText(id,v) {
  if(id==='variable')return t(`score = ${v}\nscore = score + 5\nprint(score)\n\n输出：${v+5}\n解释：先读取旧值 ${v}，加 5 后，把 ${v+5} 存回 score。`,`score = ${v}\nscore = score + 5\nprint(score)\n\nOutput: ${v+5}\nRead the old value, ${v}, add 5, then assign ${v+5} to score.`);
  if(id==='condition')return t(`score = ${v}\nif score >= 60:\n    print("通过")\nelse:\n    print("再练习一次")\n\n判断 ${v} >= 60 为 ${v>=60?'True':'False'}\n输出：${v>=60?'通过':'再练习一次'}`,`score = ${v}\nif score >= 60:\n    print("Pass")\nelse:\n    print("Try again")\n\n${v} >= 60 is ${v>=60?'True':'False'}\nOutput: ${v>=60?'Pass':'Try again'}`);
  if(id==='loop')return t(`for i in range(${v}):\n    print(i)\n\n${Array.from({length:v},(_,i)=>`第 ${i+1} 次：i = ${i}，输出 ${i}`).join('\n')}\n循环结束，共输出 ${v} 个数字。`,`for i in range(${v}):\n    print(i)\n\n${Array.from({length:v},(_,i)=>`Iteration ${i+1}: i = ${i}, output ${i}`).join('\n')}\nThe loop ends after printing ${v} ${v===1?'number':'numbers'}.`);
  if(id==='complexity')return t(`规模 n = ${v}\n\n线性查找：最坏需比较 ${v} 次。\n二分查找：最坏需比较 ${Math.floor(Math.log2(v))+1} 次。\n\n当数据已经有序，每次将候选区间减半，\n增长速度就从 O(n) 变为 O(log n)。`,`Input size n = ${v}\n\nLinear search: at most ${v} ${v===1?'comparison':'comparisons'}.\nBinary search: at most ${Math.floor(Math.log2(v))+1} ${v===1?'comparison':'comparisons'}.\n\nWith sorted data, halving the search space each time\nchanges the growth rate from O(n) to O(log n).`);
  return t(`任务：逐本贴标签。\n1. 准备 ${v} 本书和标签。\n2. 每次取出一本，贴好标签。\n3. 重复 ${v} 次。\n4. 检查：已贴标签 ${v} 本，剩余 0 本。`,`Task: label the books, one by one.\n1. Prepare ${v} ${v===1?'book and its label':'books and their labels'}.\n2. Take one book and attach its label.\n3. Repeat ${v} ${v===1?'time':'times'}.\n4. Check: ${v} ${v===1?'book':'books'} labelled, 0 remaining.`);
}
function miniCode(l) {
  const c=miniConfig(l.id);
  return `<div class="mini-code" data-mini="${l.id}"><div class="mini-code-controls"><label>${c.label}<input type="number" min="${c.min}" max="${c.max}" value="${c.value}" data-mini-input></label><button class="button secondary" data-mini-run>${icon('code')}${c.action}</button></div><pre data-mini-output aria-live="polite">${escape(miniText(l.id,c.value))}</pre><p class="small-muted">${t('这是本课的固定规则演示。修改数值，再观察运行过程。','This is a guided simulation for this lesson. Change the number to explore its behaviour.')}</p></div>`;
}
function runMini(el) {
  const id=el.dataset.mini, input=$('[data-mini-input]',el), raw=input.value, value=Number(raw), c=miniConfig(id);
  el.dataset.lastRunValue=raw;
  const invalid=!raw.trim()||!Number.isInteger(value)||value<c.min||value>c.max;
  $('[data-mini-output]',el).textContent=invalid?t(`请输入 ${c.min} 到 ${c.max} 之间的整数。`,`Enter an integer from ${c.min} to ${c.max}.`):miniText(id,value);
  input.setAttribute('aria-invalid',String(invalid));
}
function predictionFeedback(l) {
  if(!Number.isInteger(state.predictions[l.id]))return '';
  return `<strong>${state.predictions[l.id]===l.prediction.answer?t('你的预测很准确。','Your prediction was right.'):t('这是一个值得验证的猜想。','That is a prediction worth investigating.')}</strong><p>${escape(l.prediction.explanation)}</p><button type="button" class="text-button" data-scroll="experiment">${t('现在去实验里验证','Now test it in the experiment')} ${icon('arrow')}</button>`;
}
function predictionHTML(l) {
  const p=l.prediction;if(!p)return '';
  return `<form class="prediction-box" data-prediction="${l.id}" novalidate><p class="prediction-prompt">${escape(p.prompt)}</p><fieldset><legend class="sr-only">${escape(p.prompt)}</legend>${p.options.map((o,i)=>`<label><input type="radio" name="prediction-${l.id}" value="${i}" required ${state.predictions[l.id]===i?'checked':''}><span>${escape(o)}</span></label>`).join('')}</fieldset><button class="button secondary" type="submit">${t('记录预测，看看思路','Record your prediction')}</button><div class="prediction-feedback" aria-live="polite">${predictionFeedback(l)}</div></form>`;
}
function takeawaysHTML(l) {
  if(!l.takeaways)return '';
  return `<section class="takeaways"><span class="section-number">${icon('check')}</span><div><h2>${t('带走这三个发现','Three ideas to take with you')}</h2><ul>${l.takeaways.map(item=>`<li>${escape(item)}</li>`).join('')}</ul></div></section>`;
}
function lessonView(id) {
  const l=lessonById(id);
  if(!l)return `<div class="empty-state"><h1>${t('还没有这节课','This lesson is not available yet')}</h1><p>${t('回到学习路径，选择一个感兴趣的问题。','Return to the learning paths and choose a question that interests you.')}</p><a class="button primary" href="#/courses">${t('查看学习路径','Browse learning paths')}</a></div>`;
  if(!state.visited.includes(id))state.visited.push(id);
  state.last=id;save();
  const m=modules.find(item=>item.id===l.module),idx=lessons.indexOf(l),next=lessons[idx+1];
  const steps=[['wonder',t('先想一想','Predict')],['concept',t('看懂概念','Understand')],['experiment',t('动手试试','Experiment')],['practice',t('检查理解','Check')]];
  return `<a href="#/courses" class="back-link">${icon('arrow','flip')}${t('返回学习路径','Back to learning paths')}</a><div class="lesson-layout"><aside class="lesson-outline"><span class="small-muted">${m.title}</span><h2>${t('这一段学习旅程','This stage of your journey')}</h2>${m.lessons.map((key,i)=>`<a class="outline-item ${key===id?'active':''}" href="#/lesson/${key}" ${key===id?'aria-current="page"':''}><span>${completed(key)?icon('check'):i+1}</span>${lessonById(key).title}</a>`).join('')}<div class="outline-tip">${icon('spark')}${t('先预测，再验证。<br>给思考留一点时间。','Predict, then test.<br>Give yourself time to think.')}</div></aside><div class="lesson-main"><div class="lesson-heading"><div class="lesson-meta"><span>${m.title}</span><span>${icon('clock')}${t(`${l.duration} 分钟`,`${l.duration} min`)}</span><span>${completed(id)?t('已掌握','Mastered'):t('学习中','In progress')}</span></div><h1>${l.title}</h1><p>${l.summary}</p><button class="bookmark-button ${state.bookmarks.includes(id)?'saved':''}" data-bookmark="${id}" aria-pressed="${state.bookmarks.includes(id)}">${icon('bookmark')}${state.bookmarks.includes(id)?t('已收藏','Bookmarked'):t('收藏这节课','Bookmark lesson')}</button></div><nav class="lesson-steps" aria-label="${t('本课步骤','Lesson steps')}">${steps.map(([anchor,label],i)=>`<button data-scroll="${anchor}"><span>${i+1}</span>${label}</button>`).join('')}</nav><article class="lesson-article"><section class="wonder-box" id="wonder"><span class="section-number">01</span><div><span class="small-muted">${t('先想一想','Make a prediction')}</span><h2>${t('从一个问题开始','Start with a question')}</h2><p>${escape(l.intro)}</p><p class="wonder-reminder">${t('先停留几秒，想一个自己的答案。带着它继续探索。','Pause for a moment and form your own answer. Keep it in mind as you explore.')}</p>${predictionHTML(l)}</div></section><section class="concept-section" id="concept"><div class="section-title"><span class="section-number">02</span><h2>${t('一点点，把概念看清。','Build your understanding, step by step.')}</h2></div>${l.sections.map(s=>`<div class="concept-block"><h3>${s.title}</h3><p>${escape(s.body)}</p>${s.code?`<pre><code>${escape(s.code)}</code></pre>`:''}</div>`).join('')}</section><section class="lesson-experiment" id="experiment"><div class="section-title"><span class="section-number">03</span><div><h2>${t('轮到你动手了','Your turn to experiment')}</h2><p>${t('改一改输入，把你的预测变成一次实验。','Change an input and put your prediction to the test.')}</p></div></div>${l.lab?'<div id="lesson-lab"></div>':miniCode(l)}</section>${quizHTML(l)}${takeawaysHTML(l)}<details class="note-box"><summary>${icon('book')}${t('记下自己的理解','Write it in your own words')} <span>${t('笔记自动保存在本机','Notes save automatically in this browser')}</span></summary><label class="sr-only" for="lesson-note">${t('本课笔记','Lesson notes')}</label><textarea id="lesson-note" data-note="${l.id}" placeholder="${t('用自己的话说说，你今天发现了什么？','What did you discover today? Explain it in your own words.')}">${escape(state.notes[id]||'')}</textarea><span class="note-status" aria-live="polite"></span></details><div class="lesson-next"><a class="text-button" href="#/courses">${t('回到学习路径','Back to learning paths')}</a>${next?`<a class="button primary" href="#/lesson/${next.id}">${t(`下一课：${next.title}`,`Next: ${next.title}`)}${icon('arrow')}</a>`:`<a class="button primary" href="#/records">${t('看看我的学习记录','View my learning records')}${icon('arrow')}</a>`}</div></article></div></div>`;
}
function cardSearchText(g) {
  return [...zhContent.glossary,...enContent.glossary].filter(card=>cardId(card)===cardId(g)).map(card=>`${card.term} ${card.english} ${card.definition}`).join(' ');
}
function wiki() {
  return `${pageHead(t('给新概念，找一个落点。','Make a new concept your own.'),t('用自己的话理解计算机科学。先回忆，再翻开卡片。','Understand computer science in your own words. Recall the idea, then turn the card.'))}<label class="wiki-search">${icon('search')}<input type="search" id="wiki-search" placeholder="${t('搜索概念，例如「变量」「二分」','Search in Chinese or English: variable, binary…')}" aria-label="${t('搜索知识卡片','Search concept cards')}"></label><div class="wiki-counter"><span>${t(`共 ${glossary.length} 张知识卡片`,`${glossary.length} concept cards`)}</span><span>${t(`${state.cards.length} 张已记住`,`${state.cards.length} remembered`)}</span></div><div class="glossary-grid">${glossary.map(g=>`<article class="glossary-card" data-card-id="${escape(cardId(g))}" data-term="${escape(cardSearchText(g))}"><div class="glossary-top">${icon('book')}<span>${state.cards.includes(cardId(g))?t('已记住','Remembered'):t('回忆一下','Try to recall')}</span></div><h2>${g.term}</h2><p class="english-term">${g.english}</p><details><summary>${t('想好了，翻开看看','Ready? Turn the card')} ${icon('chevron')}</summary><p>${escape(g.definition)}</p><div class="glossary-actions"><button class="text-button" data-remember="${escape(cardId(g))}" aria-pressed="${state.cards.includes(cardId(g))}">${state.cards.includes(cardId(g))?t('再复习一次','Review again'):t('我记住了','I remember this')}${icon('check')}</button><a href="#/lesson/${g.lesson}">${t('回到课程','Read the lesson')} ${icon('chevron')}</a></div></details></article>`).join('')}</div><p class="empty-filter" hidden>${t('还没有匹配的概念，试试「算法」或「变量」。','No matching concept yet. Try “algorithm” or “variable”, in either language.')}</p>`;
}
function records() {
  const correct=state.mastered.filter(lessonById).length,wrong=Object.entries(state.answers).filter(([id,a])=>!a.correct&&lessonById(id));
  return `${pageHead(t('每一点理解，都留下足迹。','Every new understanding leaves a trace.'),t('这里只记录你实际做过的探索。记录保存在当前浏览器。','Only your actual learning is recorded here, in this browser.'),`<button class="button secondary" data-export>${icon('download')}${t('导出记录','Export records')}</button>`)}<div class="record-stats"><div><span>${t('已探索课程','Lessons explored')}</span><strong>${state.visited.filter(lessonById).length}<small> / ${lessons.length}</small></strong></div><div><span>${t('已掌握课程','Lessons mastered')}</span><strong>${correct}<small>${t(' 节',correct===1?' lesson':' lessons')}</small></strong></div><div><span>${t('已记住概念','Concepts remembered')}</span><strong>${state.cards.length}<small>${t(' 张',state.cards.length===1?' card':' cards')}</small></strong></div><div><span>${t('待巩固问题','Questions to revisit')}</span><strong>${wrong.length}<small>${t(' 道',wrong.length===1?' question':' questions')}</small></strong></div></div><div class="records-columns"><section class="record-panel"><h2>${t('我的学习进度','My learning progress')}</h2>${modules.map(m=>`<div class="record-progress"><div><span>${icon(m.icon)}${m.title}</span><strong>${m.lessons.filter(completed).length} / ${m.lessons.length}</strong></div><div class="progress-track"><i style="width:${progress(m.lessons)}%"></i></div></div>`).join('')}${state.last?`<a class="button primary" href="#/lesson/${state.last}">${t('继续上次学习','Continue learning')}${icon('arrow')}</a>`:`<a class="button primary" href="#/lesson/binary">${t('开始第一课','Start your first lesson')}${icon('arrow')}</a>`}</section><section class="record-panel"><h2>${t('再给这些问题一点时间','Give these questions another look')}</h2>${wrong.length?wrong.map(([id])=>`<a class="record-link" href="#/lesson/${id}?section=practice"><span>${lessonById(id).title}<small>${t('回到练习，重新验证理解','Return to the question and check your understanding')}</small></span>${icon('arrow')}</a>`).join(''):`<div class="record-empty">${icon('spark')}<p>${state.visited.length?t('目前没有待巩固的错题。','There are no questions to revisit right now.'):t('还没有练习记录。','No practice records yet.')}</p><span>${t('完成课程里的小练习，看看自己理解了多少。','Try a lesson check to find out what you have understood.')}</span></div>`}</section></div><section class="record-panel bookmark-panel"><h2>${t('我收藏的课程','My bookmarked lessons')}</h2>${state.bookmarks.filter(lessonById).length?state.bookmarks.filter(lessonById).map(id=>`<a class="record-link" href="#/lesson/${id}"><span>${lessonById(id).title}<small>${lessonById(id).summary}</small></span>${icon('arrow')}</a>`).join(''):`<p class="small-muted">${t('遇到想再看一遍的课程，点击课内的「收藏这节课」。','Want to return to a lesson? Choose “Bookmark lesson” while reading it.')}</p>`}</section><section class="record-panel activity-panel"><h2>${t('最近的学习足迹','Recent learning activity')}</h2>${state.activity.length?state.activity.slice(0,6).map(a=>`<div class="activity-item"><span class="tiny-dot"></span><span>${escape(activityText(a))}</span><time datetime="${escape(a.time)}">${new Date(a.time).toLocaleDateString(getLanguage()==='en'?'en-GB':'zh-CN',{month:'short',day:'numeric'})}</time></div>`).join(''):`<p class="small-muted">${t('第一次答题、记住概念之后，足迹会出现在这里。','Your activity will appear here when you answer a question or remember a concept.')}</p>`}</section><div class="record-privacy"><span>${icon('info')}${t('使用同一个浏览器，可以接着上次的学习。','Use this browser again to pick up where you left off.')}</span><button class="text-button danger" data-reset>${t('清除本机记录','Clear local records')}</button></div>`;
}
function furtherHTML() {
  const list=content.furtherCourses||[];if(!list.length)return '';
  return `<section class="further-courses"><div class="section-heading"><div><h2>${t('继续向计算机科学深处走','Explore further into computer science')}</h2><p>${t('完成入门后，可以从这些参考讲义继续探索。','After the introductory lessons, continue with these external lecture notes.')}</p></div><span class="quiet-tag">${t('外部课程','External courses')}</span></div><div class="further-list">${list.map(c=>`<a href="${escape(c.url)}" target="_blank" rel="noopener noreferrer"><span class="further-level">${c.level}</span><div><h3>${c.title}</h3><p>${c.description}</p></div><span class="external-label">${t('查看讲义 ↗','Open notes ↗')}</span></a>`).join('')}</div></section>`;
}
function about() {
  return `${pageHead(t('理解，从亲自探索开始。','Understanding starts with exploration.'),t('培玉 CS 是一个中英双语的计算机科学学习空间。','Peiyu CS is a bilingual learning space for computer science.'))}<article class="about-panel"><img src="./logo.svg" width="64" height="64" alt="${t('培玉','Peiyu')}"><h2>${t('把数学里的好奇，带进计算机科学。','Bring your mathematical curiosity into computer science.')}</h2><p>${t('我们借鉴「培玉高中数学」的学习方式，让你先观察一个问题，读懂一个概念，再通过实验和练习验证自己的理解。第一版从信息表示、Python 基础和算法开始，并参考 Boxi Yu 课程站的可交互讲义结构，为每节加入预测、逐步实验和自测。','Inspired by Peiyu High School Maths, each lesson starts with a question, explains an idea, then invites you to test your understanding through an experiment and a check. These introductory lessons cover information representation, Python basics and algorithms. Boxi Yu’s interactive lecture notes inform the predict–experiment–check structure.')}</p><h3>${t('这版可以做什么','What you can do here')}</h3><p>${t('九节入门课程、四个可交互实验、带解释的课内练习、知识卡片、课程收藏、笔记，以及在本机保存的学习记录。课程中的数值演示按固定规则运行；目前没有通用 Python 执行环境、账号同步或 AI 教师。','Explore nine introductory lessons and four interactive labs, answer questions with explanations, review concept cards, bookmark lessons and write notes. Progress is saved in this browser. The numerical examples are guided simulations; there is no general Python interpreter, account synchronisation or AI tutor.')}</p><h3>${t('中英文，都可以接着学','Continue learning in either language')}</h3><p>${t('随时用页面右上角的中文 / EN 切换语言。课程进度、练习选项、收藏、笔记与概念记忆共用同一份记录；笔记保留你自己写下的原文。','Use 中文 / EN in the top bar at any time. Your progress, answer selections, bookmarks, notes and remembered concepts belong to the same learning record in both languages. Your own notes stay exactly as you wrote them.')}</p><h3>${t('我们参考的学习体验','Learning experiences that inspired us')}</h3><div class="source-list">${sources.map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer"><span><strong>${s.title}</strong><small>${s.note}</small></span>${icon('arrow')}</a>`).join('')}</div><p class="small-muted">${t('以上站点是交互研究参考。本网站的中英双语讲解和实验为本原型编写，与这些课程没有隶属或认证关系。','These sites are references for interaction design. The bilingual explanations and experiments here were written for this learning space; Peiyu CS is not affiliated with or accredited by those courses.')}</p><a class="button primary" href="#/courses">${t('开始探索','Start exploring')}${icon('arrow')}</a></article>`;
}
function localizeStaticChrome() {
  syncDocumentLanguage();
  document.documentElement.lang=getLanguage()==='en'?'en':'zh-CN';
  document.documentElement.dataset.language=getLanguage();
  $('.skip-link').textContent=t('跳到主要内容','Skip to main content');
  $('#search-title').textContent=t('找到你的下一个问题','Find your next question');
  $('[data-close-search]').setAttribute('aria-label',t('关闭搜索','Close search'));
  $('#global-search').placeholder=t('搜索课程、概念和实验…','Search lessons, concepts and labs…');
  $('#global-search').setAttribute('aria-label',t('搜索课程、概念和实验','Search lessons, concepts and labs'));
  $('.search-foot').textContent=t('输入关键词搜索 · Esc 关闭','Search in either language · Esc to close');
}
function heroDisplay(touched=true) {
  const buttons=$$('.hero-bit');if(!buttons.length)return;
  const value=buttons.reduce((sum,b)=>sum+(b.getAttribute('aria-pressed')==='true'?2**(7-Number(b.dataset.bit)):0),0);
  buttons.forEach(button=>{
    const on=button.getAttribute('aria-pressed')==='true';
    button.classList.toggle('on',on);button.textContent=on?'1':'0';
    button.setAttribute('aria-label',t(`位权 ${2**(7-Number(button.dataset.bit))}，当前 ${on?1:0}`,`Place value ${2**(7-Number(button.dataset.bit))}, currently ${on?1:0}`));
  });
  $('#hero-decimal').textContent=value;
  $('#hero-character').textContent=value>=32&&value<=126?String.fromCharCode(value):'—';
  $('.hero-playground').dataset.interacted=String(touched);
  $('#hero-bit-hint').textContent=!touched?t('一个字母的背后，是一组开与关。','Behind a letter is a pattern of on and off.'):value>=32&&value<=126?t('开关变了，它表示的字符也变了。','Change the switches and the character changes too.'):value<32||value===127?t('这是控制字符，不显示为普通字母。','This is a control character, not a printable letter.'):t('这个数超出标准 ASCII 的 0–127 范围。','This value is outside the standard ASCII range of 0–127.');
}
const readingSections='#wonder,#concept,#experiment,#practice,.takeaways,.note-box';
function readingTop() {
  const header=$('.topbar')?.getBoundingClientRect();
  const steps=$('.lesson-steps')?.getBoundingClientRect();
  return steps && steps.top<=(header?.bottom||0)+1 ? steps.bottom : header?.bottom||0;
}
function captureReadingAnchor() {
  if(window.scrollY<140)return null;
  const top=readingTop();
  const visible=$$(readingSections).map((element,index)=>({index,rect:element.getBoundingClientRect()}))
    .filter(item=>item.rect.bottom>top && item.rect.top<window.innerHeight)
    .sort((a,b)=>Math.abs(a.rect.top-top)-Math.abs(b.rect.top-top));
  return visible.length?{index:visible[0].index,offset:visible[0].rect.top-top}:null;
}
function captureView() {
  return {
    scrollY:window.scrollY,
    readingAnchor:captureReadingAnchor(),
    radios:$$('[data-quiz], [data-prediction]').map(form=>({kind:form.hasAttribute('data-quiz')?'quiz':'prediction',id:form.dataset.quiz||form.dataset.prediction,choice:$('input:checked',form)?.value,hint:form.dataset.feedback==='hint'})),
    noteOpen:$('.note-box')?.open,
    noteValue:$('#lesson-note')?.value,
    mini:$$('[data-mini]').map(el=>({id:el.dataset.mini,value:$('[data-mini-input]',el).value,ran:el.hasAttribute('data-last-run-value'),lastRunValue:el.dataset.lastRunValue})),
    labState:cleanups.find(fn=>typeof fn?.getState==='function')?.getState(),
    wikiQuery:$('#wiki-search')?.value,
    openCards:$$('.glossary-card').filter(card=>$('details',card).open).map(card=>card.dataset.cardId),
    heroBits:$$('.hero-bit').map(button=>button.getAttribute('aria-pressed')==='true'),
    heroTouched:$('.hero-playground')?.dataset.interacted==='true',
    sidebarOpen:$('#sidebar')?.classList.contains('open'),
    searchQuery:$('#global-search').value
  };
}
function restoreView(snapshot) {
  for(const draft of snapshot.radios||[]) {
    const form=$(`[data-${draft.kind}="${draft.id}"]`);
    const input=form && draft.choice!==undefined ? $(`input[value="${draft.choice}"]`,form) : null;
    if(input)input.checked=true;
    if(draft.hint && form)showHint(form,draft.id);
  }
  if($('.note-box') && snapshot.noteOpen)$('.note-box').open=true;
  if($('#lesson-note') && snapshot.noteValue!==undefined)$('#lesson-note').value=snapshot.noteValue;
  for(const draft of snapshot.mini||[]) {
    const el=$(`[data-mini="${draft.id}"]`);if(!el)continue;
    const input=$('[data-mini-input]',el);
    if(draft.ran){input.value=draft.lastRunValue;runMini(el);}
    input.value=draft.value;
  }
  if($('#wiki-search') && snapshot.wikiQuery!==undefined){$('#wiki-search').value=snapshot.wikiQuery;filterWiki();}
  $$('.glossary-card').forEach(card=>{$('details',card).open=(snapshot.openCards||[]).includes(card.dataset.cardId);});
  if(snapshot.heroBits?.length){$$('.hero-bit').forEach((button,i)=>button.setAttribute('aria-pressed',String(snapshot.heroBits[i])));heroDisplay(snapshot.heroTouched);}
  if(snapshot.sidebarOpen){$('#sidebar').classList.add('open');$('.sidebar-shade').classList.add('open');$('[data-menu]').setAttribute('aria-expanded','true');}
  if(snapshot.searchQuery!==undefined)$('#global-search').value=snapshot.searchQuery;
  if($('#search-dialog').open)searchResults($('#global-search').value);
  const anchor=snapshot.readingAnchor && $$(readingSections)[snapshot.readingAnchor.index];
  const top=anchor ? window.scrollY+anchor.getBoundingClientRect().top-readingTop()-snapshot.readingAnchor.offset : snapshot.scrollY;
  window.scrollTo({top,behavior:'instant'});
}
function switchLanguage(language) {
  if(language===getLanguage())return;
  const snapshot=captureView();
  if($('#lesson-note')){state.notes[$('#lesson-note').dataset.note]=$('#lesson-note').value;save();}
  setLanguage(language);selectContent();render({preserve:snapshot});
  $(`[data-language="${language}"]`)?.focus({preventScroll:true});
}
function filterWiki() {
  const search=$('#wiki-search');if(!search)return;
  let count=0;
  $$('.glossary-card').forEach(card=>{card.hidden=!card.dataset.term.toLowerCase().includes(search.value.trim().toLowerCase());if(!card.hidden)count++;});
  $('.empty-filter').hidden=!!count;
}
function showHint(form,id) {
  const l=lessonById(id);if(!l)return;
  form.dataset.feedback='hint';
  $('.quiz-feedback',form).innerHTML=`<div class="feedback-box hint"><strong>${t('一个小提示','A small hint')}</strong><p>${escape(l.question.hint)}</p></div>`;
}
function render(options={}) {
  const snapshot=options.preserve;
  cleanups.forEach(fn=>fn?.());cleanups=[];route=currentRoute();
  const name=route.parts[0];
  const body=name==='home'?home():name==='courses'?courses():name==='labs'?labs():name==='lesson'?lessonView(route.parts[1]):name==='wiki'?wiki():name==='records'?records():about();
  $('#app').innerHTML=shell(body);localizeStaticChrome();
  document.title=`${name==='lesson'?(lessonById(route.parts[1])?.title||t('课程','Lesson')):nav().find(n=>n[0]===name)?.[2]||t('关于','About')} · ${brand()}`;
  $('[data-menu]').setAttribute('aria-controls','sidebar');$('[data-menu]').setAttribute('aria-expanded','false');
  if(!snapshot)window.scrollTo({top:0,behavior:'instant'});
  if(name==='labs')cleanups.push(mountLab($('#active-lab'),labType,{initialState:snapshot?.labState}));
  if(name==='lesson') {
    const l=lessonById(route.parts[1]);
    if(l?.lab)cleanups.push(mountLab($('#lesson-lab'),l.lab,{initialState:snapshot?.labState}));
    if(!snapshot && route.params.has('section'))requestAnimationFrame(()=>document.getElementById(route.params.get('section'))?.scrollIntoView({block:'start'}));
  }
  $$('[data-prediction]').forEach(form=>form.addEventListener('submit',event=>{
    event.preventDefault();const checked=$('input:checked',form);
    if(!checked){$('.prediction-feedback',form).innerHTML=`<p role="alert">${t('请先选择一个预测。','Choose a prediction first.')}</p>`;return;}
    const l=lessonById(form.dataset.prediction),answer=Number(checked.value);
    state.predictions[l.id]=answer;save();$('.prediction-feedback',form).innerHTML=predictionFeedback(l);
  }));
  $('#wiki-search')?.addEventListener('input',filterWiki);
  $$('[data-quiz]').forEach(form=>form.addEventListener('submit',event=>{
    event.preventDefault();const l=lessonById(form.dataset.quiz),checked=$('input:checked',form);
    if(!checked){$('.quiz-feedback',form).innerHTML=`<div class="feedback-box hint" role="alert">${t('请先选择一个答案。','Choose an answer first.')}</div>`;return;}
    const answer=Number(checked.value),correct=answer===l.question.answer;
    state.answers[l.id]={choice:answer,correct};form.dataset.feedback='answer';
    if(correct&&!state.mastered.includes(l.id)){state.mastered.push(l.id);log('mastered',l.id);}
    if(!correct){state.mastered=state.mastered.filter(id=>id!==l.id);log('review',l.id);}
    save();
    $$('.quiz-option',form).forEach((el,i)=>{el.classList.toggle('correct',i===l.question.answer);el.classList.toggle('incorrect',i===answer&&!correct);});
    $('.quiz-feedback',form).innerHTML=`<div class="feedback-box ${correct?'success':'try-again'}"><strong>${correct?t('理解得很准确。','You have understood it correctly.'):t('再想一想，你离答案更近了。','Think it through once more. You are getting closer.')}</strong><p>${escape(l.question.explanation)}</p>${!correct?`<span>${t('可以修改选择，再检查一次。','You can change your choice and check again.')}</span>`:''}</div>`;
    if(correct)toast(t('这一课的理解已记录。','Your understanding of this lesson has been recorded.'));
  }));
  if(snapshot)restoreView(snapshot);
}

document.addEventListener('click',event=>{
  const action=event.target.closest('button, a, [data-menu-close]');if(!action)return;
  if(action.dataset.language){switchLanguage(action.dataset.language);return;}
  if(action.getAttribute('href')==='#main'){event.preventDefault();$('#main').focus();$('#main').scrollIntoView();return;}
  if(action.hasAttribute('data-menu')){const open=$('#sidebar').classList.toggle('open');$('.sidebar-shade').classList.toggle('open',open);action.setAttribute('aria-expanded',String(open));}
  if(action.hasAttribute('data-menu-close')){$('#sidebar').classList.remove('open');$('.sidebar-shade').classList.remove('open');$('[data-menu]').setAttribute('aria-expanded','false');}
  if(action.hasAttribute('data-search'))openSearch();
  if(action.hasAttribute('data-close-search'))$('#search-dialog').close();
  if(action.dataset.filter){moduleFilter=action.dataset.filter;history.replaceState(null,'',`#/courses${moduleFilter==='all'?'':`?module=${moduleFilter}`}`);render();}
  if(action.dataset.scroll){const id=action.dataset.scroll;document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});history.replaceState(null,'',`#/lesson/${route.parts[1]}?section=${id}`);}
  if(action.matches('.hero-bit')){action.setAttribute('aria-pressed',String(action.getAttribute('aria-pressed')!=='true'));heroDisplay();}
  if(action.dataset.bookmark){const id=action.dataset.bookmark,exists=state.bookmarks.includes(id);state.bookmarks=exists?state.bookmarks.filter(value=>value!==id):[...state.bookmarks,id];save();action.classList.toggle('saved',!exists);action.setAttribute('aria-pressed',String(!exists));action.innerHTML=icon('bookmark')+(exists?t('收藏这节课','Bookmark lesson'):t('已收藏','Bookmarked'));toast(exists?t('已取消收藏','Bookmark removed.'):t('已收藏，可在「我的学习」找到。','Bookmarked. Find it in My learning.'));}
  if(action.dataset.hint)showHint(action.closest('form'),action.dataset.hint);
  if(action.hasAttribute('data-mini-run'))runMini(action.closest('[data-mini]'));
  if(action.dataset.remember){const id=action.dataset.remember,has=state.cards.includes(id);state.cards=has?state.cards.filter(value=>value!==id):[...state.cards,id];if(!has)log('remember',id);save();action.setAttribute('aria-pressed',String(!has));action.innerHTML=(has?t('我记住了','I remember this'):t('再复习一次','Review again'))+icon('check');$('.glossary-top span',action.closest('article')).textContent=has?t('回忆一下','Try to recall'):t('已记住','Remembered');$('.wiki-counter span:last-child').textContent=t(`${state.cards.length} 张已记住`,`${state.cards.length} remembered`);toast(has?t('已放回复习列表','Added back to your review list.'):t('这个概念已记住。','Concept marked as remembered.'));}
  if(action.hasAttribute('data-export')){const blob=new Blob([JSON.stringify({app:'Peiyu CS',language:getLanguage(),exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=t('培玉CS-学习记录.json','peiyu-cs-learning-records.json');link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(t('学习记录已导出。','Learning records exported.'));}
  if(action.hasAttribute('data-reset')&&confirm(t('清除当前浏览器里的课程进度、错题、收藏和笔记？此操作无法撤销。建议先导出记录。','Clear lesson progress, answers, bookmarks and notes in this browser? This cannot be undone. Export your records first if you want to keep a copy.'))){state=fresh();save();render();toast(t('本机记录已清除，可以重新出发。','Local records cleared. You can start afresh.'));}
});
document.addEventListener('input',event=>{
  if(event.target.dataset.note){state.notes[event.target.dataset.note]=event.target.value;save();$('.note-status').textContent=t('已保存','Saved');}
});
function openSearch() {
  const dialog=$('#search-dialog');if(!dialog.open)dialog.showModal();
  $('#global-search').value='';searchResults('');$('#global-search').focus();
}
const labAliases={binary:'二进制开关 binary switches information ASCII',logic:'逻辑门电路 logic gates AND OR XOR boolean',sorting:'冒泡排序剧场 bubble sort theatre sorting',search:'二分查找探险 binary search explorer searching'};
function searchResults(query) {
  const q=query.trim().toLowerCase();
  const found=lessons.filter(current=>[zhContent,enContent].some(data=>{
    const l=data.lessons.find(item=>item.id===current.id),m=data.modules.find(item=>item.id===l.module);
    const text=[l.title,l.tag,l.summary,m.title,l.lab?labAliases[l.lab]:'',...data.glossary.filter(card=>card.lesson===l.id).map(card=>`${card.term} ${card.english} ${card.definition}`)].join(' ');
    return text.toLowerCase().includes(q);
  }));
  $('#search-results').innerHTML=`<p class="result-label">${q?t(`找到 ${found.length} 节相关课程`,`${found.length} matching ${found.length===1?'lesson':'lessons'}`):t('从这些问题开始','Start with these questions')}</p>${found.length?found.map(l=>`<a class="search-result" href="#/lesson/${l.id}"><span class="search-result-icon">${icon(l.lab?'flask':'book')}</span><span><strong>${l.title}</strong><small>${l.tag} · ${t(`${l.duration} 分钟`,`${l.duration} min`)}</small></span>${icon('arrow')}</a>`).join(''):`<p class="no-results">${t('还没有找到，试试「二进制」「Python」或「排序」。','No match yet. Try “binary”, “Python” or “sorting”, in either language.')}</p>`}`;
}
$('#global-search').addEventListener('input',event=>searchResults(event.target.value));
$('#search-results').addEventListener('click',event=>{if(event.target.closest('a'))$('#search-dialog').close();});
$('#search-dialog').addEventListener('click',event=>{if(event.target===$('#search-dialog'))$('#search-dialog').close();});
document.addEventListener('keydown',event=>{
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();}
  if(event.key==='Escape'){$('#sidebar')?.classList.remove('open');$('.sidebar-shade')?.classList.remove('open');$('[data-menu]')?.setAttribute('aria-expanded','false');}
});
window.addEventListener('hashchange',render);
render();
