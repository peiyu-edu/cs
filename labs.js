import { t } from './i18n.js';

let labSequence = 0;
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const validArray = values => Array.isArray(values) && values.length >= 2 && values.length <= 10 && values.every(value => Number.isInteger(value) && value >= 1 && value <= 99);
const savedStep = (step, maximum) => Number.isInteger(step) ? Math.max(0, Math.min(maximum, step)) : 0;
const comparisonCount = count => `${count} ${count === 1 ? 'comparison' : 'comparisons'}`;

/** Mount a lab; call cleanup before replacing it. cleanup.getState() can restore a translated view. */
export function mountLab(container, type, { onComplete = () => {}, initialState } = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError(t('实验需要一个页面容器。', 'The experiment needs a page container.'));
  const restored = initialState?.type === type ? initialState : null;
  const controller = new AbortController();
  const removers = [];
  const id = `peiyu-lab-${++labSequence}`;
  let timer = null;
  let completed = restored?.completed === true;
  let disposed = false;
  let readState = () => ({ type, completed });
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
  const code = lines => `<ol class="lab-code" aria-label="${t('算法步骤', 'Algorithm steps')}">${lines.map(line => `<li><code>${escapeHTML(line)}</code></li>`).join('')}</ol>`;
  const markCode = line => query('.lab-code')?.querySelectorAll('li').forEach((item, index) => {
    item.classList.toggle('lab-code-active', index === line);
    if (index === line) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
  });

  function binary() {
    let value = Number.isInteger(restored?.value) && restored.value >= 0 && restored.value <= 255 ? restored.value : 65;
    const weights = [128, 64, 32, 16, 8, 4, 2, 1];
    container.innerHTML = `<div class="lab-intro"><div><h3>${t('把 0 和 1，变成一个字母', 'Turn 0s and 1s into a letter')}</h3><p>${t('每个开关代表一个二进制位。点一点，看数值怎么变。', 'Each switch represents one bit. Toggle a switch and watch the value change.')}</p></div><span class="lab-topic">${t('二进制实验', 'Binary lab')}</span></div>
      <div class="lab-bit-grid" role="group" aria-label="${t('8 位二进制开关', '8-bit binary switches')}">${weights.map((weight, index) => `<button class="lab-bit" type="button" data-bit="${index}" aria-pressed="false"><span class="lab-bit-weight">${weight}</span><strong>0</strong><span class="lab-bit-state">${t('关闭', 'Off')}</span></button>`).join('')}</div>
      <div class="lab-binary-result" aria-live="polite" aria-atomic="true"><div><span class="lab-label">${t('十进制', 'Decimal')}</span><strong class="lab-decimal"></strong></div><span class="lab-result-equal" aria-hidden="true">＝</span><div><span class="lab-label">${t('ASCII 字符', 'ASCII character')}</span><strong class="lab-character"></strong></div><p class="lab-formula"></p><p class="lab-ascii-note"></p></div>
      <div class="lab-task"><span class="lab-task-copy"></span>${button('reset', t('恢复为 65', 'Reset to 65'), `aria-label="${t('恢复二进制为 65', 'Reset the binary value to 65')}"`)}</div>`;
    function render() {
      query('.lab-bit-grid').querySelectorAll('button').forEach((item, index) => {
        const enabled = Boolean(value & weights[index]);
        item.classList.toggle('lab-bit-on', enabled);
        item.setAttribute('aria-pressed', String(enabled));
        item.setAttribute('aria-label', t(`位权 ${weights[index]}，当前 ${enabled ? 1 : 0}，点击切换`, `Place value ${weights[index]}, currently ${enabled ? 1 : 0}; click to toggle`));
        item.querySelector('strong').textContent = enabled ? '1' : '0';
        item.querySelector('.lab-bit-state').textContent = enabled ? t('开启', 'On') : t('关闭', 'Off');
      });
      query('.lab-decimal').textContent = value;
      const printable = value >= 32 && value <= 126;
      query('.lab-character').textContent = printable ? (value === 32 ? t('空格', 'Space') : String.fromCharCode(value)) : '—';
      query('.lab-formula').textContent = `${weights.filter(weight => value & weight).join(' + ') || '0'} = ${value}`;
      query('.lab-ascii-note').textContent = printable ? t('标准 ASCII 用 0–127 表示字符；当前值可以显示为字符。', 'Standard ASCII uses values 0–127. This value has a printable character.') : value <= 127 ? t('这是 ASCII 控制字符，没有可打印的字形。', 'This is an ASCII control character, with no printable glyph.') : t('这个值超出标准 ASCII 的 0–127 范围。', 'This value is outside the standard ASCII range of 0–127.');
      if (value === 66) {
        query('.lab-task-copy').textContent = t('完成！66 对应 B。最低两位从 01 变成了 10。', 'Done! 66 represents B. The last two bits changed from 01 to 10.');
        complete();
      } else query('.lab-task-copy').textContent = t('小挑战：把 65 变成 66，看看 A 会变成什么。', 'Challenge: change 65 to 66 and find out what A becomes.');
    }
    listen(query('.lab-bit-grid'), 'click', event => {
      const bit = event.target.closest('[data-bit]');
      if (!bit) return;
      value ^= weights[Number(bit.dataset.bit)];
      render();
    });
    listen(query('[data-lab-action="reset"]'), 'click', () => { value = 65; render(); });
    readState = () => ({ type, completed, value });
    render();
  }

  function logic() {
    let a = restored?.a === 0 ? 0 : 1, b = restored?.b === 1 ? 1 : 0;
    let gate = ['AND', 'OR', 'XOR'].includes(restored?.gate) ? restored.gate : 'AND';
    const seen = new Set(Array.isArray(restored?.seen) ? restored.seen.filter(key => ['AND', 'OR', 'XOR'].includes(key)) : ['AND']);
    seen.add(gate);
    const gates = {
      AND: { name: t('与门', 'gate'), rule: t('两个输入都是 1，结果才是 1。', 'The output is 1 only when both inputs are 1.'), calculate: (x, y) => x & y },
      OR: { name: t('或门', 'gate'), rule: t('至少有一个输入是 1，结果就是 1。', 'The output is 1 when at least one input is 1.'), calculate: (x, y) => x | y },
      XOR: { name: t('异或门', 'gate'), rule: t('两个输入不同，结果才是 1。', 'The output is 1 only when the two inputs differ.'), calculate: (x, y) => x ^ y },
    };
    container.innerHTML = `<div class="lab-intro"><div><h3>${t('计算机怎样做判断？', 'How do computers make decisions?')}</h3><p>${t('切换输入，比较三个逻辑门的规则。', 'Toggle the inputs and compare the rules of three logic gates.')}</p></div><span class="lab-topic">${t('逻辑电路', 'Logic circuits')}</span></div>
      <div class="lab-segment" role="group" aria-label="${t('选择逻辑门', 'Choose a logic gate')}">${Object.entries(gates).map(([key, item]) => `<button type="button" data-gate="${key}" aria-pressed="${key === gate}">${key} ${item.name}</button>`).join('')}</div>
      <div class="lab-logic-layout"><div><div class="lab-input-switches" role="group" aria-label="${t('逻辑门输入', 'Logic gate inputs')}"><button type="button" class="lab-switch" data-input="a" aria-pressed="true">${t('输入 A', 'Input A')} <strong>1</strong></button><button type="button" class="lab-switch" data-input="b" aria-pressed="false">${t('输入 B', 'Input B')} <strong>0</strong></button></div><div class="lab-circuit"></div><p class="lab-logic-rule" aria-live="polite"></p></div>
      <table class="lab-truth"><caption>${t('真值表', 'Truth table')}</caption><thead><tr><th scope="col">A</th><th scope="col">B</th><th scope="col">${t('输出', 'Output')}</th></tr></thead><tbody>${[0,1].flatMap(x => [0,1].map(y => `<tr data-row="${x}${y}"><td>${x}</td><td>${y}</td><td></td></tr>`)).join('')}</tbody></table></div><p class="lab-hint">${t('小挑战：三个门都试一试，找出它们的不同。', 'Challenge: try all three gates and find out how they differ.')}</p>`;
    function render() {
      const config = gates[gate], result = config.calculate(a,b);
      query('.lab-segment').querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.gate === gate)));
      query('.lab-input-switches').querySelectorAll('button').forEach(item => {
        const val = item.dataset.input === 'a' ? a : b;
        item.setAttribute('aria-pressed', String(Boolean(val)));
        item.querySelector('strong').textContent = val;
        item.setAttribute('aria-label', t(`输入 ${item.dataset.input.toUpperCase()}，当前 ${val}，点击切换`, `Input ${item.dataset.input.toUpperCase()}, currently ${val}; click to toggle`));
      });
      query('.lab-circuit').innerHTML = `<svg viewBox="0 0 400 160" role="img" aria-label="${t(`${gate} ${config.name}：输入 A 为 ${a}，输入 B 为 ${b}，输出 ${result}`, `${gate} gate: input A is ${a}, input B is ${b}, output is ${result}`)}"><path class="lab-wire ${a ? 'lab-wire-on':''}" d="M28 48H140"/><path class="lab-wire ${b ? 'lab-wire-on':''}" d="M28 112H140"/><rect class="lab-gate" x="140" y="28" width="120" height="104" rx="22"/><path class="lab-wire ${result ? 'lab-wire-on':''}" d="M260 80H355"/><circle class="lab-bulb ${result ? 'lab-bulb-on':''}" cx="365" cy="80" r="20"/><text x="25" y="38" class="lab-circuit-label">A = ${a}</text><text x="25" y="142" class="lab-circuit-label">B = ${b}</text><text x="200" y="87" text-anchor="middle" class="lab-gate-label">${gate}</text><text x="365" y="86" text-anchor="middle" class="lab-output-label">${result}</text></svg>`;
      query('.lab-logic-rule').textContent = t(`${config.rule} 当前：${a} ${gate} ${b} = ${result}。`, `${config.rule} Now: ${a} ${gate} ${b} = ${result}.`);
      query('.lab-truth tbody').querySelectorAll('tr').forEach(row => {
        const [x,y] = row.dataset.row.split('').map(Number);
        row.lastElementChild.textContent = config.calculate(x,y);
        row.classList.toggle('lab-row-active', x === a && y === b);
        if (x === a && y === b) row.setAttribute('aria-label', t(`当前输入：A ${x}，B ${y}，输出 ${result}`, `Current inputs: A ${x}, B ${y}; output ${result}`)); else row.removeAttribute('aria-label');
      });
      if (seen.size === 3) { query('.lab-hint').textContent = t('三个逻辑门都探索过了！当 A = B = 1 时，OR 和 XOR 的结果不同。', 'You explored all three gates! When A = B = 1, OR and XOR give different outputs.'); complete(); }
    }
    listen(query('.lab-segment'), 'click', event => { const item = event.target.closest('[data-gate]'); if (item) { gate = item.dataset.gate; seen.add(gate); render(); } });
    listen(query('.lab-input-switches'), 'click', event => { const item = event.target.closest('[data-input]'); if (item) { if (item.dataset.input === 'a') a ^= 1; else b ^= 1; render(); } });
    readState = () => ({ type, completed, a, b, gate, seen: [...seen] });
    render();
  }

  function sorting() {
    let snapshots = [], current = 0, sourceValues = [];
    const initial = validArray(restored?.values) ? restored.values : [42, 18, 65, 9, 53, 27];
    container.innerHTML = `<div class="lab-intro"><div><h3>${t('一步一步，看见冒泡排序', 'Watch bubble sort, one step at a time')}</h3><p>${t('比较相邻的两个数，把较大的数往右移。', 'Compare neighboring numbers and move the larger one to the right.')}</p></div><span class="lab-topic">${t('排序实验', 'Sorting lab')}</span></div>
      <form class="lab-form"><label for="${id}-array">${t('要排序的数列', 'Numbers to sort')}</label><div class="lab-field-row"><input id="${id}-array" aria-describedby="${id}-array-help ${id}-error" value="${initial.join(', ')}" autocomplete="off">${button('apply', t('使用这组数', 'Use these numbers'))}</div><span id="${id}-array-help" class="lab-hint">${t('输入 2–10 个 1–99 的整数，用逗号或空格分隔。', 'Enter 2–10 integers from 1 to 99, separated by commas or spaces.')}</span><p class="lab-error" id="${id}-error" role="alert" hidden></p></form>
      <div class="lab-sort-chart" role="img" aria-label="${t('冒泡排序数列', 'Bubble sort array')}"></div>
      <div class="lab-legend"><span><i class="lab-dot lab-dot-blue"></i>${t('正在比较', 'Comparing')}</span><span><i class="lab-dot lab-dot-gold"></i>${t('交换位置', 'Swapping')}</span><span><i class="lab-dot lab-dot-green"></i>${t('已排好', 'Sorted')}</span></div>
      <div class="lab-playback">${button('prev', t('上一步', 'Previous'))}${button('play', t('播放', 'Play'), 'aria-pressed="false"')}${button('next', t('下一步', 'Next'))}${button('reset', t('重置', 'Reset'))}<span class="lab-counter"></span></div>
      <p class="lab-narration" aria-live="polite" aria-atomic="true"></p>
      ${code([t('从左到右，查看相邻两个数', 'Scan neighboring pairs from left to right'), t('比较：左边的数 > 右边的数？', 'Compare: is the left number > the right number?'), t('如果是，交换这两个数', 'If so, swap the two numbers'), t('本轮结束，最大的数已到最右边', 'After this pass, the largest number is at the right'), t('缩小范围，重复；全部排好后停止', 'Shrink the range and repeat; stop when sorted')])}`;
    const errorMessage = () => t('请填写 2–10 个 1–99 的整数，例如：42, 18, 65, 9。', 'Enter 2–10 integers from 1 to 99, for example: 42, 18, 65, 9.');
    function build(values, step = 0) {
      stop(); sourceValues = [...values];
      const array = [...values]; let comparisons = 0;
      snapshots = [{array:[...array],pair:[],sortedFrom:array.length,comparisons,message:t('准备好了。从左边第一对数开始比较。', 'Ready. Start by comparing the first pair on the left.'),line:0}];
      const push = (pair,sortedFrom,message,line,swap=false,done=false) => snapshots.push({array:[...array],pair,sortedFrom,comparisons,message,line,swap,done});
      for (let end = array.length - 1; end > 0; end--) {
        let swapped = false;
        for (let index=0; index<end; index++) {
          comparisons++;
          const left = array[index], right = array[index+1];
          push([index,index+1],end+1,t(`第 ${comparisons} 次比较：${left} ${left > right ? '>' : '≤'} ${right}，${left > right ? '需要交换。' : '保持顺序。'}`, `Comparison ${comparisons}: ${left} ${left > right ? '>' : '≤'} ${right}; ${left > right ? 'swap the pair.' : 'keep this order.'}`),1);
          if (left > right) {
            [array[index],array[index+1]] = [right,left]; swapped = true;
            push([index,index+1],end+1,t(`交换 ${left} 和 ${right}，较大的 ${left} 向右移动了一格。`, `Swap ${left} and ${right}. The larger value, ${left}, moves one position right.`),2,true);
          }
        }
        push([],end,t(`这一轮结束，${array[end]} 已在正确位置。${swapped ? '接下来只看它左边的数。' : '本轮没有交换，所有数已经有序。'}`, `Pass complete: ${array[end]} is in its final position. ${swapped ? 'Next, consider only the numbers to its left.' : 'No swaps in this pass: the whole array is sorted.'}`),3);
        if (!swapped) break;
      }
      push([],0,t(`排序完成！数列为 ${array.join('、')}，共比较 ${comparisons} 次。`, `Sorted! The array is ${array.join(', ')} after ${comparisonCount(comparisons)}.`),4,false,true);
      current = savedStep(step, snapshots.length-1);
      render();
    }
    function render() {
      const state = snapshots[current];
      const maximum = Math.max(...state.array);
      query('.lab-sort-chart').innerHTML = state.array.map((value,index) => `<div class="lab-sort-column"><div class="lab-sort-bar ${index >= state.sortedFrom ? 'lab-sorted' : state.pair.includes(index) ? state.swap ? 'lab-swapping' : 'lab-comparing' : ''}" style="height:${Math.max(18,value/maximum*140)}px"><span>${value}</span></div><span class="lab-index">${index}</span></div>`).join('');
      query('.lab-sort-chart').setAttribute('aria-label', t(`当前数列 ${state.array.join('、')}；${state.pair.length ? `比较位置 ${state.pair[0]} 和 ${state.pair[1]}` : state.done ? '排序完成' : '等待下一步'}`, `Current array: ${state.array.join(', ')}; ${state.pair.length ? `comparing positions ${state.pair[0]} and ${state.pair[1]}` : state.done ? 'sorting complete' : 'ready for the next step'}`));
      query('.lab-narration').textContent = state.message;
      query('.lab-counter').textContent = t(`第 ${current}/${snapshots.length-1} 步 · 比较 ${state.comparisons} 次`, `Step ${current}/${snapshots.length-1} · ${comparisonCount(state.comparisons)}`);
      query('[data-lab-action="prev"]').disabled = current === 0;
      query('[data-lab-action="next"]').disabled = current === snapshots.length-1;
      query('[data-lab-action="play"]').disabled = current === snapshots.length-1;
      query('[data-lab-action="play"]').textContent = timer !== null ? t('暂停', 'Pause') : t('播放', 'Play');
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
      const parts = query('input').value.trim().split(/[,，\s]+/).filter(Boolean);
      const valid = parts.every(value => /^\d+$/.test(value)) && validArray(parts.map(Number));
      const error = query('.lab-error');
      if (!valid) { error.textContent = errorMessage(); error.hidden = false; query('input').setAttribute('aria-invalid','true'); return; }
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
    build(initial, restored?.step);
    if (typeof restored?.inputValue === 'string') query('input').value = restored.inputValue;
    if (restored?.invalid) { query('.lab-error').textContent = errorMessage(); query('.lab-error').hidden = false; query('input').setAttribute('aria-invalid','true'); }
    readState = () => ({ type, completed, values: [...sourceValues], step: current, inputValue: query('input').value, invalid: !query('.lab-error').hidden });
  }

  function search() {
    const values = [3,8,12,17,23,31,42,56,68,75,89,97];
    let snapshots = [], current = 0, sourceTarget = 42;
    const initialTarget = Number.isInteger(restored?.target) && restored.target >= 0 && restored.target <= 1000 ? restored.target : 42;
    container.innerHTML = `<div class="lab-intro"><div><h3>${t('每次排除一半，找到目标', 'Halve the range to find the target')}</h3><p>${t('二分查找需要先排好序。先看中间，再决定向左还是向右。', 'Binary search needs sorted data. Check the middle, then choose left or right.')}</p></div><span class="lab-topic">${t('查找实验', 'Search lab')}</span></div>
      <form class="lab-form"><label for="${id}-target">${t('想找哪个数？', 'Which number do you want to find?')}</label><div class="lab-field-row"><input id="${id}-target" type="number" value="${initialTarget}" min="0" max="1000" step="1" aria-describedby="${id}-error">${button('apply',t('开始查找', 'Start search'))}</div><p class="lab-error" id="${id}-error" role="alert" hidden></p></form>
      <div class="lab-search-array" role="list" aria-label="${t('已排序的数列', 'Sorted array')}"></div>
      <div class="lab-legend"><span><i class="lab-dot lab-dot-blue"></i>${t('当前中点', 'Current midpoint')}</span><span><i class="lab-dot lab-dot-green"></i>${t('找到目标', 'Target found')}</span><span><i class="lab-dot lab-dot-gray"></i>${t('已经排除', 'Ruled out')}</span></div>
      <div class="lab-playback">${button('prev',t('上一步', 'Previous'))}${button('next',t('下一步', 'Next'))}${button('reset',t('重置', 'Reset'))}<span class="lab-counter"></span></div><p class="lab-narration" aria-live="polite" aria-atomic="true"></p>
      ${code([t('设置左边界 L = 0，右边界 R = n − 1', 'Set left bound L = 0 and right bound R = n − 1'), t('取中点 M = ⌊(L + R) / 2⌋', 'Take midpoint M = ⌊(L + R) / 2⌋'), t('如果数列[M] = 目标，查找成功', 'If array[M] = target, the search succeeds'), t('如果数列[M] < 目标，L = M + 1', 'If array[M] < target, set L = M + 1'), t('否则 R = M − 1；继续查找', 'Otherwise set R = M − 1; keep searching'), t('如果 L > R，数列中没有这个数', 'If L > R, the target is not in the array')])}`;
    const errorMessage = () => t('请输入 0–1000 的整数。也可以输入数列中没有的数，观察查找如何结束。', 'Enter an integer from 0 to 1000. Try a value outside the array to see how the search ends.');
    function build(target, step = 0) {
      sourceTarget = target; snapshots = [];
      let low = 0, high = values.length-1, comparisons = 0;
      const push = (middle,message,line,found=false,done=false) => snapshots.push({low,high,middle,message,line,comparisons,found,done});
      push(-1,t(`目标是 ${target}。从完整数列开始，左边界 L = 0，右边界 R = ${high}。`, `The target is ${target}. Start with the full array: left bound L = 0, right bound R = ${high}.`),0);
      while (low <= high) {
        const middle = Math.floor((low+high)/2); comparisons++;
        push(middle,t(`第 ${comparisons} 次比较：在位置 ${low}–${high} 中取中点 ${middle}，对应的数是 ${values[middle]}。`, `Comparison ${comparisons}: within positions ${low}–${high}, midpoint ${middle} holds ${values[middle]}.`),1);
        if (values[middle] === target) {
          push(middle,t(`找到了！${target} 位于索引 ${middle}（从 0 开始），只比较了 ${comparisons} 次。`, `Found! ${target} is at index ${middle} (counting from 0), after ${comparisonCount(comparisons)}.`),2,true,true); break;
        }
        if (values[middle] < target) {
          const discarded = middle; low = middle+1;
          push(-1,t(`${values[discarded]} < ${target}，它和左侧的数都不可能是目标。把左边界移到 ${low}。`, `${values[discarded]} < ${target}, so it and everything to its left can be ruled out. Move L to ${low}.`),3);
        } else {
          const discarded = middle; high = middle-1;
          push(-1,t(`${values[discarded]} > ${target}，它和右侧的数都不可能是目标。把右边界移到 ${high}。`, `${values[discarded]} > ${target}, so it and everything to its right can be ruled out. Move R to ${high}.`),4);
        }
      }
      if (low > high) push(-1,t(`区间已经为空（L = ${low} > R = ${high}）。比较 ${comparisons} 次后确认：数列中没有 ${target}。`, `The range is empty (L = ${low} > R = ${high}). After ${comparisonCount(comparisons)}, we know ${target} is not in the array.`),5,false,true);
      current = savedStep(step, snapshots.length-1);
      render();
    }
    function render() {
      const state = snapshots[current];
      query('.lab-search-array').innerHTML = values.map((value,index) => {
        const excluded = index < state.low || index > state.high;
        const middle = index === state.middle;
        const status = state.found && middle ? t('找到目标', 'Target found') : excluded ? t('已排除', 'Ruled out') : middle ? t('当前中点', 'Current midpoint') : t('待查找', 'Still in range');
        return `<div class="lab-search-cell ${excluded?'lab-excluded':''} ${middle ? state.found?'lab-found':'lab-middle':''}" role="listitem" aria-label="${t(`索引 ${index}，数值 ${value}，${status}`, `Index ${index}, value ${value}, ${status}`)}"><strong>${value}</strong><span>${index}</span><small>${middle ? state.found?t('找到', 'Found'):t('中点', 'Mid') : index === state.low?t('左界', 'Left'):index === state.high?t('右界', 'Right'):'　'}</small></div>`;
      }).join('');
      query('.lab-narration').textContent = state.message;
      query('.lab-counter').textContent = t(`第 ${current}/${snapshots.length-1} 步 · 比较 ${state.comparisons} 次`, `Step ${current}/${snapshots.length-1} · ${comparisonCount(state.comparisons)}`);
      query('[data-lab-action="prev"]').disabled = current === 0;
      query('[data-lab-action="next"]').disabled = current === snapshots.length-1;
      markCode(state.line);
      if (state.done) complete();
    }
    function apply(event) {
      event?.preventDefault();
      const raw = query('input').value.trim(), target = Number(raw);
      const valid = raw !== '' && Number.isInteger(target) && target >= 0 && target <= 1000;
      if (!valid) { query('.lab-error').textContent = errorMessage(); query('.lab-error').hidden = false; query('input').setAttribute('aria-invalid','true'); return; }
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
    build(initialTarget, restored?.step);
    if (typeof restored?.inputValue === 'string') query('input').value = restored.inputValue;
    if (restored?.invalid) { query('.lab-error').textContent = errorMessage(); query('.lab-error').hidden = false; query('input').setAttribute('aria-invalid','true'); }
    readState = () => ({ type, completed, target: sourceTarget, step: current, inputValue: query('input').value, invalid: !query('.lab-error').hidden });
  }

  const mounts = { binary, logic, sorting, search };
  if (!mounts[type]) container.textContent = t('这个实验暂未提供。请从实验列表选择。', 'This experiment is not available. Choose one from the experiment list.');
  else mounts[type]();
  const cleanup = () => { disposed = true; stop(); controller.abort(); removers.forEach(remove => remove()); container.replaceChildren(); container.classList.remove('lab-shell'); };
  cleanup.getState = () => JSON.parse(JSON.stringify(readState()));
  return cleanup;
}
