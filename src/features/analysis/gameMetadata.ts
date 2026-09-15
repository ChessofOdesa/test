import type { AnalysisRecord } from './model';
export const GAME_FIELDS = [
  ['White', 'Білі'], ['Black', 'Чорні'], ['WhiteElo', 'Рейтинг білих'], ['BlackElo', 'Рейтинг чорних'],
  ['Event', 'Подія'], ['Site', 'Місце'], ['Date', 'Дата PGN'], ['Round', 'Тур'],
  ['TimeControl', 'Контроль часу'], ['Termination', 'Завершення'], ['Opening', 'Назва дебюту'], ['ECO', 'Код ECO'],
] as const;

export class GameMetadataError extends Error {
  constructor(public field: string, message: string) { super(message); this.name = 'GameMetadataError'; }
}

function normalizeDate(value: string) {
  if (value === '?') return '????.??.??';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replace(/-/g, '.');
  const local = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  return local ? `${local[3]}.${local[2]}.${local[1]}` : value;
}

function validateDate(value: string) {
  const fail = (message: string): never => { throw new GameMetadataError('Date', message); };
  if (!/^(\d{4}|\?{4})\.(\d{2}|\?{2})\.(\d{2}|\?{2})$/.test(value)) fail('Дата: РРРР.ММ.ДД або ДД.ММ.РРРР; невідомі частини можна замінити знаками ?.');
  const [y, m, d] = value.split('.');
  const year = Number(y), month = Number(m), day = Number(d);
  if (y !== '????' && year < 1 || m !== '??' && (month < 1 || month > 12) || d !== '??' && (day < 1 || day > 31)) fail('Некоректна дата.');
  if (m !== '??' && d !== '??') {
    const leap = y === '????' || year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    if (day > [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]) fail('Такої дати не існує.');
  }
}

export function editGameMetadata(record: AnalysisRecord, draft: Record<string, string>): AnalysisRecord {
  const headers = { ...record.headers };
  for (const [key, label] of GAME_FIELDS) {
    // Imported PGNs may use legacy placeholders. Preserve untouched fields verbatim.
    if (!Object.prototype.hasOwnProperty.call(draft, key) || draft[key] === (record.headers[key] || '')) continue;
    let value = draft[key].trim();
    const fail = (message: string): never => { throw new GameMetadataError(key, `${label}: ${message}`); };
    if (value.length > 200 || /[\r\n]/.test(value)) fail('один рядок до 200 символів.');
    if (value && ['WhiteElo', 'BlackElo'].includes(key) && !/^(\?|\d{1,4})$/.test(value)) fail('число до 9999 або ?.');
    if (key === 'ECO') {
      value = value.toUpperCase();
      if (value && !/^(\?|[A-E]\d{2})$/.test(value)) fail('код має вигляд B20; якщо невідомий, залиште порожнім або введіть ?.');
    }
    if (key === 'Date' && value) { value = normalizeDate(value); validateDate(value); }
    if (value) headers[key] = value; else delete headers[key];
  }
  if (draft.Result !== undefined && draft.Result !== record.headers.Result) {
    if (!['1-0', '0-1', '1/2-1/2', '*'].includes(draft.Result)) throw new GameMetadataError('Result', 'Оберіть результат партії.');
    headers.Result = draft.Result;
  }
  return { ...record, headers };
}
