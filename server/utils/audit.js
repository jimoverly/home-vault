/**
 * Audit logger — records security-relevant events
 */
const db = require('../db');

const insert = db.prepare(`
  INSERT INTO audit_log (user_id, action, details, ip_address)
  VALUES (?, ?, ?, ?)
`);

function logAudit(userId, action, details, ip) {
  try {
    insert.run(userId, action, details || null, ip || null);
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

module.exports = { logAudit };
