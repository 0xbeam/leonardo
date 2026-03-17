const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', timeout: 15000 }).trim();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const status = run('git status --porcelain');
      const branch = run('git rev-parse --abbrev-ref HEAD');
      const log = run('git log --oneline -5');
      return res.json({ branch, status: status || 'clean', log });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { action } = req.body || {};
    try {
      if (action === 'pull') {
        const output = run('git pull');
        return res.json({ ok: true, output });
      }
      return res.status(400).json({ error: 'Unknown action. Use { action: "pull" }' });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
