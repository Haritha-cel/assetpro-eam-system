import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { showToast } from '../App.jsx';

const TYPES    = ['forklift','truck','excavator','crane','generator','compressor','equipment','other'];
const STATUSES = ['active','maintenance','inactive'];
const EMPTY    = { name:'',assetCode:'',serialNumber:'',assetType:'equipment',status:'active',location:'',runningHours:0,manufacturer:'',model:'',year:'',purchaseCost:'',notes:'' };

function Ring({ pct=0 }) {
  const r=14, c=2*Math.PI*r, val=Math.min(pct,100);
  const color = val>=100?'var(--red)':val>70?'var(--amber)':'var(--teal)';
  return (
    <div className="maintenance-ring">
      <svg width="38" height="38" viewBox="0 0 38 38">
        <circle cx="19" cy="19" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3"/>
        <circle cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(val/100)*c} ${c}`} strokeLinecap="round"/>
      </svg>
      <div className="ring-pct" style={{color}}>{Math.round(val)}%</div>
    </div>
  );
}

export default function AssetsPage() {
  const { hasRole } = useAuth();
  const [assets, setAssets]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState({ status:'', assetType:'', search:'' });
  const [modal, setModal]       = useState(null);   // null | 'create' | assetObj
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filter.status)    p.set('status',    filter.status);
    if (filter.assetType) p.set('assetType', filter.assetType);
    if (filter.search)    p.set('search',    filter.search);
    api.get(`/assets?${p}`).then(r => setAssets(r.data.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit   = a   => {
    setForm({ name:a.name, assetCode:a.asset_code, serialNumber:a.serial_number||'', assetType:a.asset_type,
      status:a.status, location:a.location||'', runningHours:a.running_hours||0,
      manufacturer:a.manufacturer||'', model:a.model||'', year:a.year||'', purchaseCost:a.purchase_cost||'', notes:a.notes||'' });
    setModal(a);
  };

  const handleSave = async () => {
    if (!form.name || !form.assetCode || !form.assetType) return showToast('Name, Code and Type are required','error');
    setSaving(true);
    try {
      if (modal === 'create') { await api.post('/assets', form); showToast('Asset created · Audit logged'); }
      else                    { await api.patch(`/assets/${modal.id}`, form); showToast('Asset updated · Audit logged'); }
      setModal(null); load();
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : '';

  return (
    <div>
      {/* Filter bar */}
      <div className="card" style={{padding:'12px 16px',marginBottom:16,display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
        <select className="form-select" style={{width:150}} value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))}>
          <option value="">All Statuses</option>
          {STATUSES.map(s=><option key={s} value={s}>{cap(s)}</option>)}
        </select>
        <select className="form-select" style={{width:150}} value={filter.assetType} onChange={e=>setFilter(f=>({...f,assetType:e.target.value}))}>
          <option value="">All Types</option>
          {TYPES.map(t=><option key={t} value={t}>{cap(t)}</option>)}
        </select>
        <input className="form-input" style={{width:200}} placeholder="Search name or code…"
          value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))} />
        <button className="btn btn-sm" onClick={()=>setFilter({status:'',assetType:'',search:''})}>
          <i className="ti ti-x" /> Clear
        </button>
        {hasRole('admin','manager') && (
          <button className="btn btn-primary btn-sm" style={{marginLeft:'auto'}} onClick={openCreate}>
            <i className="ti ti-plus" /> Add Asset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <i className="ti ti-tools" style={{color:'var(--teal)'}} />
          <span className="card-title">Asset Fleet</span>
          <span className="card-sub">{assets.length} assets</span>
        </div>
        {loading
          ? <div style={{textAlign:'center',padding:48,color:'var(--muted)'}}><i className="ti ti-loader spinner" style={{fontSize:24,color:'var(--teal)'}} /></div>
          : assets.length === 0
            ? <div className="empty-state"><i className="ti ti-tools" />No assets found</div>
            : <table>
                <thead><tr>
                  <th>Asset</th><th>Serial #</th><th>Type</th><th>Status</th>
                  <th>Run Hours</th><th>Next Service</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {assets.map(a => {
                    const pct = parseFloat(a.maintenance_pct)||0;
                    const rem = parseFloat(a.hours_until_service);
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{fontWeight:600}}>{a.name}</div>
                          <div className="mono" style={{color:'var(--muted)'}}>{a.asset_code}</div>
                        </td>
                        <td><span className="mono">{a.serial_number||'—'}</span></td>
                        <td><span style={{fontSize:12,color:'var(--muted)',textTransform:'capitalize'}}>{a.asset_type}</span></td>
                        <td><span className={`badge b-${a.status}`}>{cap(a.status)}</span></td>
                        <td><span className="mono">{Number(a.running_hours||0).toLocaleString()}h</span></td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <Ring pct={pct} />
                            <div style={{fontSize:11}}>
                              {rem<=0
                                ? <span style={{color:'var(--red)',fontWeight:600}}>Overdue</span>
                                : <span>{Math.round(rem)}h to go</span>}
                              <div style={{color:'var(--muted)'}}>Every {a.interval_hours||'—'}h</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {hasRole('admin','manager') && (
                            <button className="btn btn-sm" onClick={()=>openEdit(a)}>
                              <i className="ti ti-pencil" /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
        }
      </div>

      {/* Modal */}
      <div className={`modal-overlay${modal?' open':''}`} onClick={()=>setModal(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">{modal==='create'?'Add Asset':`Edit — ${modal?.name||''}`}</span>
            <button className="modal-close" onClick={()=>setModal(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Asset Name *</label>
                <input className="form-input" placeholder="Forklift Alpha" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Asset Code *</label>
                <input className="form-input" placeholder="FLK-001" value={form.assetCode} onChange={e=>setForm(f=>({...f,assetCode:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input className="form-input" value={form.serialNumber} onChange={e=>setForm(f=>({...f,serialNumber:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Asset Type *</label>
                <select className="form-select" value={form.assetType} onChange={e=>setForm(f=>({...f,assetType:e.target.value}))}>
                  {TYPES.map(t=><option key={t} value={t}>{cap(t)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  {STATUSES.map(s=><option key={s} value={s}>{cap(s)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="Warehouse A" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Running Hours</label>
                <input className="form-input" type="number" min="0" value={form.runningHours} onChange={e=>setForm(f=>({...f,runningHours:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" type="number" min="1990" max="2030" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Manufacturer</label>
                <input className="form-input" placeholder="Toyota" value={form.manufacturer} onChange={e=>setForm(f=>({...f,manufacturer:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input className="form-input" placeholder="8FBE25" value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={()=>setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving?<><i className="ti ti-loader spinner" style={{marginRight:6}}/>Saving...</>
                     :(modal==='create'?'Create Asset':'Save Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
