import React, { useState, useEffect } from 'react';
import api from '../services/api.js';

const ACTION_COLOR = {
  CREATE:'var(--teal)', UPDATE:'var(--blue)', COMPLETE:'var(--green)',
  DEDUCT:'var(--amber)', ADJUST:'var(--amber)', RETIRE:'var(--muted)',
  LOGIN:'var(--muted)', LOGIN_FAIL:'var(--red)',
};

export default function AuditPage() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ action:'', entityType:'' });

  const load = () => {
    setLoading(true);
    const p = new URLSearchParams({ limit: 200 });
    if (filter.action)     p.set('action',     filter.action);
    if (filter.entityType) p.set('entityType', filter.entityType);
    api.get(`/audit?${p}`).then(r=>setLogs(r.data.data)).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[filter]);

  return (
    <div>
      {/* Stats strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          ['Total Events', logs.length, 'var(--teal)', 'shield-check'],
          ['Creates', logs.filter(l=>l.action==='CREATE').length, 'var(--blue)', 'plus'],
          ['Completions', logs.filter(l=>l.action==='COMPLETE').length, 'var(--green)', 'check'],
          ['Deductions', logs.filter(l=>l.action==='DEDUCT').length, 'var(--amber)', 'box'],
        ].map(([label, val, color, icon])=>(
          <div key={label} className="kpi">
            <div className="kpi-label"><i className={`ti ti-${icon}`} style={{marginRight:6}} />{label}</div>
            <div className="kpi-value" style={{color}}>{val}</div>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 18px',borderRadius:10,border:'1px solid rgba(0,212,170,.2)',background:'rgba(0,212,170,.06)',marginBottom:16,fontSize:13,color:'var(--muted)'}}>
        <i className="ti ti-lock" style={{fontSize:18,color:'var(--teal)',flexShrink:0}} />
        <span>
          <strong style={{color:'var(--teal)'}}>Immutable audit trail</strong> — every state change is recorded with actor, previous value, new value and timestamp.
          Records are <strong style={{color:'var(--text)'}}>append-only</strong> and cannot be modified or deleted.
        </span>
      </div>

      <div className="card">
        <div className="card-header">
          <i className="ti ti-shield-check" style={{color:'var(--teal)'}} />
          <span className="card-title">Audit Log</span>
          <span className="card-sub">Append-only · Immutable</span>
          <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
            <select className="form-select" style={{width:140,padding:'5px 10px',fontSize:12}} value={filter.action} onChange={e=>setFilter(f=>({...f,action:e.target.value}))}>
              <option value="">All Actions</option>
              {['CREATE','UPDATE','COMPLETE','DEDUCT','ADJUST','RETIRE','LOGIN'].map(a=><option key={a} value={a}>{a}</option>)}
            </select>
            <select className="form-select" style={{width:150,padding:'5px 10px',fontSize:12}} value={filter.entityType} onChange={e=>setFilter(f=>({...f,entityType:e.target.value}))}>
              <option value="">All Entities</option>
              {['work_order','asset','spare_part','user','auth'].map(e=><option key={e} value={e}>{e.replace('_',' ')}</option>)}
            </select>
          </div>
        </div>
        {loading
          ? <div style={{textAlign:'center',padding:48}}><i className="ti ti-loader spinner" style={{fontSize:24,color:'var(--teal)'}} /></div>
          : logs.length===0
            ? <div className="empty-state"><i className="ti ti-shield-off" />No audit events found</div>
            : <table>
                <thead><tr>
                  <th>Timestamp</th><th>Actor</th><th>Action</th>
                  <th>Entity</th><th>Field</th><th>Previous</th><th>New Value</th>
                </tr></thead>
                <tbody>
                  {logs.map(l=>(
                    <tr key={l.id}>
                      <td><span className="mono" style={{fontSize:11,color:'var(--muted)'}}>{new Date(l.created_at).toLocaleString()}</span></td>
                      <td><span style={{fontSize:12,fontWeight:600,color:'var(--teal)'}}>{l.user_name||'System'}</span></td>
                      <td>
                        <span style={{fontSize:11,fontWeight:700,fontFamily:'monospace',padding:'2px 8px',borderRadius:4,
                          color:ACTION_COLOR[l.action]||'var(--text)',
                          background:`${ACTION_COLOR[l.action]||'var(--muted)'}18`}}>
                          {l.action}
                        </span>
                      </td>
                      <td>
                        <div style={{fontSize:12,textTransform:'capitalize'}}>{l.entity_type?.replace('_',' ')||'—'}</div>
                        {l.entity_id&&<div className="mono" style={{fontSize:10,color:'var(--muted)'}}>{l.entity_id.slice(0,8)}…</div>}
                      </td>
                      <td><span className="mono" style={{fontSize:11,color:'var(--muted)'}}>{l.field_name||'—'}</span></td>
                      <td>{l.old_value?<span className="mono" style={{fontSize:11,padding:'1px 6px',borderRadius:4,background:'rgba(239,68,68,.1)',color:'#F87171'}}>{l.old_value}</span>:'—'}</td>
                      <td>{l.new_value?<span className="mono" style={{fontSize:11,padding:'1px 6px',borderRadius:4,background:'rgba(0,212,170,.1)',color:'var(--teal)'}}>{l.new_value}</span>:'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
        }
      </div>
    </div>
  );
}
