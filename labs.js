let labSequence = 0;

const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

/** Mount one self-contained interactive lesson. Call the returned function before replacing it. */
export function mountLab(container, type, { onComplete = () => {} } = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('实验需要一个页面容器。');
  const controller = new AbortController();
  const removers = [];
  const id = `peiyu-lab-${++labSequence}`;
  let timer = null;
  let completed = false;
  let disposed = false;
  container.classList.add('lab-shell');
  const query = selector => container.querySelector(selector);
  const listen = (element, event, handler) => {
    element.addEventListener(event, handler, { signal: controller.signal });
    removers.push(() => element.removeEventListener(event, handler));
  };
  const complete = () => {
    if (completed || disposed) return;
    completed = true;
    onComplete();
  };
  const stop = () => { if (timer !== null) { clearInterval(timer); timer = null; } };
  const button = (action, label, extra = '') => `<button type="button" class="lab-button" data-lab-action="${action}" ${extra}>${label}</button>`;
  const code = lines => `<ol class="lab-code" aria-label="算法步骤">${lines.map(line => `<li><code>${escapeHTML(line)}</code></li>`).join('')}</ol>`;
  const markCode = line => query('.lab-code')?.querySelectorAll('li').forEach((item, index) => {
    item.classList.toggle('lab-code-active', index === line);
    if (index === line) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
  });

  function binary() {
    let value = 65;
    const weights = [128, 64, 32, 16, 8, 4, 2, 1];
    container.innerHTML = `<div class="lab-intro"><div><h3>把 0 和 1，变成一个字母</h3><p>每个开关代表一个二进制位。点一点，看数值怎么变。</p></div><span class="lab-topic">二进制实验</span></div>
      <div class="lab-bit-grid" role="group" aria-label="8 位二进制开关">${weights.map((weight, index) => `<button class="lab-bit" type="button" data-bit="${index}" aria-pressed="false"><span class="lab-bit-weight">${weight}</span><strong>0</strong><span class="lab-bit-state">关闭</span></button>`).join('')}</div>
      <div class="lab-binary-result" aria-live="polite" aria-atomic="true"><div><span class="lab-label">十进制</span><strong class="lab-decimal"></strong></div><span class="lab-result-equal" aria-hidden="true">＝</span><div><span class="lab-label">ASCII 字符</span><strong class="lab-character"></strong></div><p class="lab-formula"></p><p class="lab-ascii-note"></p></div>
      <div class="lab-task"><span class="lab-task-copy">小挑战：把 65 变成 66，看看 A 会变成什么。</span>${button('reset', '恢复为 65', 'aria-label="恢复二进制为 65"')}</div>`;
    function render() {
      query('.lab-bit-grid').querySelectorAll('button').forEach((item, index) => {
        const enabled = Boolean(value & weights[index]);
        item.classList.toggle('lab-bit-on', enabled);
        item.setAttribute('aria-pressed', String(enabled));
        item.setAttribute('aria-label', `位权 ${weights[index]}，当前 ${enabled ? 1 : 0}，点击切换`);
        item.querySelector('strong').textContent = enabled ? '1' : '0';
        item.querySelector('.lab-bit-state').textContent = enabled ? '开启' : '关闭';
      });
      query('.lab-decimal').textContent = value;
      const printable = value >= 32 && value <= 126;
      query('.lab-character').textContent = printable ? (value === 32 ? '空格' : String.fromCharCode(value)) : '—';
      query('.lab-formula').textContent = `${weights.filter(weight => value & weight).join(' + ') || '0'} = ${value}`;
      query('.lab-ascii-note').textContent = printable ? '标准 ASCII 用 0–127 表示字符；当前值可以显示为字符。' : value <= 127 ? '这是 ASCII 控制字符，没有可打印的字形。' : '这个值超出标准 ASCII 的 0–127 范围。';
      if (value === 66) {
        query('.lab-task-copy').textContent = '完成！66 对应 B。最低两位从 01 变成了 10。';
        complete();
      } else query('.lab-task-copy').textContent = '小挑战：把 65 变成 66，看看 A 会变成什么。';
    }
    listen(query('.lab-bit-grid'), 'click', event => {
      const bit = event.target.closest('[data-bit]');
      if (!bit) return;
      value ^= weights[Number(bit.dataset.bit)];
      render();
    });
    listen(query('[data-lab-action="reset"]'), 'click', () => { value = 65; render(); });
    render();
  }

  function logic() {
    let a = 1, b = 0, gate = 'AND';
    const seen = new Set(['AND']);
    const gates = {
      AND: { name: '与门', rule: '两个输入都是 1，结果才是 1。', calculate: (x, y) => x & y },
      OR: { name: '或门', rule: '至少有一个输入是 1，结果就是 1。', calculate: (x, y) => x | y },
      XOR: { name: '异或门', rule: '两个输入不同，结果才是 1。', calculate: (x, y) => x ^ y },
    };
    container.innerHTML = `<div class="lab-intro"><div><h3>计算机怎样做判断？</h3><p>切换输入，比较三个逻辑门的规则。</p></div><span class="lab-topic">逻辑电路</span></div>
      <div class="lab-segment" role="group" aria-label="选择逻辑门">${Object.entries(gates).map(([key, item]) => `<button type="button" data-gate="${key}" aria-pressed="${key === gate}">${key} ${item.name}</button>`).join('')}</div>
      <div class="lab-logic-layout"><div><div class="lab-input-switches" role="group" aria-label="逻辑门输入"><button type="button" class="lab-switch" data-input="a" aria-pressed="true">输入 A <strong>1</strong></button><button type="button" class="lab-switch" data-input="b" aria-pressed="false">输入 B <strong>0</strong></button></div><div class="lab-circuit"></div><p class="lab-logic-rule" aria-live="polite"></p></div>
      <table class="lab-truth"><caption>真值表</caption><thead><tr><th scope="col">A</th><th scope="col">B</th><th scope="col">输出</th></tr></thead><tbody>${[0,1].flatMap(x => [0,1].map(y => `<tr data-row="${x}${y}"><td>${x}</td><td>${y}</td><td></td></tr>`)).join('')}</tbody></table></div><p class="lab-hint">小挑战：三个门都试一试，找出它们的不同。</p>`;
    function render() {
      const config = gates[gate], result = config.calculate(a,b);
      query('.lab-segment').querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.gate === gate)));
      query('.lab-input-switches').querySelectorAll('button').forEach(item => {
        const val = item.dataset.input === 'a' ? a : b;
        item.setAttribute('aria-pressed', String(Boolean(val)));
        item.querySelector('strong').textContent = val;
        item.setAttribute('aria-label', `输入 ${item.dataset.input.toUpperCase()}，当前 ${val}，点击切换`);
      });
      query('.lab-circuit').innerHTML = `<svg viewBox="0 0 400 160" role="img" aria-label="${gate} ${config.name}：输入 A 为 ${a}，输入 B 为 ${b}，输出 ${result}"><path class="lab-wire ${a ? 'lab-wire-on':''}" d="M28 48H140"/><path class="lab-wire ${b ? 'lab-wire-on':''}" d="M28 112H140"/><rect class="lab-gate" x="140" y="28" width="120" height="104" rx="22"/><path class="lab-wire ${result ? 'lab-wire-on':''}" d="M260 80H355"/><circle class="lab-bulb ${result ? 'lab-bulb-on':''}" cx="365" cy="80" r="20"/><text x="25" y="38" class="lab-circuit-label">A = ${a}</text><text x="25" y="142" class="lab-circuit-label">B = ${b}</text><text x="200" y="87" text-anchor="middle" class="lab-gate-label">${gate}</text><text x="365" y="86" text-anchor="middle" class="lab-output-label">${result}</text></svg>`;
      query('.lab-logic-rule').textContent = `${config.rule} 当前：${a} ${gate} ${b} = ${result}。`;
      query('.lab-truth tbody').querySelectorAll('tr').forEach(row => {
        const [x,y] = row.dataset.row.split('').map(Number);
        row.lastElementChild.textContent = config.calculate(x,y);
        row.classList.toggle('lab-row-active', x === a && y === b);
        if (x === a && y === b) row.setAttribute('aria-label', `当前输入：A ${x}，B ${y}，输出 ${result}`); else row.removeAttribute('aria-label');
      });
      if (seen.size === 3) { query('.lab-hint').textContent = '三个逻辑门都探索过了！当 A = B = 1 时，OR 和 XOR 的结果不同。'; complete(); }
    }
    listen(query('.lab-segment'), 'click', event => { const item = event.target.closest('[data-gate]'); if (item) { gate = item.dataset.gate; seen.add(gate); render(); } });
    listen(query('.lab-input-switches'), 'click', event => { const item = event.target.closest('[data-input]'); if (item) { if (item.dataset.input === 'a') a ^= 1; else b ^= 1; render(); } });
    render();
  }

  function sorting() {
    let snapshots = [], current = 0;
    const initial = [42, 18, 65, 9, 53, 27];
    container.innerHTML = `<div class="lab-intro"><div><h3>一步一步，看见冒泡排序</h3><p>比较相邻的两个数，把较大的数往右移。</p></div><span class="lab-topic">排序实验</span></div>
      <form class="lab-form"><label for="${id}-array">要排序的数列</label><div class="lab-field-row"><input id="${id}-array" aria-describedby="${id}-array-help ${id}-error" value="${initial.join(', ')}" autocomplete="off">${button('apply', '使用这组数')}</div><span id="${id}-array-help" class="lab-hint">输入 2–10 个 1–99 的整数，用逗号或空格分隔。</span><p class="lab-error" id="${id}-error" role="alert" hidden></p></form>
      <div class="lab-sort-chart" role="img" aria-label="冒泡排序数列"></div>
      <div class="lab-legend"><span><i class="lab-dot lab-dot-blue"></i>正在比较</span><span><i class="lab-dot lab-dot-gold"></i>交换位置</span><span><i class="lab-dot lab-dot-green"></i>已排好</span></div>
      <div class="lab-playback">${button('prev', '上一步')}${button('play', '播放', 'aria-pressed="false"')}${button('next', '下一步')}${button('reset', '重置')}<span class="lab-counter"></span></div>
      <p class="lab-narration" aria-live="polite" aria-atomic="true"></p>
      ${code(['从左到右，查看相邻两个数','比较：左边的数 > 右边的数？','如果是，交换这两个数','本轮结束，最大的数已到最右边','缩小范围，重复；全部排好后停止'])}`;
    function build(values) {
      stop(); current = 0;
      const array = [...values]; let comparisons = 0;
      snapshots = [{array:[...array],pair:[],sortedFrom:array.length,comparisons,message:'准备好了。从左边第一对数开始比较。',line:0}];
      const push = (pair,sortedFrom,message,line,swap=false,done=false) => snapshots.push({array:[...array],pair,sortedFrom,comparisons,message,line,swap,done});
      for (let end = array.length - 1; end > 0; end--) {
        let swapped = false;
        for (let index=0; index<end; index++) {
          comparisons++;
          const left = array[index], right = array[index+1];
          push([index,index+1],end+1,`第 ${comparisons} 次比较：${left} ${left > right ? '>' : '≤'} ${right}，${left > right ? '需要交换。' : '保持顺序。'}`,1);
          if (left > right) {
            [array[index],array[index+1]] = [right,left]; swapped = true;
            push([index,index+1],end+1,`交换 ${left} 和 ${right}，较大的 ${left} 向右移动了一格。`,2,true);
          }
        }
        push([],end,`这一轮结束，${array[end]} 已在正确位置。${swapped ? '接下来只看它左边的数。' : '本轮没有交换，所有数已经有序。'}`,3);
        if (!swapped) break;
      }
      push([],0,`排序完成！数列为 ${array.join('、')}，共比较 ${comparisons} 次。`,4,false,true);
      render();
    }
    function render() {
      const state = snapshots[current];
      const maximum = Math.max(...state.array);
      query('.lab-sort-chart').innerHTML = state.array.map((value,index) => `<div class="lab-sort-column"><div class="lab-sort-bar ${index >= state.sortedFrom ? 'lab-sorted' : state.pair.includes(index) ? state.swap ? 'lab-swapping' : 'lab-comparing' : ''}" style="height:${Math.max(18,value/maximum*140)}px"><span>${value}</span></div><span class="lab-index">${index}</span></div>`).join('');
      query('.lab-sort-chart').setAttribute('aria-label', `当前数列 ${state.array.join('、')}；${state.pair.length ? `比较位置 ${state.pair[0]} 和 ${state.pair[1]}` : state.done ? '排序完成' : '等待下一步'}`);
      query('.lab-narration').textContent = state.message;
      query('.lab-counter').textContent = `第 ${current}/${snapshots.length-1} 步 · 比较 ${state.comparisons} 次`;
      query('[data-lab-action="prev"]').disabled = current === 0;
      query('[data-lab-action="next"]').disabled = current === snapshots.length-1;
      query('[data-lab-action="play"]').disabled = current === snapshots.length-1;
      query('[data-lab-action="play"]').textContent = timer !== null ? '暂停' : '播放';
      query('[data-lab-action="play"]').setAttribute('aria-pressed', String(timer !== null));
      markCode(state.line);
      if (state.done) complete();
    }
    function next() {
      if (current < snapshots.length-1) current++;
      if (current === snapshots.length-1) stop();
      render();
    }
    function apply(event) {
      event?.preventDefault();
      const raw = query('input').value.trim();
      const parts = raw.split(/[,，\s]+/).filter(Boolean);
      const valid = parts.length >= 2 && parts.length <= 10 && parts.every(value => /^\d+$/.test(value) && Number(value)>=1 && Number(value)<=99);
      const error = query('.lab-error');
      if (!valid) { error.textContent = '请填写 2–10 个 1–99 的整数，例如：42, 18, 65, 9。'; error.hidden = false; query('input').setAttribute('aria-invalid','true'); return; }
      error.hidden = true; query('input').removeAttribute('aria-invalid');
      build(parts.map(Number));
    }
    listen(query('form'), 'submit', apply);
    listen(container, 'click', event => {
      const action = event.target.closest('[data-lab-action]')?.dataset.labAction;
      if (action === 'apply') apply();
      if (action === 'next') { stop(); next(); }
      if (action === 'prev') { stop(); current = Math.max(0,current-1); render(); }
      if (action === 'reset') { stop(); current = 0; render(); }
      if (action === 'play') {
        if (timer !== null) stop();
        else timer = setInterval(next,850);
        render();
      }
    });
    build(initial);
  }

  function search() {
    const values = [3,8,12,17,23,31,42,56,68,75,89,97];
    let snapshots = [], current = 0;
    container.innerHTML = `<div class="lab-intro"><div><h3>每次排除一半，找到目标</h3><p>二分查找需要先排好序。先看中间，再决定向左还是向右。</p></div><span class="lab-topic">查找实验</span></div>
      <form class="lab-form"><label for="${id}-target">想找哪个数？</label><div class="lab-field-row"><input id="${id}-target" type="number" value="42" min="0" max="1000" step="1" aria-describedby="${id}-error">${button('apply','开始查找')}</div><p class="lab-error" id="${id}-error" role="alert" hidden></p></form>
      <div class="lab-search-array" role="list" aria-label="已排序的数列"></div>
      <div class="lab-legend"><span><i class="lab-dot lab-dot-blue"></i>当前中点</span><span><i class="lab-dot lab-dot-green"></i>找到目标</span><span><i class="lab-dot lab-dot-gray"></i>已经排除</span></div>
      <div class="lab-playback">${button('prev','上一步')}${button('next','下一步')}${button('reset','重置')}<span class="lab-counter"></span></div><p class="lab-narration" aria-live="polite" aria-atomic="true"></p>
      ${code(['设置左边界 L = 0，右边界 R = n − 1','取中点 M = ⌊(L + R) / 2⌋','如果数列[M] = 目标，查找成功','如果数列[M] < 目标，L = M + 1','否则 R = M − 1；继续查找','如果 L > R，数列中没有这个数'])}`;
    function build(target) {
      current = 0; snapshots = [];
      let low = 0, high = values.length-1, comparisons = 0;
      const push = (middle,message,line,found=false,done=false) => snapshots.push({low,high,middle,message,line,comparisons,found,done});
      push(-1,`目标是 ${target}。从完整数列开始，左边界 L = 0，右边界 R = ${high}。`,0);
      while (low <= high) {
        const middle = Math.floor((low+high)/2); comparisons++;
        push(middle,`第 ${comparisons} 次比较：在位置 ${low}–${high} 中取中点 ${middle}，对应的数是 ${values[middle]}。`,1);
        if (values[middle] === target) {
          push(middle,`找到了！${target} 位于索引 ${middle}（从 0 开始），只比较了 ${comparisons} 次。`,2,true,true); break;
        }
        if (values[middle] < target) {
          const discarded = middle; low = middle+1;
          push(-1,`${values[discarded]} < ${target}，它和左侧的数都不可能是目标。把左边界移到 ${low}。`,3);
        } else {
          const discarded = middle; high = middle-1;
          push(-1,`${values[discarded]} > ${target}，它和右侧的数都不可能是目标。把右边界移到 ${high}。`,4);
        }
      }
      if (low > high) push(-1,`区间已经为空（L = ${low} > R = ${high}）。比较 ${comparisons} 次后确认：数列中没有 ${target}。`,5,false,true);
      render();
    }
    function render() {
      const state = snapshots[current];
      query('.lab-search-array').innerHTML = values.map((value,index) => {
        const excluded = index < state.low || index > state.high;
        const middle = index === state.middle;
        const status = state.found && middle ? '找到目标' : excluded ? '已排除' : middle ? '当前中点' : '待查找';
        return `<div class="lab-search-cell ${excluded?'lab-excluded':''} ${middle ? state.found?'lab-found':'lab-middle':''}" role="listitem" aria-label="索引 ${index}，数值 ${value}，${status}"><strong>${value}</strong><span>${index}</span><small>${middle ? state.found?'找到':'中点' : index === state.low?'左界':index === state.high?'右界':'　'}</small></div>`;
      }).join('');
      query('.lab-narration').textContent = state.message;
      query('.lab-counter').textContent = `第 ${current}/${snapshots.length-1} 步 · 比较 ${state.comparisons} 次`;
      query('[data-lab-action="prev"]').disabled = current === 0;
      query('[data-lab-action="next"]').disabled = current === snapshots.length-1;
      markCode(state.line);
      if (state.done) complete();
    }
    function apply(event) {
      event?.preventDefault();
      const raw = query('input').value.trim(), target = Number(raw);
      const valid = raw !== '' && Number.isInteger(target) && target >= 0 && target <= 1000;
      if (!valid) { query('.lab-error').textContent = '请输入 0–1000 的整数。也可以输入数列中没有的数，观察查找如何结束。'; query('.lab-error').hidden = false; query('input').setAttribute('aria-invalid','true'); return; }
      query('.lab-error').hidden = true; query('input').removeAttribute('aria-invalid'); build(target);
    }
    listen(query('form'),'submit',apply);
    listen(container,'click',event => {
      const action = event.target.closest('[data-lab-action]')?.dataset.labAction;
      if(action === 'apply') apply();
      if(action === 'prev') { current = Math.max(0,current-1); render(); }
      if(action === 'next') { current = Math.min(snapshots.length-1,current+1); render(); }
      if(action === 'reset') { current = 0; render(); }
    });
    build(42);
  }

  const mounts = { binary, logic, sorting, search };
  if (!mounts[type]) { container.textContent = '这个实验暂未提供。请从实验列表选择。'; }
  else mounts[type]();
  return () => { disposed = true; stop(); controller.abort(); removers.forEach(remove => remove()); container.replaceChildren(); container.classList.remove('lab-shell'); };
}
