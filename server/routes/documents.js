/**
 * Documents API routes (all require authentication)
 * GET    /api/documents       — List all documents for current user
 * POST   /api/documents       — Create document
 * PUT    /api/documents/:id   — Update document
 * DELETE /api/documents/:id   — Delete document
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const listDocs = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC');
const getDoc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?');
const insertDoc = db.prepare(`
  INSERT INTO documents (id, user_id, name, type, description, issue_date, expiry_date,
    issued_by, policy_number, linked_item_id, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateDoc = db.prepare(`
  UPDATE documents SET name=?, type=?, description=?, issue_date=?, expiry_date=?,
    issued_by=?, policy_number=?, linked_item_id=?, notes=?, updated_at=datetime('now')
  WHERE id=? AND user_id=?
`);
const deleteDoc = db.prepare('DELETE FROM documents WHERE id = ? AND user_id = ?');

// ─── LIST ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const docs = listDocs.all(req.user.id);
  res.json(docs);
});

// ─── CREATE ────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { name, type, description, issueDate, expiryDate,
    issuedBy, policyNumber, linkedItemId, notes } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Document name is required.' });
  }

  // Validate linked item belongs to user
  if (linkedItemId) {
    const item = db.prepare('SELECT id FROM items WHERE id = ? AND user_id = ?').get(linkedItemId, req.user.id);
    if (!item) {
      return res.status(400).json({ error: 'Linked item not found.' });
    }
  }

  const id = uuidv4();
  insertDoc.run(id, req.user.id, name.trim(), type || 'other_doc', description || null,
    issueDate || null, expiryDate || null, issuedBy || null, policyNumber || null,
    linkedItemId || null, notes || null);

  const doc = getDoc.get(id, req.user.id);
  res.status(201).json(doc);
});

// ─── UPDATE ────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const existing = getDoc.get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Document not found.' });

  const { name, type, description, issueDate, expiryDate,
    issuedBy, policyNumber, linkedItemId, notes } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Document name is required.' });
  }

  if (linkedItemId) {
    const item = db.prepare('SELECT id FROM items WHERE id = ? AND user_id = ?').get(linkedItemId, req.user.id);
    if (!item) {
      return res.status(400).json({ error: 'Linked item not found.' });
    }
  }

  updateDoc.run(name.trim(), type || 'other_doc', description || null,
    issueDate || null, expiryDate || null, issuedBy || null, policyNumber || null,
    linkedItemId || null, notes || null,
    req.params.id, req.user.id);

  const doc = getDoc.get(req.params.id, req.user.id);
  res.json(doc);
});

// ─── DELETE ────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const existing = getDoc.get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Document not found.' });

  deleteDoc.run(req.params.id, req.user.id);
  res.json({ message: 'Document deleted.' });
});

module.exports = router;
