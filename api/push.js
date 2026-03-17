const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const output = execSync('node build.js --push', { cwd: ROOT, encoding: 'utf-8', timeout: 30000 });
    res.json({ ok: true, output });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, output: err.stdout || '' });
  }
};
