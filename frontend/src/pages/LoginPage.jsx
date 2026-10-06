// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext.jsx';

// const DEMOS = [
//   { label: 'Admin',      email: 'admin@assetpro.com',   desc: 'Full system access' },
//   { label: 'Manager',    email: 'manager@assetpro.com', desc: 'Create WOs, manage assets' },
//   { label: 'Technician', email: 'priya@assetpro.com',   desc: 'View & complete own WOs' },
// ];

// export default function LoginPage() {
//   const { login } = useAuth();
//   const navigate  = useNavigate();
//   const [form, setForm]     = useState({ email: '', password: '' });
//   const [error, setError]   = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(''); setLoading(true);
//     try {
//       await login(form.email, form.password);
//       navigate('/', { replace: true });
//     } catch (err) {
//       setError(err.response?.data?.message || 'Login failed. Check credentials.');
//     } finally { setLoading(false); }
//   };

//   return (
//     <div style={{minHeight:'100vh',display:'flex',background:'var(--bg)'}}>
//       {/* Left branding panel */}
//       <div style={{width:420,background:'var(--surface)',borderRight:'1px solid var(--border)',padding:48,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
//         <div style={{display:'flex',alignItems:'center',gap:12}}>
//           <div style={{width:40,height:40,background:'var(--teal)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
//             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F1923" strokeWidth="2.5">
//               <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/>
//               <rect x="3" y="13" width="8" height="8" rx="1"/><path d="M17 13v8M13 17h8"/>
//             </svg>
//           </div>
//           <div>
//             <div style={{fontWeight:700,fontSize:16}}>AssetPro</div>
//             <div style={{fontSize:11,color:'var(--muted)'}}>Enterprise Asset Management</div>
//           </div>
//         </div>

//         <div>
//           <h2 style={{fontSize:28,fontWeight:700,lineHeight:1.3,marginBottom:16}}>
//             Industrial-grade<br/>
//             <span style={{color:'var(--teal)'}}>asset management.</span>
//           </h2>
//           <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.8,marginBottom:28}}>
//             Track equipment, schedule preventive maintenance, manage work orders and keep full audit trails — all in one system.
//           </p>
//           {[
//             {icon:'shield-check',  text:'Role-based access control (RBAC)'},
//             {icon:'calendar-event',text:'Automated maintenance threshold tracking'},
//             {icon:'box',           text:'Auto-deduct inventory on WO completion'},
//             {icon:'activity',      text:'Immutable audit trail on every change'},
//           ].map(f => (
//             <div key={f.text} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,fontSize:13,color:'var(--muted)'}}>
//               <i className={`ti ti-${f.icon}`} style={{color:'var(--teal)',fontSize:15,flexShrink:0}} />
//               {f.text}
//             </div>
//           ))}
//         </div>

//         <div style={{fontSize:11,color:'var(--muted)'}}>React · Node.js · PostgreSQL · JWT · REST API</div>
//       </div>

//       {/* Right login form */}
//       <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:32}}>
//         <div style={{width:'100%',maxWidth:360}}>
//           <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Sign in</h1>
//           <p style={{fontSize:13,color:'var(--muted)',marginBottom:28}}>Enter your credentials to continue</p>

//           {error && (
//             <div style={{padding:'10px 14px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:8,color:'var(--red)',fontSize:13,marginBottom:16}}>
//               <i className="ti ti-alert-circle" style={{marginRight:8}} />{error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit}>
//             <div className="form-group">
//               <label className="form-label">Email</label>
//               <input className="form-input" type="email" required autoComplete="email"
//                 placeholder="you@company.com"
//                 value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
//             </div>
//             <div className="form-group">
//               <label className="form-label">Password</label>
//               <input className="form-input" type="password" required autoComplete="current-password"
//                 placeholder="••••••••"
//                 value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
//             </div>
//             <button type="submit" className="btn btn-primary" disabled={loading}
//               style={{width:'100%',justifyContent:'center',padding:'10px',marginTop:4}}>
//               {loading ? <><i className="ti ti-loader spinner" style={{marginRight:6}} />Signing in...</> : 'Sign in'}
//             </button>
//           </form>

//           <div style={{marginTop:28}}>
//             <div style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10,fontWeight:500}}>
//               Demo accounts (password: Password123!)
//             </div>
//             {DEMOS.map(d => (
//               <button key={d.email} onClick={() => setForm({ email: d.email, password: 'Password123!' })}
//                 style={{width:'100%',textAlign:'left',padding:'10px 14px',marginBottom:8,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',transition:'border-color .15s'}}
//                 onMouseEnter={e => e.currentTarget.style.borderColor='var(--teal)'}
//                 onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
//                 <div style={{fontWeight:600,fontSize:12,color:'var(--text)'}}>{d.label}</div>
//                 <div style={{fontFamily:'monospace',fontSize:11,color:'var(--muted)',marginTop:2}}>{d.email}</div>
//                 <div style={{fontSize:11,color:'var(--muted)'}}>{d.desc}</div>
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DEMOS = [
  { label: 'Admin',      email: 'admin@assetpro.com',   desc: 'Full system access', color: 'var(--red)' },
  { label: 'Manager',    email: 'manager@assetpro.com', desc: 'Create WOs, manage assets', color: 'var(--amber)' },
  { label: 'Technician', email: 'priya@assetpro.com',   desc: 'View & complete own WOs', color: 'var(--teal)' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',background:'var(--bg)'}}>
      {/* ── Left branding panel ── */}
      <div style={{width:440,background:'var(--surface)',borderRight:'1px solid var(--border)',padding:48,display:'flex',flexDirection:'column',justifyContent:'space-between',boxShadow:'var(--shadow-lg)', zIndex:1}}>
        
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,background:'linear-gradient(135deg, var(--teal), #06b6d4)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(45,212,191,0.2)'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0B1015" strokeWidth="2.5">
              <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/>
              <rect x="3" y="13" width="8" height="8" rx="1"/><path d="M17 13v8M13 17h8"/>
            </svg>
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:16,letterSpacing:'-0.3px'}}>AssetPro</div>
            <div style={{fontSize:11,color:'var(--muted)',fontWeight:500}}>Enterprise Asset Management</div>
          </div>
        </div>

        {/* Value Prop */}
        <div>
          <h2 style={{fontSize:30,fontWeight:700,lineHeight:1.2,marginBottom:20,letterSpacing:'-0.5px'}}>
            Maximize uptime.<br/>
            <span style={{color:'var(--teal)'}}>Eliminate guesswork.</span>
          </h2>
          <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.8,marginBottom:32}}>
            Track equipment, schedule preventive maintenance, manage work orders and keep full audit trails — all in one system.
          </p>
          
          {[
            {icon:'shield-check',  text:'Role-based access control (RBAC)'},
            {icon:'calendar-event',text:'Automated maintenance threshold tracking'},
            {icon:'box',           text:'Auto-deduct inventory on WO completion'},
            {icon:'activity',      text:'Immutable audit trail on every change'},
          ].map(f => (
            <div key={f.text} style={{display:'flex',alignItems:'center',gap:12,marginBottom:14,fontSize:13,color:'var(--text)'}}>
              <div style={{width:28,height:28,borderRadius:8,background:'rgba(45,212,191,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:'1px solid rgba(45,212,191,0.15)'}}>
                <i className={`ti ti-${f.icon}`} style={{color:'var(--teal)',fontSize:15}} />
              </div>
              <span style={{color:'var(--muted)', fontWeight:500}}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Tech Stack Footer */}
        <div style={{paddingTop:24,borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {['React','Node.js','PostgreSQL','JWT','REST API'].map(t=>(
              <span key={t} style={{fontSize:10,padding:'4px 8px',borderRadius:6,background:'var(--bg)',color:'var(--muted)',border:'1px solid var(--border)',fontWeight:500}}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right login form ── */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:32,background:'radial-gradient(circle at top right, rgba(45,212,191,0.03) 0%, transparent 40%)'}}>
        <div style={{width:'100%',maxWidth:380}}>
          <h1 style={{fontSize:24,fontWeight:700,marginBottom:6,letterSpacing:'-0.3px'}}>Sign in</h1>
          <p style={{fontSize:13,color:'var(--muted)',marginBottom:32,fontWeight:500}}>Enter your credentials to continue</p>

          {error && (
            <div style={{padding:'12px 16px',background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.2)',borderLeft:'3px solid var(--red)',borderRadius:8,color:'var(--red)',fontSize:13,marginBottom:20,fontWeight:500}}>
              <i className="ti ti-alert-circle" style={{marginRight:8,verticalAlign:'middle'}} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" required autoComplete="email"
                placeholder="you@company.com"
                value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" required autoComplete="current-password"
                placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{width:'100%',justifyContent:'center',padding:'12px',marginTop:8,fontSize:14,borderRadius:10}}>
              {loading ? <><i className="ti ti-loader spinner" style={{marginRight:8}} />Signing in...</> : 'Sign in'}
            </button>
          </form>

          <div style={{marginTop:36}}>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:14,fontWeight:600}}>
              Quick Demo Access <span style={{fontWeight:400,opacity:0.7}}>(password: Password123!)</span>
            </div>
            {DEMOS.map(d => (
              <button key={d.email} onClick={() => setForm({ email: d.email, password: 'Password123!' })}
                style={{width:'100%',textAlign:'left',padding:'14px 16px',marginBottom:10,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,cursor:'pointer',transition:'all .15s ease',boxShadow:'var(--shadow-sm)',display:'flex',alignItems:'center',gap:14}}
                onMouseEnter={e => {
                  e.currentTarget.style.transform='translateY(-1px)';
                  e.currentTarget.style.borderColor=`${d.color}40`;
                  e.currentTarget.style.boxShadow='var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform='none';
                  e.currentTarget.style.borderColor='var(--border)';
                  e.currentTarget.style.boxShadow='var(--shadow-sm)';
                }}>
                {/* Role Color Dot */}
                <div style={{width:8,height:8,borderRadius:'50%',background:d.color,flexShrink:0,boxShadow:`0 0 8px ${d.color}40`}} />
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13,color:'var(--text)',marginBottom:2}}>{d.label}</div>
                  <div style={{fontSize:11,color:'var(--muted)'}}>{d.desc}</div>
                </div>
                <i className="ti ti-chevron-right" style={{color:'var(--muted)',fontSize:16}} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}