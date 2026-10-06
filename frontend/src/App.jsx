import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AssetsPage from './pages/AssetsPage.jsx';
import WorkOrdersPage from './pages/WorkOrdersPage.jsx';
import MaintenancePage from './pages/MaintenancePage.jsx';
import PartsPage from './pages/PartsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import AuditPage from './pages/AuditPage.jsx';

// ── Global toast helper (callable anywhere) ───────────────────────────────────
let toastTimer;
export function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  const txt = document.getElementById('toast-msg');
  const icon = el?.querySelector('i');
  if (!el || !txt) return;
  txt.textContent = msg;
  el.className = type === 'error' ? 'show error' : 'show';
  if (icon) icon.className = type === 'error' ? 'ti ti-alert-circle' : 'ti ti-check';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3500);
}

// ── Protected route wrapper ───────────────────────────────────────────────────
function Protected({ roles, children }) {
  const { isAuthenticated, hasRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/" replace />;
  return children;
}

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV = [
  { to: '/', icon: 'layout-dashboard', label: 'Dashboard', roles: ['admin', 'manager', 'technician'], end: true },
  { to: '/assets', icon: 'tools', label: 'Assets', roles: ['admin', 'manager', 'technician'] },
  { to: '/work-orders', icon: 'clipboard-list', label: 'Work Orders', roles: ['admin', 'manager', 'technician'] },
  { to: '/maintenance', icon: 'calendar-event', label: 'Maintenance', roles: ['admin', 'manager', 'technician'] },
  { to: '/parts', icon: 'box', label: 'Spare Parts', roles: ['admin', 'manager'] },
  { to: '/users', icon: 'users', label: 'Users & RBAC', roles: ['admin', 'manager'] },
  { to: '/audit', icon: 'shield-check', label: 'Audit Logs', roles: ['admin', 'manager'] },
];

// ── Layout shell ──────────────────────────────────────────────────────────────
// function Layout() {
//   const { user, logout, hasRole } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const pageTitle = {
//     '/': 'Dashboard',
//     '/assets': 'Asset Management',
//     '/work-orders': 'Work Orders',
//     '/maintenance': 'Maintenance Schedule',
//     '/parts': 'Spare Parts Inventory',
//     '/users': 'Users & RBAC',
//     '/audit': 'Audit Logs',
//   }[location.pathname] || 'AssetPro';

//   const initials = user?.name?.split(' ').map(w => w[0]).join('') || 'U';
//   const roleColor = { admin: 'var(--red)', manager: 'var(--amber)', technician: 'var(--teal)' }[user?.role] || 'var(--teal)';

//   return (
//     <div className="app">
//       {/* Sidebar */}
//       <aside className="sidebar">
//         <div className="sidebar-logo">
//           <div className="logo-box">
//             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F1923" strokeWidth="2.5">
//               <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
//               <rect x="3" y="13" width="8" height="8" rx="1" /><path d="M17 13v8M13 17h8" />
//             </svg>
//           </div>
//           <div>
//             <div style={{ fontSize: 14, fontWeight: 700 }}>AssetPro</div>
//             <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>EAM System</div>
//           </div>
//         </div>
//         <nav>
//           {NAV.filter(n => hasRole(...n.roles)).map(item => (
//             <NavLink key={item.to} to={item.to} end={item.end}
//               className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
//               <i className={`ti ti-${item.icon}`} style={{ fontSize: 16 }} />
//               {item.label}
//             </NavLink>
//           ))}
//         </nav>
//         {/* <div className="sidebar-user">
//           <div className="avatar" style={{background:`${roleColor}22`,color:roleColor}}>{initials}</div>
//           <div style={{flex:1,minWidth:0}}>
//             <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name}</div>
//             <div style={{fontSize:10,color:roleColor,textTransform:'capitalize'}}>{user?.role}</div>
//           </div>
//           <button onClick={() => { logout(); navigate('/login'); }}
//             title="Logout" style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:16}}>
//             <i className="ti ti-logout" />
//           </button>
//         </div> */}
//         <div className="sidebar-user" style={{ flexDirection: 'column', gap: 12 }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
//             <div className="avatar" style={{ background: `${roleColor}22`, color: roleColor }}>{initials}</div>
//             <div style={{ flex: 1, minWidth: 0 }}>
//               <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
//               <div style={{ fontSize: 10, color: roleColor, textTransform: 'capitalize' }}>{user?.role}</div>
//             </div>
//           </div>
//           {/* More obvious Logout Button */}
//           <button onClick={() => { logout(); navigate('/login'); }}
//             style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px', borderRadius: 8, border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
//             <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign Out
//           </button>
//         </div>
//       </aside>

//       {/* Main area */}
//       <div className="main">
//         <header className="topbar">
//           <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{pageTitle}</span>
//           <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: `${roleColor}20`, color: roleColor, fontWeight: 600, textTransform: 'capitalize' }}>
//             <i className={`ti ti-shield`} style={{ marginRight: 5 }} />{user?.role}
//           </span>
//         </header>
//         <div className="page-content">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// }

function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = {
    '/': 'Dashboard', '/assets': 'Asset Management', '/work-orders': 'Work Orders',
    '/maintenance': 'Maintenance Schedule', '/parts': 'Spare Parts Inventory',
    '/users': 'Users & RBAC', '/audit': 'Audit Logs',
  }[location.pathname] || 'AssetPro';

  const initials = user?.name?.split(' ').map(w => w[0]).join('') || 'U';
  const roleColor = { admin: 'var(--red)', manager: 'var(--amber)', technician: 'var(--teal)' }[user?.role] || 'var(--teal)';

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B1015" strokeWidth="2.5">
              <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
              <rect x="3" y="13" width="8" height="8" rx="1" /><path d="M17 13v8M13 17h8" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>AssetPro</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>Enterprise EAM</div>
          </div>
        </div>
        <nav>
          {NAV.filter(n => hasRole(...n.roles)).map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <i className={`ti ti-${item.icon}`} style={{ fontSize: 17 }} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user" style={{ flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div className="avatar" style={{ background: `${roleColor}15`, color: roleColor, borderRadius: 8 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: roleColor, textTransform: 'capitalize', fontWeight: 500 }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
            <i className="ti ti-logout" style={{ fontSize: 14 }} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span style={{ fontWeight: 600, fontSize: 16, flex: 1, letterSpacing: '-0.3px' }}>{pageTitle}</span>
          <span style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, background: `${roleColor}10`, color: roleColor, fontWeight: 600, textTransform: 'capitalize', border: `1px solid ${roleColor}20` }}>
            <i className="ti ti-shield" style={{ marginRight: 6, fontSize: 13 }} />{user?.role}
          </span>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

// ── Root app ──────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<DashboardPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="work-orders" element={<WorkOrdersPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="parts" element={<Protected roles={['admin', 'manager']}><PartsPage /></Protected>} />
        <Route path="users" element={<Protected roles={['admin', 'manager']}><UsersPage /></Protected>} />
        <Route path="audit" element={<Protected roles={['admin', 'manager']}><AuditPage /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
