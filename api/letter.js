const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1fTTbeqIMFohHycCCozdFVuo2eehapvG5B60Kv7vkorM/export?format=csv&gid=0';

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (quoted) {
      if (char === '"' && csv[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (char !== '\r') cell += char;
  }
  if (quoted) throw new Error('Invalid CSV');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const normalizeName = value => String(value || '').normalize('NFC').replace(/\s+/g, '').trim();

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, code } = req.body || {};
  if (typeof name !== 'string' || typeof code !== 'string' ||
      normalizeName(name).length < 2 || normalizeName(name).length > 4 || !/^\d{4}$/.test(code)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const response = await fetch(SHEET_CSV_URL, { signal: AbortSignal.timeout(3000), cache: 'no-store' });
    if (!response.ok || !(response.headers.get('content-type') || '').includes('text/csv')) {
      throw new Error('Sheet unavailable');
    }
    const csv = await response.text();
    if (csv.length > 2_000_000) throw new Error('Sheet too large');
    const [headers, ...rows] = parseCsv(csv.replace(/^\uFEFF/, ''));
    const columns = ['이름', '전화번호 4자리', '편지 내용', '글쓴이'].map(label => headers?.findIndex(value => value.trim() === label));
    if (columns.some(index => index < 0)) throw new Error('Sheet columns changed');
    const [nameColumn, codeColumn, bodyColumn, authorColumn] = columns;
    const match = rows.find(row => normalizeName(row[nameColumn]) === normalizeName(name) &&
      String(row[codeColumn] || '').trim() === code && String(row[bodyColumn] || '').trim());
    if (!match) return res.status(404).json({ found: false });
    return res.status(200).json({
      found: true,
      body: match[bodyColumn].trim(),
      author: String(match[authorColumn] || '남일 & 주희').trim()
    });
  } catch (error) {
    console.error('[letter] Sheet lookup failed:', error.message);
    return res.status(503).json({ error: 'Letter service unavailable' });
  }
};
