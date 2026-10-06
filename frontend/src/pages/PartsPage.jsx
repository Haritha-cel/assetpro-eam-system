import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { showToast } from '../App.jsx';

const EMPTY = { name:'',sku:'',description:'',quantity:0,unitCost:'',reorderPoint:0,maxStock:100,supplier:'' };

export default function PartsPage() {
  const [parts,   setParts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(false);
  const [adjModal,setAdj]     = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [adjAmt,  setAdjAmt]  = useState(0);
  const [adjReason, setReason]= useState('');
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/parts${search?`?search=${encodeURIComponent(search)}`:''}`)
      .then(r=>setParts(r.data.data)).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[search]);

  const lowCount   = parts.filter(p=>p.is_low_stock).length;
  const totalValue = parts.reduce((s,p)=>s+(p.quantity*(p.unit_cost||0)),0);

  const handleCreate = async () => {
    if (!form.name||!form.sku) return showToast('Name and SKU required','error');
    setSaving(true);
    try {
      await api.post('/parts', form);
      showToast('Part added · Audit logged');
      setModal(false); setForm(EMPTY); load();
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  const handleAdjust = async () => {
    if (!adjAmt||adjAmt===0) return showToast('Enter a non-zero adjustment','error');
    setSaving(true);
    try {
      await api.post(`/parts/${adjModal.id}/adjust`, { adjustment: parseInt(adjAmt), reason: adjReason });
      showToast(`Stock adjusted by ${adjAmt>0?'+':''}${adjAmt} · Audit logged`);
      setAdj(null); load();
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        <div className="kpi"><div className="kpi-label">Total Part Types</div><div className="kpi-value" style={{color:'var(--teal)'}}>{parts.length}</div></div>
        <div className="kpi"><div className="kpi-label">Low Stock Alerts</div><div className="kpi-value" style={{color:lowCount?'var(--red)':'var(--green)'}}>{lowCount}</div><div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{lowCount?'Below reorder point':'All OK'}</div></div>
        <div className="kpi"><div className="kpi-label">Inventory Value</div><div className="kpi-value" style={{color:'var(--amber)',fontSize:22}}>${totalValue.toFixed(0)}</div></div>
      </div>

      {lowCount>0 && (
        <div className="alert-banner" style={{borderColor:'rgba(245,158,11,.3)',background:'rgba(245,158,11,.07)'}}>
          <i className="ti ti-alert-circle" style={{fontSize:18,color:'var(--amber)',flexShrink:0}} />
          <span style={{fontSize:13,color:'var(--muted)'}}>
            <strong style={{color:'var(--amber)'}}>{lowCount} parts</strong> are below their reorder point — review and order stock.
          </span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <i className="ti ti-box" style={{color:'var(--teal)'}} />
          <span className="card-title">Spare Parts Inventory</span>
          <span className="card-sub">Auto-decremented on WO completion</span>
          <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
            <input className="form-input" style={{width:200,padding:'5px 10px',fontSize:12}} placeholder="Search name or SKU…"
              value={search} onChange={e=>setSearch(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={()=>{setForm(EMPTY);setModal(true);}}>
              <i className="ti ti-plus" /> Add Part
            </button>
          </div>
        </div>
        {loading
          ? <div style={{textAlign:'center',padding:48}}><i className="ti ti-loader spinner" style={{fontSize:24,color:'var(--teal)'}} /></div>
          : <table>
              <thead><tr>
                <th>Part Name</th><th>SKU</th><th>Supplier</th>
                <th>Stock Level</th><th>Reorder At</th><th>Unit Cost</th><th>Alert</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {parts.map(p=>{
                  const pct  = Math.min((p.quantity/Math.max(p.max_stock,1))*100,100);
                  const color= p.is_low_stock?'var(--red)':pct<50?'var(--amber)':'var(--teal)';
                  return (
                    <tr key={p.id}>
                      <td style={{fontWeight:600,fontSize:13}}>{p.name}</td>
                      <td><span className="mono">{p.sku}</span></td>
                      <td><span style={{fontSize:12,color:'var(--muted)'}}>{p.supplier||'—'}</span></td>
                      <td style={{width:160}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div className="stock-bar">
                            <div className="stock-bar-fill" style={{width:`${pct}%`,background:color}} />
                          </div>
                          <span className="mono" style={{fontSize:12,color,minWidth:30}}>{p.quantity}</span>
                        </div>
                      </td>
                      <td><span className="mono">{p.reorder_point}</span></td>
                      <td>{p.unit_cost?<span className="mono">${Number(p.unit_cost).toFixed(2)}</span>:'—'}</td>
                      <td>
                        {p.is_low_stock
                          ? <span style={{fontSize:11,fontWeight:600,color:'var(--red)'}}><i className="ti ti-alert-triangle" style={{marginRight:4}} />Low</span>
                          : <span style={{fontSize:11,color:'var(--green)'}}><i className="ti ti-check" style={{marginRight:4}} />OK</span>}
                      </td>
                      <td>
                        <button className="btn btn-sm" onClick={()=>{setAdj(p);setAdjAmt(0);setReason('');}}>
                          <i className="ti ti-adjustments" /> Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </div>

      {/* Add Part Modal */}
      <div className={`modal-overlay${modal?' open':''}`} onClick={()=>setModal(false)}>
        <div className="modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Add Spare Part</span>
            <button className="modal-close" onClick={()=>setModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Part Name *</label><input className="form-input" placeholder="Engine Oil Filter" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">SKU *</label><input className="form-input" placeholder="ENG-OF-22" value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" min="0" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Unit Cost ($)</label><input className="form-input" type="number" min="0" step="0.01" value={form.unitCost} onChange={e=>setForm(f=>({...f,unitCost:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Reorder Point</label><input className="form-input" type="number" min="0" value={form.reorderPoint} onChange={e=>setForm(f=>({...f,reorderPoint:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Max Stock</label><input className="form-input" type="number" min="1" value={form.maxStock} onChange={e=>setForm(f=>({...f,maxStock:e.target.value}))} /></div>
              <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Supplier</label><input className="form-input" placeholder="FleetParts Ltd" value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving?'Saving…':'Add to Inventory'}
            </button>
          </div>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      <div className={`modal-overlay${adjModal?' open':''}`} onClick={()=>setAdj(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Adjust Stock — {adjModal?.name}</span>
            <button className="modal-close" onClick={()=>setAdj(null)}>×</button>
          </div>
          <div className="modal-body">
            <div style={{padding:'10px 14px',background:'var(--surface2)',borderRadius:8,fontSize:12,marginBottom:16,fontFamily:'monospace'}}>
              Current stock: <strong style={{color:'var(--teal)'}}>{adjModal?.quantity}</strong> &nbsp;·&nbsp;
              Reorder at: <strong style={{color:'var(--amber)'}}>{adjModal?.reorder_point}</strong>
            </div>
            <div className="form-group">
              <label className="form-label">Adjustment (+ to add, − to deduct) *</label>
              <input className="form-input" type="number" placeholder="e.g. 10 or -3" value={adjAmt} onChange={e=>setAdjAmt(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <input className="form-input" placeholder="Received shipment / manual correction…" value={adjReason} onChange={e=>setReason(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={()=>setAdj(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdjust} disabled={saving}>
              {saving?'Saving…':'Apply Adjustment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
