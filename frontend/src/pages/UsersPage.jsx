import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { showToast } from '../App.jsx';

const ROLE_COLOR = { admin:'var(--red)', manager:'var(--amber)', technician:'var(--teal)' };
const PERMS = {
  admin:      ['Full system access','User management','All CRUD operations','Audit log access','System configuration'],
  manager:    ['Create work orders','Assign technicians','View all assets','Inventory control','Dashboard & reports'],
  technician: ['View assigned WOs only','Update WO progress','Mark WO complete','View asset details','No admin access'],
};
const EMPTY = { name:'',email:'',password:'Password123!',role:'technician',department:'' };

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/users').then(r=>setUsers(r.data.data)).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const counts = users.reduce((a,u)=>{ a[u.role]=(a[u.role]||0)+1; return a; },{});

  const handleCreate = async () => {
    if (!form.name||!form.email||!form.password) return showToast('Name, email, password required','error');
    setSaving(true);
    try {
      await api.post('/auth/register', form);
      showToast('User created · Audit logged');
      setModal(false); setForm(EMPTY); load();
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        {['admin','manager','technician'].map(r=>(
          <div key={r} className="kpi">
            <div className="kpi-label" style={{color:ROLE_COLOR[r]}}><i className="ti ti-shield" style={{marginRight:6}} />{r.charAt(0).toUpperCase()+r.slice(1)}s</div>
            <div className="kpi-value" style={{color:ROLE_COLOR[r]}}>{counts[r]||0}</div>
          </div>
        ))}
      </div>

      {/* RBAC Matrix */}
      <div className="card" style={{marginBottom:16}}>
        <div className="card-header">
          <i className="ti ti-shield-check" style={{color:'var(--teal)'}} />
          <span className="card-title">Role Permissions Matrix</span>
        </div>
        <div className="card-body">
          <div className="grid-3">
            {Object.entries(PERMS).map(([role, perms])=>(
              <div key={role} style={{background:'var(--surface2)',borderRadius:10,padding:16,border:`1px solid ${ROLE_COLOR[role]}30`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <i className="ti ti-shield" style={{color:ROLE_COLOR[role]}} />
                  <span style={{fontWeight:700,fontSize:13,color:ROLE_COLOR[role],textTransform:'capitalize'}}>{role}</span>
                </div>
                {perms.map(p=>(
                  <div key={p} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7,fontSize:12,color:'var(--muted)'}}>
                    <i className="ti ti-check" style={{color:ROLE_COLOR[role],fontSize:11,flexShrink:0}} />{p}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="card">
        <div className="card-header">
          <i className="ti ti-users" style={{color:'var(--teal)'}} />
          <span className="card-title">User Directory</span>
          <span className="card-sub">{users.length} users</span>
          <button className="btn btn-primary btn-sm" style={{marginLeft:'auto'}} onClick={()=>{setForm(EMPTY);setModal(true);}}>
            <i className="ti ti-plus" /> Add User
          </button>
        </div>
        {loading
          ? <div style={{textAlign:'center',padding:48}}><i className="ti ti-loader spinner" style={{fontSize:24,color:'var(--teal)'}} /></div>
          : <table>
              <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Status</th><th>Last Login</th></tr></thead>
              <tbody>
                {users.map(u=>(
                  <tr key={u.id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:`${ROLE_COLOR[u.role]}22`,color:ROLE_COLOR[u.role],fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {u.name?.split(' ').map(w=>w[0]).join('')}
                        </div>
                        <div>
                          <div style={{fontWeight:600,fontSize:13}}>{u.name}</div>
                          <div style={{fontSize:11,color:'var(--muted)'}}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{fontSize:12,fontWeight:600,color:ROLE_COLOR[u.role],textTransform:'capitalize'}}>{u.role}</span></td>
                    <td><span style={{fontSize:12,color:'var(--muted)'}}>{u.department||'—'}</span></td>
                    <td><span className={`badge b-${u.is_active?'active':'inactive'}`}>{u.is_active?'Active':'Inactive'}</span></td>
                    <td>{u.last_login?<span className="mono" style={{fontSize:11,color:'var(--muted)'}}>{new Date(u.last_login).toLocaleString()}</span>:'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      {/* Create User Modal */}
      <div className={`modal-overlay${modal?' open':''}`} onClick={()=>setModal(false)}>
        <div className="modal" onClick={e=>e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Add User</span>
            <button className="modal-close" onClick={()=>setModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="Jane Smith" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" placeholder="jane@company.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Role *</label>
                <select className="form-select" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                  <option value="technician">Technician</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Department</label><input className="form-input" placeholder="Maintenance" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} /></div>
            </div>
            <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} /></div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?'Creating…':'Create User'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
