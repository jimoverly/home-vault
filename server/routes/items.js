/**
 * Items API routes (all require authentication)
 * GET    /api/items         — List all items for current user
 * POST   /api/items         — Create item
 * PUT    /api/items/:id     — Update item
 * DELETE /api/items/:id     — Delete item
 * GET    /api/items/export  — Export all items as JSON
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Prepared statements
const listItems = db.prepare('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC');
const getItem = db.prepare('SELECT * FROM items WHERE id = ? AND user_id = ?');
const insertItem = db.prepare(`
  INSERT INTO items (id, user_id, name, category, description, location, purchase_date,
    purchase_price, current_value, serial_number, make, model, condition, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateItem = db.prepare(`
  UPDATE items SET name=?, category=?, description=?, location=?, purchase_date=?,
    purchase_price=?, current_value=?, serial_number=?, make=?, model=?, condition=?,
    notes=?, updated_at=datetime('now')
  WHERE id=? AND user_id=?
`);
const deleteItem = db.prepare('DELETE FROM items WHERE id = ? AND user_id = ?');
const unlinkDocs = db.prepare('UPDATE documents SET linked_item_id = NULL WHERE linked_item_id = ? AND user_id = ?');

// ─── LIST ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const items = listItems.all(req.user.id);
  res.json(items);
});

// ─── EXPORT ────────────────────────────────────────────────────
router.get('/export', (req, res) => {
  const items = listItems.all(req.user.id);
  const docs = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ items, documents: docs, exportedAt: new Date().toISOString() });
});

// ─── CREATE ────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { name, category, description, location, purchaseDate, purchasePrice,
    currentValue, serialNumber, make, model, condition, notes } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Item name is required.' });
  }

  const id = uuidv4();
  insertItem.run(id, req.user.id, name.trim(), category || 'other', description || null,
    location || null, purchaseDate || null, purchasePrice || null, currentValue || null,
    serialNumber || null, make || null, model || null, condition || 'good', notes || null);

  const item = getItem.get(id, req.user.id);
  res.status(201).json(item);
});

// ─── UPDATE ────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const existing = getItem.get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Item not found.' });

  const { name, category, description, location, purchaseDate, purchasePrice,
    currentValue, serialNumber, make, model, condition, notes } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Item name is required.' });
  }

  updateItem.run(name.trim(), category || 'other', description || null, location || null,
    purchaseDate || null, purchasePrice || null, currentValue || null, serialNumber || null,
    make || null, model || null, condition || 'good', notes || null,
    req.params.id, req.user.id);

  const item = getItem.get(req.params.id, req.user.id);
  res.json(item);
});

// ─── DELETE ────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const existing = getItem.get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Item not found.' });

  unlinkDocs.run(req.params.id, req.user.id);
  deleteItem.run(req.params.id, req.user.id);

  res.json({ message: 'Item deleted.' });
});

module.exports = router;
