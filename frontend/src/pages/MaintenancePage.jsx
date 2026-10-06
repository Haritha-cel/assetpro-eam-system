import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { showToast } from '../App.jsx';

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

export default function MaintenancePage() {
  const { hasRole } = useAuth();
  const [assets,  setAssets]  = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/assets'),
      api.get('/assets/maintenance-due'),
    ]).then(([a, d]) => {
      setAssets(a.data.data);
      setOverdue(d.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const createWO = async (asset) => {
    try {
      await api.post('/work-orders', {
        title:       `Scheduled ${asset.interval_hours}h service — ${asset.name}`,
        assetId:     asset.id,
        priority:    'high',
        woType:      'preventive',
        description: `Preventive maintenance triggered — asset has exceeded the ${asset.interval_hours}h service interval.`,
      });
      showToast(`Work order created for ${asset.name}`);
    } catch(e) { showToast(e.response?.data?.message||'Failed','error'); }
  };

  const nearDue   = assets.filter(a=>{ const p=parseFloat(a.maintenance_pct)||0; return p>70&&p<100; }).length;
  const onSchedule= assets.filter(a=>{ const p=parseFloat(a.maintenance_pct)||0; return p<=70; }).length;

  return (
    <div>
      {overdue.length > 0 && (
        <div className="alert-banner">
          <i className="ti ti-alert-triangle" style={{fontSize:20,color:'var(--red)',flexShrink:0}} />
          <div>
            <div style={{fontWeight:600,color:'var(--red)'}}>{overdue.length} asset{overdue.length>1?'s':''} require immediate maintenance</div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>Service interval exceeded — every 500 running hours</div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-alert-triangle" style={{marginRight:6}} />Overdue</div>
          <div className="kpi-value" style={{color:'var(--red)'}}>{overdue.length}</div>
          <div style={{fontSize:11,color:'var(--red)',marginTop:4}}>Threshold exceeded</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-clock" style={{marginRight:6}} />Due Soon</div>
          <div className="kpi-value" style={{color:'var(--amber)'}}>{nearDue}</div>
          <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>&gt;70% of interval used</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-check" style={{marginRight:6}} />On Schedule</div>
          <div className="kpi-value" style={{color:'var(--green)'}}>{onSchedule}</div>
          <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>Below 70% threshold</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <i className="ti ti-calendar-stats" style={{color:'var(--teal)'}} />
          <span className="card-title">Maintenance Threshold Tracker</span>
          <span className="card-sub">Service interval: every 500 running hours</span>
        </div>
        {loading
          ? <div style={{textAlign:'center',padding:48}}><i className="ti ti-loader spinner" style={{fontSize:24,color:'var(--teal)'}} /></div>
          : <table>
              <thead><tr>
                <th>Asset</th><th>Last Service</th><th>Current Hours</th>
                <th>Interval</th><th>Until Next</th><th>Progress</th><th>Status</th><th>Action</th>
              </tr></thead>
              <tbody>
                {assets.map(a => {
                  const pct = parseFloat(a.maintenance_pct)||0;
                  const rem = parseFloat(a.hours_until_service);
                  const barColor = rem<=0?'var(--red)':pct>60?'var(--amber)':'var(--teal)';
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{fontWeight:600,fontSize:13}}>{a.name}</div>
                        <div className="mono" style={{color:'var(--muted)'}}>{a.asset_code}</div>
                      </td>
                      <td>
                        <span className="mono" style={{fontSize:11}}>{Number(a.last_service_hours||0).toLocaleString()}h</span>
                        {a.last_service_date&&<div style={{fontSize:10,color:'var(--muted)'}}>{new Date(a.last_service_date).toLocaleDateString()}</div>}
                      </td>
                      <td><span className="mono">{Number(a.running_hours||0).toLocaleString()}h</span></td>
                      <td><span className="mono" style={{fontSize:11}}>{a.interval_hours||'—'}h</span></td>
                      <td>
                        {rem<=0
                          ? <span style={{color:'var(--red)',fontWeight:700,fontSize:12}}>OVERDUE {Math.abs(Math.round(rem))}h</span>
                          : rem<100
                            ? <span style={{color:'var(--amber)',fontWeight:600,fontSize:12}}>+{Math.round(rem)}h</span>
                            : <span style={{color:'var(--green)',fontSize:12}}>+{Math.round(rem)}h</span>}
                      </td>
                      <td style={{width:140}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <Ring pct={pct} />
                          <div className="stock-bar" style={{minWidth:60}}>
                            <div className="stock-bar-fill" style={{width:`${Math.min(pct,100)}%`,background:barColor}} />
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge b-${a.status}`}>{a.status?.charAt(0).toUpperCase()+a.status?.slice(1)}</span></td>
                      <td>
                        {hasRole('admin','manager') && (
                          <button className={`btn btn-sm${pct>=90?' btn-danger':''}`} onClick={()=>createWO(a)}>
                            <i className="ti ti-plus" /> WO
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
    </div>
  );
}
