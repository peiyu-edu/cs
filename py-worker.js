// Runs learner code with Pyodide off the main thread, so a long loop never freezes the page.
// Pyodide is loaded from a pinned CDN version; the second mirror is tried if the first fails.
const PYODIDE_VERSION = '0.26.4';
const MIRRORS = [
  `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
  `https://unpkg.com/pyodide@${PYODIDE_VERSION}/`
];
const MAX_OUTPUT = 20000;

const RUNNER = `
import builtins, linecache, sys, traceback

def __peiyu_no_input(prompt=""):
    raise RuntimeError(__peiyu_input_message)

def __peiyu_run(source):
    builtins.input = __peiyu_no_input
    namespace = {"__name__": "__main__"}
    # Let tracebacks quote the learner's own lines.
    linecache.cache["main.py"] = (len(source), None, source.splitlines(True), "main.py")
    try:
        exec(compile(source, "main.py", "exec"), namespace)
    except SystemExit:
        pass
    except BaseException as error:
        # Keep Python's own message (including "Did you mean ...?"),
        # but show only frames from the learner's program, not this runner.
        report = traceback.TracebackException.from_exception(error)
        report.stack = traceback.StackSummary.from_list(
            [frame for frame in report.stack if frame.filename == "main.py"])
        return [type(error).__name__, "".join(report.format())]
    finally:
        sys.stdout.flush()
        sys.stderr.flush()
    return None
`;

let pyodide = null;
let output = '';      // text not yet sent to the page
let written = 0;      // total characters this run
let truncated = false;
let currentId = 0;
let lastFlush = 0;

function flush() {
  if (!output) return;
  self.postMessage({ type: 'chunk', id: currentId, text: output });
  output = '';
  lastFlush = Date.now();
}

function write(text) {
  if (truncated) return;
  if (written + text.length > MAX_OUTPUT) {
    output += text.slice(0, MAX_OUTPUT - written);
    written = MAX_OUTPUT;
    truncated = true;
  } else {
    output += text;
    written += text.length;
  }
  // Stream output during long runs, so a stopped loop still shows what it printed.
  if (Date.now() - lastFlush > 120) flush();
}

async function load() {
  let lastError;
  for (const indexURL of MIRRORS) {
    try {
      importScripts(`${indexURL}pyodide.js`);
      const instance = await self.loadPyodide({ indexURL });
      // Raw writes keep partial lines, such as print("a", end="").
      const decoder = new TextDecoder();
      const sink = { write: buffer => { write(decoder.decode(buffer, { stream: true })); return buffer.length; } };
      instance.setStdout(sink);
      instance.setStderr(sink);
      instance.runPython(RUNNER);
      return instance;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Pyodide could not be loaded');
}

self.onmessage = async ({ data }) => {
  if (data.type === 'load') {
    try {
      pyodide = pyodide || await load();
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'load-error', message: String(error?.message || error) });
    }
    return;
  }
  if (data.type === 'run') {
    output = '';
    written = 0;
    truncated = false;
    currentId = data.id;
    lastFlush = Date.now();
    try {
      pyodide.globals.set('__peiyu_input_message', data.inputMessage);
      const result = pyodide.globals.get('__peiyu_run')(data.code);
      const error = result ? result.toJs() : null;
      result?.destroy?.();
      self.postMessage({ type: 'done', id: data.id, output, truncated, error: error ? { name: error[0], text: error[1] } : null });
    } catch (error) {
      self.postMessage({ type: 'done', id: data.id, output, truncated, error: { name: 'Error', text: String(error?.message || error) } });
    }
  }
};
