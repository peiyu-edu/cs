// Main-thread side of the in-browser Python runner. The worker is created on first use,
// and replaced after a timeout so the next run starts from a clean interpreter.
import { t } from './i18n.js';

export const TIMEOUT_MS = 5000;
const LOAD_TIMEOUT_MS = 60000;
let worker = null;
let ready = null;
let status = 'idle'; // idle | loading | ready | failed
let runId = 0;
const listeners = new Set();

function setStatus(next) {
  status = next;
  listeners.forEach(fn => fn(status));
}

function reset() {
  worker?.terminate();
  worker = null;
  ready = null;
}

function start() {
  setStatus('loading');
  worker = new Worker(new URL('./py-worker.js', import.meta.url));
  const current = worker;
  ready = new Promise((resolve, reject) => {
    current.addEventListener('message', ({ data }) => {
      if (data.type === 'ready') resolve();
      if (data.type === 'load-error') reject(new Error(data.message));
    });
    current.addEventListener('error', event => reject(new Error(event.message || 'Worker error')));
    // A very slow network should end in the fallback, not an endless spinner.
    setTimeout(() => reject(new Error('Pyodide load timed out')), LOAD_TIMEOUT_MS);
  });
  ready.then(() => setStatus('ready'), () => { reset(); setStatus('failed'); });
  current.postMessage({ type: 'load' });
  return ready;
}

export const pythonStatus = () => status;
export function onPythonStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Start downloading as soon as the learner shows intent (focus on the editor).
export function preloadPython() {
  if (!ready) start().catch(() => { /* The failure is shown through the status. */ });
}

// Resolves with { output, error, truncated, timeout }. Rejects only if Pyodide cannot load.
export async function runPython(code, onChunk = () => {}) {
  if (!ready) start();
  await ready;
  const id = ++runId;
  const current = worker;
  let output = '';
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      current.removeEventListener('message', onMessage);
      // Replace the stuck interpreter now, so the next run is quick.
      reset();
      start().catch(() => { /* Shown through the status. */ });
      resolve({ output, error: null, truncated: false, timeout: true });
    }, TIMEOUT_MS);
    function onMessage({ data }) {
      if (data.id !== id) return;
      if (data.type === 'chunk') { output += data.text; onChunk(output); return; }
      if (data.type !== 'done') return;
      clearTimeout(timer);
      current.removeEventListener('message', onMessage);
      resolve({ ...data, output: output + data.output });
    }
    current.addEventListener('message', onMessage);
    current.postMessage({
      type: 'run', id, code,
      inputMessage: t('这里还不能使用 input()。请直接给变量赋值，例如 score = 75。', 'input() is not available here. Assign a value directly instead, for example score = 75.')
    });
  });
}

// One short, beginner-friendly hint for the most common first errors.
export function errorHint(name) {
  const hints = {
    SyntaxError: t('检查冒号、括号和引号是否成对，if / for 那一行末尾要有冒号。', 'Check that brackets and quotes are paired, and that if / for lines end with a colon.'),
    IndentationError: t('Python 用缩进表示代码块：if、for 下面的行要统一缩进 4 个空格。', 'Python uses indentation for blocks: lines under if or for need the same indent, usually 4 spaces.'),
    TabError: t('同一个代码块里混用了 Tab 和空格。统一使用 4 个空格。', 'Tabs and spaces are mixed in one block. Use 4 spaces throughout.'),
    NameError: t('这个名字还没有被赋值，或者拼写、大小写不一致。文字要放在引号里。', 'This name has not been assigned yet, or its spelling or case differs. Text needs quotes.'),
    TypeError: t('把不同类型的值放在一起运算了，例如 "分数" + 5。可以用 str() 或 int() 转换。', 'Values of different types were combined, such as "score" + 5. Convert with str() or int().'),
    ZeroDivisionError: t('除数不能是 0。', 'You cannot divide by zero.'),
    ValueError: t('值的类型对了，但内容不合适，例如 int("abc")。', 'The type is right but the value is not, for example int("abc").')
  };
  return hints[name] || '';
}
