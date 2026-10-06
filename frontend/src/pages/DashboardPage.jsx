import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api.js';

const MEDALS = ['🥇','🥈','🥉','4.','5.'];
const PIE_COLORS = ['#22C55E','#F59E0B','#8899A6','#EF4444'];

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{fontWeight:600,marginBottom:4}}>{label}</div>
      {payload.map(p => <div key={p.name} style={{color:p.fill||p.color}}>{p.name}: {p.value}</div>)}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [audit, setAudit]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/audit?limit=6'),
    ]).then(([d, a]) => {
      setData(d.data.data);
      setAudit(a.data.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'var(--muted)'}}>
      <i className="ti ti-loader spinner" style={{fontSize:28,color:'var(--teal)'}} />
    </div>
  );

  const a  = data?.assets      || {};
  const wo = data?.workOrders  || {};

  const woBar = [
    { name:'Open',       value: wo.open       || 0, fill:'#3B82F6' },
    { name:'In Progress',value: wo.inProgress || 0, fill:'#F59E0B' },
    { name:'Completed',  value: wo.completed  || 0, fill:'#22C55E' },
  ];
  const assetPie = [
    { name:'Active',      value: a.active      || 0 },
    { name:'Maintenance', value: a.maintenance || 0 },
    { name:'Inactive',    value: a.inactive    || 0 },
  ];
  const ACTION_COLOR = { CREATE:'var(--teal)', UPDATE:'var(--blue)', COMPLETE:'var(--green)', DEDUCT:'var(--amber)', ADJUST:'var(--amber)', RETIRE:'var(--muted)' };

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-tools" style={{marginRight:6}} />Total Assets</div>
          <div className="kpi-value" style={{color:'var(--teal)'}}>{a.total || 0}</div>
          <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{a.active||0} active</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-clipboard-list" style={{marginRight:6}} />Open Work Orders</div>
          <div className="kpi-value" style={{color:'var(--amber)'}}>{wo.open || 0}</div>
          <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{wo.inProgress||0} in progress</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-alert-triangle" style={{marginRight:6}} />Maintenance Due</div>
          <div className="kpi-value" style={{color:'var(--red)'}}>{data?.maintenanceDueCount || 0}</div>
          <div style={{fontSize:11,color:'var(--red)',marginTop:4}}>Threshold exceeded</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><i className="ti ti-box" style={{marginRight:6}} />Low Stock Parts</div>
          <div className="kpi-value" style={{color:'var(--amber)'}}>{data?.lowStockCount || 0}</div>
          <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>Below reorder point</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-header">
            <i className="ti ti-chart-bar" style={{color:'var(--blue)'}} />
            <span className="card-title">Work Orders by Status</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={woBar} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="name" tick={{fill:'#8899A6',fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#8899A6',fontSize:11}} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="value" radius={[4,4,0,0]} name="Count">
                  {woBar.map((e,i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <i className="ti ti-chart-donut" style={{color:'var(--teal)'}} />
            <span className="card-title">Asset Status Breakdown</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={assetPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}>
                  {assetPie.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Legend iconSize={8} formatter={v => <span style={{color:'var(--muted)',fontSize:11}}>{v}</span>} />
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Techs + Monthly + Audit feed */}
      <div className="grid-3">
        {/* Top Technicians — GROUP BY SQL */}
        <div className="card">
          <div className="card-header">
            <i className="ti ti-trophy" style={{color:'var(--amber)'}} />
            <span className="card-title">Top Technicians</span>
            <span className="card-sub">GROUP BY query</span>
          </div>
          <div className="card-body" style={{padding:'8px 20px'}}>
            {(data?.topTechnicians || []).map((t, i) => (
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:i<4?'1px solid var(--border)':'none'}}>
                <span style={{fontSize:14,width:20,textAlign:'center'}}>{MEDALS[i]}</span>
                <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(0,212,170,.15)',color:'var(--teal)',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {t.name?.split(' ').map(w=>w[0]).join('')}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600}}>{t.name}</div>
                  <div style={{fontSize:10,color:'var(--muted)'}}>{t.department}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'monospace',fontSize:12,fontWeight:700,color:'var(--teal)'}}>{t.completed_count}</div>
                  <div style={{fontSize:10,color:'var(--muted)'}}>done</div>
                </div>
              </div>
            ))}
            {!data?.topTechnicians?.length && <div style={{color:'var(--muted)',fontSize:12,textAlign:'center',padding:'16px 0'}}>No data yet</div>}
          </div>
        </div>

        {/* Monthly completions */}
        <div className="card">
          <div className="card-header">
            <i className="ti ti-trending-up" style={{color:'var(--green)'}} />
            <span className="card-title">Monthly Completions</span>
          </div>
          <div className="card-body">
            {(data?.monthlyCompletions || []).length ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={data.monthlyCompletions} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" vertical={false} />
                  <XAxis dataKey="month" tick={{fill:'#8899A6',fontSize:10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:'#8899A6',fontSize:10}} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="completed" fill="#22C55E" radius={[3,3,0,0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{color:'var(--muted)',fontSize:12,textAlign:'center',padding:'32px 0'}}>Complete some work orders to see trends</div>
            )}
          </div>
        </div>

        {/* Recent audit feed */}
        <div className="card">
          <div className="card-header">
            <i className="ti ti-activity" style={{color:'var(--teal)'}} />
            <span className="card-title">Recent Activity</span>
          </div>
          <div className="card-body" style={{padding:'8px 20px'}}>
            {audit.map((a,i) => (
              <div key={a.id} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:i<audit.length-1?'1px solid var(--border)':'none',alignItems:'flex-start'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:ACTION_COLOR[a.action]||'var(--muted)',marginTop:5,flexShrink:0}} />
                <div style={{flex:1,fontSize:11}}>
                  <span style={{color:'var(--teal)',fontWeight:600}}>{a.user_name}</span>
                  {' '}{a.action.toLowerCase()}d{' '}
                  <span style={{color:'var(--text)'}}>{a.entity_type?.replace('_',' ')}</span>
                  {a.field_name && (
                    <span style={{color:'var(--muted)'}}> · {a.field_name}: </span>
                  )}
                  {a.old_value && <span style={{color:'#F87171'}}>{a.old_value}</span>}
                  {a.new_value && <><span style={{color:'var(--muted)'}}> → </span><span style={{color:'var(--teal)'}}>{a.new_value}</span></>}
                </div>
                <div style={{fontSize:10,color:'var(--muted)',whiteSpace:'nowrap'}}>
                  {new Date(a.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
            ))}
            {!audit.length && <div style={{color:'var(--muted)',fontSize:12,textAlign:'center',padding:'16px 0'}}>No audit events yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
