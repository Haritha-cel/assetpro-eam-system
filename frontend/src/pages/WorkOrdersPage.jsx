import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { showToast } from '../App.jsx';

const EMPTY_WO = { title:'',description:'',assetId:'',assignedTo:'',priority:'normal',woType:'corrective',estimatedHours:'',dueDate:'' };
const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1).replace('_',' ') : '';
const PRIORITY_COLOR = { critical:'var(--red)',high:'var(--amber)',normal:'var(--blue)',low:'var(--muted)' };

export default function WorkOrdersPage() {
  const { user, hasRole } = useAuth();
  const [wos,     setWos]     = useState([]);
  const [assets,  setAssets]  = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ status:'', priority:'' });
  const [createModal, setCreateModal]   = useState(false);
  const [completeModal, setCompleteModal] = useState(null);
  const [form,    setForm]    = useState(EMPTY_WO);
  const [completeForm, setCF] = useState({ actualHours:'', completionNotes:'' });
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filter.status)   p.set('status',   filter.status);
    if (filter.priority) p.set('priority', filter.priority);
    api.get(`/work-orders?${p}`).then(r => setWos(r.data.data)).catch(console.error).finally(()=>setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    api.get('/assets').then(r=>setAssets(r.data.data)).catch(()=>{});
    api.get('/users').then(r=>setUsers(r.data.data.filter(u=>u.role==='technician'))).catch(()=>{});
  }, []);

  const counts = wos.reduce((a,w)=>{ a[w.status]=(a[w.status]||0)+1; return a; },{});

  const handleCreate = async () => {
    if (!form.title||!form.assetId) return showToast('Title and Asset are required','error');
    setSaving(true);
    try {
      await api.post('/work-orders', form);
      showToast('Work order created · Audit logged');
      setCreateModal(false); setForm(EMPTY_WO); load();
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  const handleComplete = async () => {
    if (!completeForm.actualHours) return showToast('Actual hours required','error');
    setSaving(true);
    try {
      await api.post(`/work-orders/${completeModal.id}/complete`, completeForm);
      showToast('WO completed · Parts deducted · Asset updated · Maintenance reset · Audit logged');
      setCompleteModal(null); setCF({actualHours:'',completionNotes:''}); load();
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/work-orders/${id}`, { status });
      showToast(`Status updated to ${status.replace('_',' ')}`);
      load();
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
  };

  const canComplete = wo => hasRole('admin','manager') || (hasRole('technician') && wo.assigned_to===user?.id);

  return (
    <div>
      {/* Mini KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[['Open','open','var(--blue)'],['In Progress','in_progress','var(--amber)'],['Completed','completed','var(--green)'],['Cancelled','cancelled','var(--muted)']].map(([l,k,c])=>(
          <div key={k} className="kpi" style={{padding:'14px 16px'}}>
            <div className="kpi-label">{l}</div>
            <div className="kpi-value" style={{fontSize:22,color:c}}>{counts[k]||0}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <i className="ti ti-clipboard-list" style={{color:'var(--teal)'}} />
          <span className="card-title">Work Orders</span>
          <span className="card-sub">Role: {user?.role} · {hasRole('admin','manager')?'Full access':'Your assigned WOs only'}</span>
          <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
            <select className="form-select" style={{width:150,padding:'5px 10px',fontSize:12}} value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))}>
              <option value="">All Status</option>
              {['open','assigned','in_progress','completed','cancelled'].map(s=><option key={s} value={s}>{cap(s)}</option>)}
            </select>
            <select className="form-select" style={{width:130,padding:'5px 10px',fontSize:12}} value={filter.priority} onChange={e=>setFilter(f=>({...f,priority:e.target.value}))}>
              <option value="">All Priority</option>
              {['critical','high','normal','low'].map(p=><option key={p} value={p}>{cap(p)}</option>)}
            </select>
            {hasRole('admin','manager') && (
              <button className="btn btn-primary btn-sm" onClick={()=>{setForm(EMPTY_WO);setCreateModal(true);}}>
                <i className="ti ti-plus" /> New WO
              </button>
            )}
          </div>
        </div>
        {loading
          ? <div style={{textAlign:'center',padding:48}}><i className="ti ti-loader spinner" style={{fontSize:24,color:'var(--teal)'}} /></div>
          : wos.length===0
            ? <div className="empty-state"><i className="ti ti-clipboard-off" />No work orders match filters</div>
            : <table>
                <thead><tr>
                  <th>WO #</th><th>Title</th><th>Priority</th><th>Status</th>
                  <th>Assigned To</th><th>Due Date</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {wos.map(w=>(
                    <tr key={w.id}>
                      <td><span className="mono" style={{color:'var(--muted)'}}>{w.wo_number}</span></td>
                      <td>
                        <div style={{fontWeight:600,fontSize:13}}>{w.title}</div>
                        <div style={{fontSize:11,color:'var(--muted)'}}>{w.asset_name} ({w.asset_code})</div>
                      </td>
                      <td>
                        <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,
                          color:PRIORITY_COLOR[w.priority], background:`${PRIORITY_COLOR[w.priority]}20`}}>
                          {cap(w.priority)}
                        </span>
                      </td>
                      <td><span className={`badge b-${w.status}`}>{cap(w.status)}</span></td>
                      <td><span style={{fontSize:12}}>{w.assigned_to_name||<span style={{color:'var(--muted)'}}>Unassigned</span>}</span></td>
                      <td>{w.due_date?<span className="mono" style={{fontSize:11}}>{new Date(w.due_date).toLocaleDateString()}</span>:'—'}</td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          {w.status==='open'&&hasRole('admin','manager')&&(
                            <button className="btn btn-sm" style={{borderColor:'rgba(245,158,11,.4)',color:'var(--amber)'}}
                              onClick={()=>handleStatusChange(w.id,'in_progress')}>
                              <i className="ti ti-play" /> Start
                            </button>
                          )}
                          {!['completed','cancelled'].includes(w.status)&&canComplete(w)&&(
                            <button className="btn btn-primary btn-sm"
                              onClick={()=>{setCompleteModal(w);setCF({actualHours:'',completionNotes:''});}}>
                              <i className="ti ti-check" /> Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        }
      </div>

      {/* Create WO Modal */}
      <div className={`modal-overlay${createModal?' open':''}`} onClick={()=>setCreateModal(false)}>
        <div className="modal" style={{maxWidth:540}} onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Create Work Order</span>
            <button className="modal-close" onClick={()=>setCreateModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="500h engine service" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Asset *</label>
                <select className="form-select" value={form.assetId} onChange={e=>setForm(f=>({...f,assetId:e.target.value}))}>
                  <option value="">Select asset…</option>
                  {assets.map(a=><option key={a.id} value={a.id}>{a.asset_code} · {a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" value={form.assignedTo} onChange={e=>setForm(f=>({...f,assignedTo:e.target.value}))}>
                  <option value="">Unassigned</option>
                  {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                  {['critical','high','normal','low'].map(p=><option key={p} value={p}>{cap(p)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.woType} onChange={e=>setForm(f=>({...f,woType:e.target.value}))}>
                  {['preventive','corrective','inspection','emergency'].map(t=><option key={t} value={t}>{cap(t)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Est. Hours</label>
                <input className="form-input" type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={e=>setForm(f=>({...f,estimatedHours:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows="2" placeholder="Describe the task…" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={()=>setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving?<><i className="ti ti-loader spinner" style={{marginRight:6}}/>Saving…</>:'Create Work Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Complete WO Modal */}
      <div className={`modal-overlay${completeModal?' open':''}`} onClick={()=>setCompleteModal(null)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Complete — {completeModal?.wo_number}</span>
            <button className="modal-close" onClick={()=>setCompleteModal(null)}>×</button>
          </div>
          <div className="modal-body">
            <div style={{padding:'10px 14px',background:'rgba(0,212,170,.08)',border:'1px solid rgba(0,212,170,.2)',borderRadius:8,fontSize:12,color:'var(--teal)',marginBottom:16}}>
              <i className="ti ti-info-circle" style={{marginRight:6}} />
              This will: deduct required parts from inventory · mark asset active · reset maintenance schedule · append audit log entries — all in one atomic transaction.
            </div>
            <div className="form-group">
              <label className="form-label">Actual Hours Spent *</label>
              <input className="form-input" type="number" min="0.5" step="0.5" placeholder="e.g. 3.5"
                value={completeForm.actualHours} onChange={e=>setCF(f=>({...f,actualHours:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Completion Notes</label>
              <textarea className="form-input" rows="3" placeholder="What was done, any issues found…"
                value={completeForm.completionNotes} onChange={e=>setCF(f=>({...f,completionNotes:e.target.value}))} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={()=>setCompleteModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleComplete} disabled={saving}>
              {saving?<><i className="ti ti-loader spinner" style={{marginRight:6}}/>Processing…</>
                     :<><i className="ti ti-check" style={{marginRight:6}}/>Mark Complete</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
