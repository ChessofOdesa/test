import type { AnalysisRecord } from './model';
export const GAME_FIELDS = [
  ['White', 'Білі'], ['Black', 'Чорні'], ['WhiteElo', 'Рейтинг білих'], ['BlackElo', 'Рейтинг чорних'],
  ['Event', 'Подія'], ['Site', 'Місце'], ['Date', 'Дата PGN'], ['Round', 'Тур'],
  ['TimeControl', 'Контроль часу'], ['Termination', 'Завершення'], ['Opening', 'Назва дебюту'], ['ECO', 'Код ECO'],
] as const;
export function editGameMetadata(record: AnalysisRecord, draft: Record<string, string>): AnalysisRecord {
  const headers = { ...record.headers };
  for (const [key] of GAME_FIELDS) {
    const value = (draft[key] || '').trim();
    if (value.length > 200 || /[\r\n]/.test(value)) throw new Error('Поле має містити один рядок до 200 символів.');
    if (value) headers[key] = value; else delete headers[key];
  }
  if (!['1-0', '0-1', '1/2-1/2', '*'].includes(draft.Result)) throw new Error('Оберіть результат партії.');
  headers.Result = draft.Result;
  for (const key of ['WhiteElo', 'BlackElo']) if (headers[key] && !/^(\?|\d{1,4})$/.test(headers[key])) throw new Error('Рейтинг: число до 9999 або ?.');
  if (headers.ECO && !/^[A-E]\d{2}$/.test(headers.ECO)) throw new Error('Код ECO має вигляд B20.');
  if (headers.Date) {
    if (!/^(\d{4}|\?{4})\.(\d{2}|\?{2})\.(\d{2}|\?{2})$/.test(headers.Date)) throw new Error('Дата: РРРР.ММ.ДД; невідомі частини можна замінити знаками ?.');
    const [y, m, d] = headers.Date.split('.');
    const year = Number(y), month = Number(m), day = Number(d);
    if (y !== '????' && year < 1 || m !== '??' && (month < 1 || month > 12) || d !== '??' && (day < 1 || day > 31)) throw new Error('Некоректна дата.');
    if (m !== '??' && d !== '??') {
      const leap = y === '????' || year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      if (day > [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]) throw new Error('Такої дати не існує.');
    }
  }
  return { ...record, headers };
}
