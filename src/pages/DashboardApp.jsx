import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { CATEGORIES, DOC_TYPES, formatCurrency, formatDate, getPasswordStrength } from '../utils/constants';

const inputStyle = {
  width: '100%', padding: '10px 14px', background: '#151310', border: '1px solid #2A2520',
  borderRadius: 8, color: '#E0D6C8', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
};
const selectStyle = { ...inputStyle, appearance: 'none', cursor: 'pointer' };
const btnPrimary = {
  padding: '10px 24px', background: '#D4A574', color: '#0F0C08', border: 'none',
  borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
};
const btnSecondary = { ...btnPrimary, background: 'transparent', color: '#A89A88', border: '1px solid #2A2520' };

function Modal({ isOpen, onClose, title, children, width }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,12,8,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1E1B16', border: '1px solid #3A342A', borderRadius: 16, width: width || 'min(580px, 92vw)', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2A2520', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#1E1B16', zIndex: 2, borderRadius: '16px 16px 0 0' }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, color: '#E8DDD0', fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8A7E6E', fontSize: 24, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#A89A88', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Sans', sans-serif" }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#6A6055', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function ExpiryBadge({ expiryDate }) {
  if (!expiryDate) return null;
  const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
  if (daysLeft < 0) return <span style={{ background: '#5B2020', color: '#E88', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>EXPIRED</span>;
  if (daysLeft <= 30) return <span style={{ background: '#5B4A20', color: '#E8C888', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Expires in {daysLeft}d</span>;
  if (daysLeft <= 90) return <span style={{ background: '#2A3520', color: '#A8C888', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Exp. {daysLeft}d</span>;
  return null;
}

function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,12,8,0.8)', backdropFilter: 'blur(6px)' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1E1B16', border: '1px solid #3A342A', borderRadius: 12, padding: 28, width: 'min(400px, 90vw)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: '#E8DDD0', fontFamily: "'Playfair Display', Georgia, serif", margin: '0 0 8px' }}>{title}</h3>
        <p style={{ color: '#8A7E6E', fontSize: 14, margin: '0 0 20px' }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button style={btnSecondary} onClick={onCancel}>Cancel</button>
          <button style={{ ...btnPrimary, background: '#A05050' }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || {
    name: '', category: 'valuables', description: '', location: '',
    purchaseDate: '', purchasePrice: '', currentValue: '', serialNumber: '',
    make: '', model: '', condition: 'good', notes: '',
  });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Item Name *"><input style={inputStyle} value={form.name} onChange={e => update('name', e.target.value)} placeholder='e.g. Samsung 65" TV' /></FormField>
        <FormField label="Category">
          <select style={selectStyle} value={form.category} onChange={e => update('category', e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Description"><textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Brief description" /></FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Location in Home"><input style={inputStyle} value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Living Room" /></FormField>
        <FormField label="Condition">
          <select style={selectStyle} value={form.condition} onChange={e => update('condition', e.target.value)}>
            {['new','excellent','good','fair','poor'].map(c => <option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}
          </select>
        </FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Make / Brand"><input style={inputStyle} value={form.make} onChange={e => update('make', e.target.value)} placeholder="e.g. Samsung" /></FormField>
        <FormField label="Model"><input style={inputStyle} value={form.model} onChange={e => update('model', e.target.value)} placeholder="e.g. QN65Q80C" /></FormField>
      </div>
      <FormField label="Serial Number" hint="Important for insurance claims"><input style={inputStyle} value={form.serialNumber} onChange={e => update('serialNumber', e.target.value)} placeholder="e.g. SN-123456789" /></FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <FormField label="Purchase Date"><input style={inputStyle} type="date" value={form.purchaseDate} onChange={e => update('purchaseDate', e.target.value)} /></FormField>
        <FormField label="Purchase Price"><input style={inputStyle} type="number" value={form.purchasePrice} onChange={e => update('purchasePrice', e.target.value)} placeholder="$0" /></FormField>
        <FormField label="Current Value"><input style={inputStyle} type="number" value={form.currentValue} onChange={e => update('currentValue', e.target.value)} placeholder="$0" /></FormField>
      </div>
      <FormField label="Notes"><textarea style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Additional notes..." /></FormField>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={btnSecondary} onClick={onCancel}>Cancel</button>
        <button style={{ ...btnPrimary, opacity: form.name ? 1 : 0.4 }} onClick={() => form.name && onSave(form)} disabled={!form.name}>{item ? 'Update Item' : 'Add Item'}</button>
      </div>
    </div>
  );
}

function DocForm({ doc, onSave, onCancel, items }) {
  const [form, setForm] = useState(doc || {
    name: '', type: 'insurance', description: '', issueDate: '',
    expiryDate: '', issuedBy: '', policyNumber: '', linkedItemId: '', notes: '',
  });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Document Name *"><input style={inputStyle} value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Homeowner's Insurance" /></FormField>
        <FormField label="Document Type">
          <select style={selectStyle} value={form.type} onChange={e => update('type', e.target.value)}>
            {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Description"><textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Brief description" /></FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Issued By"><input style={inputStyle} value={form.issuedBy} onChange={e => update('issuedBy', e.target.value)} placeholder="e.g. State Farm" /></FormField>
        <FormField label="Policy / Reference #"><input style={inputStyle} value={form.policyNumber} onChange={e => update('policyNumber', e.target.value)} placeholder="e.g. POL-12345" /></FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Issue Date"><input style={inputStyle} type="date" value={form.issueDate} onChange={e => update('issueDate', e.target.value)} /></FormField>
        <FormField label="Expiry Date"><input style={inputStyle} type="date" value={form.expiryDate} onChange={e => update('expiryDate', e.target.value)} /></FormField>
      </div>
      <FormField label="Link to Inventory Item">
        <select style={selectStyle} value={form.linkedItemId} onChange={e => update('linkedItemId', e.target.value)}>
          <option value="">— None —</option>
          {items.map(i => <option key={i.id} value={i.id}>{CATEGORIES[i.category]?.icon} {i.name}</option>)}
        </select>
      </FormField>
      <FormField label="Notes"><textarea style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Storage location, access instructions..." /></FormField>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={btnSecondary} onClick={onCancel}>Cancel</button>
        <button style={{ ...btnPrimary, opacity: form.name ? 1 : 0.4 }} onClick={() => form.name && onSave(form)} disabled={!form.name}>{doc ? 'Update' : 'Add Document'}</button>
      </div>
    </div>
  );
}

function ItemDetail({ item, documents, onEdit, onDelete }) {
  const linkedDocs = documents.filter(d => d.linked_item_id === item.id);
  const cat = CATEGORIES[item.category] || CATEGORIES.other;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{cat.icon}</div>
        <div>
          <div style={{ fontSize: 11, color: cat.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{cat.label}</div>
          <div style={{ fontSize: 10, color: '#6A6055', marginTop: 2, textTransform: 'capitalize' }}>{item.condition} condition{item.location ? ` · ${item.location}` : ''}</div>
        </div>
      </div>
      {item.description && <p style={{ color: '#A89A88', fontSize: 14, margin: '0 0 16px', lineHeight: 1.5 }}>{item.description}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[['Make / Brand', item.make], ['Model', item.model], ['Serial #', item.serial_number], ['Purchase Date', formatDate(item.purchase_date)], ['Purchase Price', formatCurrency(item.purchase_price)], ['Current Value', formatCurrency(item.current_value)]].map(([l, v]) => v && v !== '—' ? (
          <div key={l} style={{ background: '#151310', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: '#6A6055', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{l}</div>
            <div style={{ color: '#D4CABC', fontSize: 14 }}>{v}</div>
          </div>
        ) : null)}
      </div>
      {item.notes && <div style={{ background: '#151310', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}><div style={{ fontSize: 10, color: '#6A6055', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Notes</div><div style={{ color: '#A89A88', fontSize: 13, lineHeight: 1.5 }}>{item.notes}</div></div>}
      {linkedDocs.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#6A6055', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Linked Documents ({linkedDocs.length})</div>
          {linkedDocs.map(d => { const dt = DOC_TYPES[d.type] || DOC_TYPES.other_doc; return (
            <div key={d.id} style={{ background: '#151310', borderRadius: 8, padding: '10px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{dt.icon}</span>
              <div style={{ flex: 1 }}><div style={{ color: '#D4CABC', fontSize: 13 }}>{d.name}</div><div style={{ color: '#6A6055', fontSize: 11 }}>{dt.label}{d.policy_number ? ` · ${d.policy_number}` : ''}</div></div>
              <ExpiryBadge expiryDate={d.expiry_date} />
            </div>
          ); })}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button style={btnSecondary} onClick={onDelete}>Delete</button>
        <button style={btnPrimary} onClick={onEdit}>Edit Item</button>
      </div>
    </div>
  );
}

function AccountSettings({ user, onLogout, onClose }) {
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  const changePassword = async () => {
    setPwMsg({ type: '', text: '' });
    if (!oldPw) return setPwMsg({ type: 'error', text: 'Enter your current password.' });
    if (newPw.length < 8) return setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
    if (newPw !== confirmPw) return setPwMsg({ type: 'error', text: 'Passwords do not match.' });
    const strength = getPasswordStrength(newPw);
    if (strength.pct < 40) return setPwMsg({ type: 'error', text: 'New password is too weak.' });
    try {
      await api.changePassword({ currentPassword: oldPw, newPassword: newPw });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setOldPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setChangePwOpen(false), 1500);
    } catch (err) {
      setPwMsg({ type: 'error', text: err.data?.error || 'Failed to change password.' });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #D4A574, #A87B4F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#0F0C08', fontFamily: "'Playfair Display', Georgia, serif" }}>
          {user.displayName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#E8DDD0', fontFamily: "'Playfair Display', Georgia, serif" }}>{user.displayName}</div>
          <div style={{ fontSize: 13, color: '#6A6055' }}>@{user.username}</div>
          <div style={{ fontSize: 11, color: '#3A342A', marginTop: 2 }}>Member since {formatDate(user.createdAt)}</div>
        </div>
      </div>

      <div style={{ background: '#151310', border: '1px solid #2A2520', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#A89A88', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🔒 Security Status</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ background: '#1A3A1A', color: '#70C888', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>✓ BCRYPT</span>
          <span style={{ color: '#A89A88', fontSize: 13 }}>Password Hashing (salted)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ background: '#1A3A1A', color: '#70C888', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>✓ HTTPONLY</span>
          <span style={{ color: '#A89A88', fontSize: 13 }}>Secure Session Cookies</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: '#1A3A1A', color: '#70C888', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>✓ LOCKED</span>
          <span style={{ color: '#A89A88', fontSize: 13 }}>Auto-lockout after 5 failed attempts</span>
        </div>
      </div>

      <div style={{ background: '#151310', border: '1px solid #2A2520', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <button onClick={() => setChangePwOpen(!changePwOpen)} style={{ background: 'none', border: 'none', color: '#A89A88', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0, width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🔑 Change Password</span>
          <span style={{ color: '#6A6055', transition: 'transform 0.2s', transform: changePwOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
        </button>
        {changePwOpen && (
          <div style={{ marginTop: 16 }}>
            {pwMsg.text && <div style={{ background: pwMsg.type === 'error' ? '#3A1818' : '#183A18', border: `1px solid ${pwMsg.type === 'error' ? '#5B2020' : '#205B20'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, color: pwMsg.type === 'error' ? '#E88' : '#8E8', fontSize: 12 }}>{pwMsg.text}</div>}
            <FormField label="Current Password"><input style={inputStyle} type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} /></FormField>
            <FormField label="New Password">
              <input style={inputStyle} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
              {newPw && (() => { const s = getPasswordStrength(newPw); return (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 3, borderRadius: 2, background: '#2A2520' }}><div style={{ height: '100%', borderRadius: 2, background: s.color, width: `${s.pct}%`, transition: 'all 0.3s' }} /></div>
                  <div style={{ fontSize: 11, color: s.color, marginTop: 3, fontWeight: 600 }}>{s.label}</div>
                </div>
              ); })()}
            </FormField>
            <FormField label="Confirm New Password"><input style={inputStyle} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></FormField>
            <button style={{ ...btnPrimary, fontSize: 13, padding: '8px 18px' }} onClick={changePassword}>Update Password</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
        <button style={btnSecondary} onClick={onClose}>Close</button>
        <button style={{ ...btnPrimary, background: '#A05050', fontSize: 13, padding: '8px 18px' }} onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{ background: '#1A1714', border: '1px solid #2A2520', borderRadius: 12, padding: '18px 20px', flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 11, color: '#6A6055', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{icon} {label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || '#E8DDD0', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6A6055', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────
export default function DashboardApp({ user, onLogout, onUserUpdate }) {
  const [items, setItems] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterDocType, setFilterDocType] = useState('all');
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [itemList, docList] = await Promise.all([api.listItems(), api.listDocs()]);
      setItems(itemList);
      setDocuments(docList);
    } catch (err) { console.error('Load error:', err); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // CRUD handlers
  const saveItem = async (form) => {
    try {
      const body = {
        name: form.name, category: form.category, description: form.description,
        location: form.location, purchaseDate: form.purchaseDate || form.purchase_date,
        purchasePrice: form.purchasePrice || form.purchase_price,
        currentValue: form.currentValue || form.current_value,
        serialNumber: form.serialNumber || form.serial_number,
        make: form.make, model: form.model, condition: form.condition, notes: form.notes,
      };
      if (form.id) { await api.updateItem(form.id, body); }
      else { await api.createItem(body); }
      await refresh();
      setModalState({ type: null });
      setDetailItem(null);
    } catch (err) { alert(err.data?.error || err.message); }
  };

  const deleteItem = async (id) => {
    try { await api.deleteItem(id); await refresh(); setDeleteTarget(null); setDetailItem(null); }
    catch (err) { alert(err.data?.error || err.message); }
  };

  const saveDoc = async (form) => {
    try {
      const body = {
        name: form.name, type: form.type, description: form.description,
        issueDate: form.issueDate || form.issue_date, expiryDate: form.expiryDate || form.expiry_date,
        issuedBy: form.issuedBy || form.issued_by, policyNumber: form.policyNumber || form.policy_number,
        linkedItemId: form.linkedItemId || form.linked_item_id, notes: form.notes,
      };
      if (form.id) { await api.updateDoc(form.id, body); }
      else { await api.createDoc(body); }
      await refresh();
      setModalState({ type: null });
    } catch (err) { alert(err.data?.error || err.message); }
  };

  const deleteDoc = async (id) => {
    try { await api.deleteDoc(id); await refresh(); setDeleteTarget(null); }
    catch (err) { alert(err.data?.error || err.message); }
  };

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `home-vault-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) { alert('Export failed: ' + err.message); }
  };

  // Filters
  const filteredItems = items.filter(i => {
    if (filterCat !== 'all' && i.category !== filterCat) return false;
    if (search && !`${i.name} ${i.make} ${i.model} ${i.description} ${i.location} ${i.serial_number}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const filteredDocs = documents.filter(d => {
    if (filterDocType !== 'all' && d.type !== filterDocType) return false;
    if (search && !`${d.name} ${d.description} ${d.issued_by} ${d.policy_number}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalValue = items.reduce((s, i) => s + (i.current_value || i.purchase_price || 0), 0);
  const totalPurchase = items.reduce((s, i) => s + (i.purchase_price || 0), 0);
  const expiringDocs = documents.filter(d => { if (!d.expiry_date) return false; const days = Math.ceil((new Date(d.expiry_date) - new Date()) / 86400000); return days >= 0 && days <= 90; });
  const expiredDocs = documents.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date());

  if (loading) return <div style={{ minHeight: '100vh', background: '#0F0C08', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#D4A574', fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22 }}>Loading vault...</div></div>;

  const navBtn = (v, label, icon) => (
    <button onClick={() => { setView(v); setSearch(''); setFilterCat('all'); setFilterDocType('all'); }} style={{
      background: view === v ? '#D4A57418' : 'transparent', border: view === v ? '1px solid #D4A57444' : '1px solid transparent',
      color: view === v ? '#D4A574' : '#6A6055', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6,
    }}><span style={{ fontSize: 15 }}>{icon}</span> {label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0F0C08', color: '#D4CABC', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1A1714', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'linear-gradient(180deg, #151210 0%, #0F0C08 100%)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #D4A574, #A87B4F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🏠</div>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: '#E8DDD0' }}>Home Vault</h1>
            <div style={{ fontSize: 10, color: '#3A342A' }}>🔒 {user.displayName}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {navBtn('dashboard', 'Dashboard', '📊')}
          {navBtn('items', 'Items', '📦')}
          {navBtn('documents', 'Documents', '📄')}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} style={{ ...btnSecondary, padding: '6px 12px', fontSize: 12 }}>⬇ Export</button>
          <button onClick={() => setModalState({ type: 'addItem' })} style={{ ...btnPrimary, padding: '6px 12px', fontSize: 12 }}>+ Item</button>
          <button onClick={() => setModalState({ type: 'addDoc' })} style={{ ...btnPrimary, padding: '6px 12px', fontSize: 12, background: '#5B8A72' }}>+ Doc</button>
          <button onClick={() => setModalState({ type: 'account' })} style={{ width: 34, height: 34, borderRadius: 8, background: '#D4A57422', border: '1px solid #D4A57444', color: '#D4A574', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {user.displayName?.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        {/* Dashboard */}
        {view === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
              <StatCard icon="📦" label="Total Items" value={items.length} sub={`Across ${new Set(items.map(i => i.category)).size} categories`} accent="#D4A574" />
              <StatCard icon="💰" label="Est. Total Value" value={formatCurrency(totalValue)} sub={totalPurchase ? `${formatCurrency(totalPurchase)} invested` : null} accent="#8BA893" />
              <StatCard icon="📄" label="Documents" value={documents.length} sub={`${documents.filter(d => d.linked_item_id).length} linked to items`} accent="#7B9EA8" />
              <StatCard icon="⚠️" label="Alerts" value={expiredDocs.length + expiringDocs.length} sub={`${expiredDocs.length} expired · ${expiringDocs.length} expiring`} accent={expiredDocs.length > 0 ? '#C87070' : '#8BA893'} />
            </div>
            {(expiredDocs.length > 0 || expiringDocs.length > 0) && (
              <div style={{ background: '#1A1714', border: '1px solid #2A2520', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 14px', fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, color: '#E8DDD0' }}>🔔 Attention Needed</h3>
                {[...expiredDocs, ...expiringDocs].map(d => { const dt = DOC_TYPES[d.type] || DOC_TYPES.other_doc; return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1E1B16' }}>
                    <span style={{ fontSize: 20 }}>{dt.icon}</span>
                    <div style={{ flex: 1 }}><div style={{ color: '#D4CABC', fontSize: 14 }}>{d.name}</div><div style={{ color: '#6A6055', fontSize: 12 }}>{d.issued_by}{d.policy_number ? ` · ${d.policy_number}` : ''}</div></div>
                    <ExpiryBadge expiryDate={d.expiry_date} />
                  </div>
                ); })}
              </div>
            )}
            {items.length === 0 && documents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#E8DDD0', margin: '0 0 8px' }}>Welcome, {user.displayName}!</h2>
                <p style={{ color: '#6A6055', fontSize: 14, maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.6 }}>Start tracking your valuable items, insurance policies, and important documents.</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => setModalState({ type: 'addItem' })} style={btnPrimary}>+ Add Your First Item</button>
                  <button onClick={() => setModalState({ type: 'addDoc' })} style={{ ...btnPrimary, background: '#5B8A72' }}>+ Add a Document</button>
                </div>
              </div>
            )}
            {items.length > 0 && (
              <div style={{ background: '#1A1714', border: '1px solid #2A2520', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, color: '#E8DDD0' }}>Recently Added</h3>
                  <button onClick={() => setView('items')} style={{ background: 'none', border: 'none', color: '#D4A574', fontSize: 13, cursor: 'pointer' }}>View all →</button>
                </div>
                {items.slice(0, 5).map(item => { const cat = CATEGORIES[item.category] || CATEGORIES.other; return (
                  <div key={item.id} onClick={() => setDetailItem(item)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1E1B16', cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{cat.icon}</div>
                    <div style={{ flex: 1 }}><div style={{ color: '#D4CABC', fontSize: 14 }}>{item.name}</div><div style={{ color: '#6A6055', fontSize: 12 }}>{cat.label}{item.location ? ` · ${item.location}` : ''}</div></div>
                    <div style={{ color: '#8A7E6E', fontSize: 14, fontWeight: 600 }}>{formatCurrency(item.current_value || item.purchase_price)}</div>
                  </div>
                ); })}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        {view === 'items' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <input style={{ ...inputStyle, maxWidth: 280, flex: 1 }} placeholder="🔍 Search items..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...selectStyle, maxWidth: 180 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="all">All Categories</option>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6A6055' }}>{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</div>
            </div>
            {filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#5A5248' }}><div style={{ fontSize: 36, marginBottom: 12 }}>📦</div><p>{items.length === 0 ? 'No items yet.' : 'No items match your search.'}</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {filteredItems.map(item => { const cat = CATEGORIES[item.category] || CATEGORIES.other; const ldc = documents.filter(d => d.linked_item_id === item.id).length; return (
                  <div key={item.id} onClick={() => setDetailItem(item)} style={{ background: '#1A1714', border: '1px solid #2A2520', borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'border-color 0.25s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = cat.color + '66'} onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2520'}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: cat.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{cat.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#E0D6C8', fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                        <div style={{ color: '#6A6055', fontSize: 12 }}>{cat.label}{item.location ? ` · ${item.location}` : ''}</div>
                      </div>
                    </div>
                    {(item.make || item.model) && <div style={{ color: '#8A7E6E', fontSize: 12, marginBottom: 8 }}>{[item.make, item.model].filter(Boolean).join(' ')}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#D4A574', fontFamily: "'Playfair Display', Georgia, serif" }}>{formatCurrency(item.current_value || item.purchase_price)}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {item.serial_number && <span title="Has serial number" style={{ color: '#5A5248', fontSize: 14 }}>🔢</span>}
                        {ldc > 0 && <span style={{ color: '#5A5248', fontSize: 12, background: '#252218', padding: '2px 6px', borderRadius: 4 }}>📎 {ldc}</span>}
                      </div>
                    </div>
                  </div>
                ); })}
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {view === 'documents' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <input style={{ ...inputStyle, maxWidth: 280, flex: 1 }} placeholder="🔍 Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...selectStyle, maxWidth: 200 }} value={filterDocType} onChange={e => setFilterDocType(e.target.value)}>
                <option value="all">All Types</option>
                {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <div style={{ marginLeft: 'auto', fontSize: 13, color: '#6A6055' }}>{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}</div>
            </div>
            {filteredDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#5A5248' }}><div style={{ fontSize: 36, marginBottom: 12 }}>📄</div><p>{documents.length === 0 ? 'No documents yet.' : 'No documents match.'}</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredDocs.map(doc => { const dt = DOC_TYPES[doc.type] || DOC_TYPES.other_doc; const li = items.find(i => i.id === doc.linked_item_id); return (
                  <div key={doc.id} style={{ background: '#1A1714', border: '1px solid #2A2520', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.25s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = dt.color + '66'} onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2520'}>
                    <div style={{ width: 42, height: 42, borderRadius: 8, background: dt.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{dt.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#E0D6C8', fontSize: 15, fontWeight: 600 }}>{doc.name}</div>
                      <div style={{ color: '#6A6055', fontSize: 12 }}>{dt.label}{doc.issued_by ? ` · ${doc.issued_by}` : ''}{doc.policy_number ? ` · ${doc.policy_number}` : ''}{li ? ` · 📎 ${li.name}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <ExpiryBadge expiryDate={doc.expiry_date} />
                      {doc.expiry_date && <span style={{ color: '#6A6055', fontSize: 12 }}>Exp: {formatDate(doc.expiry_date)}</span>}
                      <button onClick={() => setModalState({ type: 'editDoc', data: doc })} style={{ background: 'none', border: '1px solid #2A2520', color: '#8A7E6E', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => setDeleteTarget({ type: 'doc', id: doc.id, name: doc.name })} style={{ background: 'none', border: '1px solid #2A2520', color: '#8A5B5B', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ); })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={modalState.type === 'addItem'} onClose={() => setModalState({ type: null })} title="Add New Item"><ItemForm onSave={saveItem} onCancel={() => setModalState({ type: null })} /></Modal>
      <Modal isOpen={modalState.type === 'editItem'} onClose={() => setModalState({ type: null })} title="Edit Item"><ItemForm item={modalState.data} onSave={saveItem} onCancel={() => setModalState({ type: null })} /></Modal>
      <Modal isOpen={modalState.type === 'addDoc'} onClose={() => setModalState({ type: null })} title="Add New Document"><DocForm items={items} onSave={saveDoc} onCancel={() => setModalState({ type: null })} /></Modal>
      <Modal isOpen={modalState.type === 'editDoc'} onClose={() => setModalState({ type: null })} title="Edit Document"><DocForm doc={modalState.data} items={items} onSave={saveDoc} onCancel={() => setModalState({ type: null })} /></Modal>
      <Modal isOpen={modalState.type === 'account'} onClose={() => setModalState({ type: null })} title="Account & Security">
        <AccountSettings user={user} onLogout={onLogout} onClose={() => setModalState({ type: null })} />
      </Modal>
      <Modal isOpen={!!detailItem} onClose={() => setDetailItem(null)} title={detailItem?.name}>
        {detailItem && <ItemDetail item={detailItem} documents={documents} onEdit={() => { setModalState({ type: 'editItem', data: detailItem }); setDetailItem(null); }} onDelete={() => setDeleteTarget({ type: 'item', id: detailItem.id, name: detailItem.name })} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleteTarget} title={`Delete "${deleteTarget?.name}"?`} message="This action cannot be undone." onCancel={() => setDeleteTarget(null)} onConfirm={() => { deleteTarget?.type === 'item' ? deleteItem(deleteTarget.id) : deleteDoc(deleteTarget.id); }} />
    </div>
  );
}
