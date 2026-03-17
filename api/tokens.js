const fs = require('fs');
const path = require('path');

const TOKENS_DIR = path.join(__dirname, '..', 'tokens');

const TOKEN_FILES = ['color.json', 'typography.json', 'motion.json', 'spacing.json'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const tokens = {};
    for (const file of TOKEN_FILES) {
      const key = file.replace('.json', '');
      tokens[key] = JSON.parse(fs.readFileSync(path.join(TOKENS_DIR, file), 'utf-8'));
    }
    return res.json(tokens);
  }

  if (req.method === 'POST') {
    const { file, data } = req.body;
    if (!file || !data) return res.status(400).json({ error: 'Missing file or data' });
    if (!TOKEN_FILES.includes(file)) return res.status(400).json({ error: 'Invalid token file' });

    fs.writeFileSync(path.join(TOKENS_DIR, file), JSON.stringify(data, null, 2), 'utf-8');
    return res.json({ ok: true, file });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
