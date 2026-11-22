// Кольцевой журнал приложения: последние строки держим в памяти, чтобы при
// проблеме (или по кнопке в настройках) отправить их в Firestore вместе с
// данными об устройстве. Сюда пишут breadcrumb() из diagnostics.ts и всё,
// что уходит в console.warn/console.error (их перехватываем один раз).

const MAX_LINES = 400;
const lines: string[] = [];
let captured = false;

function stamp(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(
    d.getMilliseconds(),
    3,
  )}`;
}

export function appendLog(line: string): void {
  lines.push(`${stamp()} ${line}`.slice(0, 600));
  if (lines.length > MAX_LINES) {
    lines.splice(0, lines.length - MAX_LINES);
  }
}

export function getLogLines(): string[] {
  return lines.slice();
}

function fmt(args: unknown[]): string {
  return args
    .map(a => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return `${a.name}: ${a.message}`;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ');
}

/** Один раз на старте: console.warn/error дублируются в журнал. */
export function captureConsole(): void {
  if (captured) return;
  captured = true;
  const warn = console.warn.bind(console);
  const error = console.error.bind(console);
  console.warn = (...args: unknown[]) => {
    appendLog('WARN ' + fmt(args));
    warn(...args);
  };
  console.error = (...args: unknown[]) => {
    appendLog('ERROR ' + fmt(args));
    error(...args);
  };
}
