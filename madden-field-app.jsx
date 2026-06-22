import { useState, useEffect, useRef } from "react";

// ── THEME ──────────────────────────────────────────────────────────────────
const T = {
  gold: "#C8973A",
  goldLight: "#E8B84B",
  goldDark: "#8B6520",
  bg: "#0F0F0D",
  surface: "#161614",
  card: "#1C1C19",
  border: "#2A2A25",
  borderGold: "#3A3020",
  text: "#F0EBE0",
  textMuted: "#888880",
  textDim: "#555550",
  red: "#E05A3A",
  orange: "#E07A3A",
  green: "#4CAF7A",
  blue: "#4A8FC8",
  purple: "#8A6CC8",
};

const STATUS = {
  Active:         { bg:"#2A1F0A", text:"#E8B84B", dot:"#C8973A" },
  "Estimate Sent":{ bg:"#0A1525", text:"#4A8FC8", dot:"#3A7AB8" },
  Completed:      { bg:"#0A1F12", text:"#4CAF7A", dot:"#3A9F6A" },
  Lead:           { bg:"#1A0A2A", text:"#8A6CC8", dot:"#7A5CB8" },
};

const PRIORITY = {
  "MUST FINISH TODAY": { color: T.red,    label:"🔴 MUST FINISH TODAY" },
  "HIGH PRIORITY":     { color: T.orange, label:"🟠 HIGH PRIORITY" },
  "NORMAL":            { color: T.text,   label:"⚪ NORMAL" },
  "WHEN TIME ALLOWS":  { color: T.textDim,label:"⚫ WHEN TIME ALLOWS" },
};

// ── SAMPLE DATA ─────────────────────────────────────────────────────────────
const INIT_WORKERS = [
  { id:1, name:"Mike Caruso",    role:"Lead Carpenter", phone:"609-555-0101", access:"supervisor", active:true },
  { id:2, name:"Justin Reyes",   role:"Carpenter",      phone:"609-555-0102", access:"worker",     active:true },
  { id:3, name:"Dave Pinto",     role:"Laborer",        phone:"609-555-0103", access:"worker",     active:true },
  { id:4, name:"Carlos Mendez",  role:"Carpenter",      phone:"609-555-0104", access:"worker",     active:true },
];

const INIT_JOBS = [
  { id:1, client:"Tom & Lisa Brennan", address:"4412 Landis Ave, Sea Isle City", type:"Kitchen Remodel",
    status:"Active", start:"2026-03-10", end:"2026-05-15", estimate:48500, billed:24250,
    notes:"Custom cabinets ordered. Tile sub scheduled week of 4/28.", workers:[1,2] },
  { id:2, client:"Robert Piazza", address:"209 JFK Blvd, Sea Isle City", type:"Deck & Siding",
    status:"Estimate Sent", start:"2026-05-01", end:"2026-06-10", estimate:31200, billed:0,
    notes:"Fiberglass deck + PVC trim. Awaiting signed contract.", workers:[3] },
  { id:3, client:"Carol Weston", address:"717 Central Ave, Sea Isle City", type:"Bathroom Renovation",
    status:"Completed", start:"2026-01-08", end:"2026-02-28", estimate:22800, billed:22800,
    notes:"Full gut reno. Final walkthrough done.", workers:[] },
  { id:4, client:"Frank & Diane Morrow", address:"54 42nd St, Sea Isle City", type:"Window & Door Replacement",
    status:"Lead", start:"", end:"", estimate:14600, billed:0,
    notes:"Referred by Brennan job. Called 4/18.", workers:[] },
];

const INIT_TASKS = [
  { id:1, jobId:1, workerId:1, text:"Frame out pantry wall", priority:"MUST FINISH TODAY", done:false, carriedOver:false, assignedBy:null },
  { id:2, jobId:1, workerId:1, text:"Install upper cabinet boxes — left wall", priority:"HIGH PRIORITY", done:false, carriedOver:false, assignedBy:null },
  { id:3, jobId:1, workerId:2, text:"Hang drywall — closet wall, second floor", priority:"MUST FINISH TODAY", done:false, carriedOver:true, assignedBy:null },
  { id:4, jobId:1, workerId:2, text:"Hang drywall — back bedroom wall", priority:"HIGH PRIORITY", done:false, carriedOver:true, assignedBy:null },
  { id:5, jobId:1, workerId:2, text:"Clean up second floor — sweep and stack scraps", priority:"NORMAL", done:false, carriedOver:false, assignedBy:1 },
  { id:6, jobId:2, workerId:3, text:"Demo existing deck boards", priority:"MUST FINISH TODAY", done:false, carriedOver:false, assignedBy:null },
];

const INIT_MATERIALS = [
  { id:1, jobId:1, workerId:2, item:"4 sheets 1/2\" drywall", qty:"4 sheets", urgent:true, ordered:false, date:"2026-04-21" },
  { id:2, jobId:1, workerId:1, item:"Box of 3\" cabinet screws", qty:"1 box", urgent:false, ordered:false, date:"2026-04-21" },
  { id:3, jobId:2, workerId:3, item:"Ledger board — 2x10x16", qty:"3 pieces", urgent:true, ordered:false, date:"2026-04-21" },
];

const INIT_TOOLS = [
  { id:1, name:"Framing Nailer #1",   tag:"MH-001", checkedOutBy:1, condition:"Good" },
  { id:2, name:"Framing Nailer #2",   tag:"MH-002", checkedOutBy:2, condition:"Good" },
  { id:3, name:"Miter Saw",           tag:"MH-003", checkedOutBy:1, condition:"Good" },
  { id:4, name:"Compressor — Large",  tag:"MH-004", checkedOutBy:3, condition:"Good" },
  { id:5, name:"Finish Nailer",       tag:"MH-005", checkedOutBy:2, condition:"Needs new tip" },
  { id:6, name:"Router Kit",          tag:"MH-006", checkedOutBy:null, condition:"Good" },
];

const INIT_CLOCKINS = [
  { id:1, workerId:1, jobId:1, clockIn:"6:48 AM", clockOut:null,   date:"2026-04-21", location:"4412 Landis Ave" },
  { id:2, workerId:2, jobId:1, clockIn:"6:52 AM", clockOut:null,   date:"2026-04-21", location:"4412 Landis Ave" },
  { id:3, workerId:3, jobId:2, clockIn:"7:05 AM", clockOut:null,   date:"2026-04-21", location:"209 JFK Blvd" },
  { id:4, workerId:4, jobId:1, clockIn:"7:22 AM", clockOut:"3:48 PM", date:"2026-04-20", location:"4412 Landis Ave" },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
const fmt$ = n => "$" + Number(n).toLocaleString();
const today = "2026-04-21";

function Badge({ status }) {
  const s = STATUS[status] || { bg:"#222", text:"#aaa", dot:"#aaa" };
  return (
    <span style={{ background:s.bg, color:s.text, borderRadius:20, padding:"3px 10px",
      fontSize:11, fontWeight:700, letterSpacing:0.5, display:"inline-flex", alignItems:"center", gap:5 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block" }}/>
      {status}
    </span>
  );
}

function PriorityTag({ p }) {
  const cfg = PRIORITY[p] || PRIORITY["NORMAL"];
  return <span style={{ color:cfg.color, fontSize:11, fontWeight:700 }}>{cfg.label}</span>;
}

function Card({ children, style }) {
  return <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:20, ...style }}>{children}</div>;
}

function Btn({ children, onClick, variant="primary", style, disabled }) {
  const base = { border:"none", borderRadius:7, padding:"9px 18px", fontSize:13,
    fontWeight:700, cursor:disabled?"not-allowed":"pointer", letterSpacing:0.4, transition:"opacity .15s", opacity:disabled?0.4:1 };
  const variants = {
    primary:  { background:T.gold, color:"#111" },
    ghost:    { background:"transparent", color:T.textMuted, border:`1px solid ${T.border}` },
    danger:   { background:"#3A1A1A", color:T.red, border:`1px solid #4A2020` },
    success:  { background:"#0A2A18", color:T.green, border:`1px solid #1A4A28` },
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...variants[variant],...style}}>{children}</button>;
}

function SectionHead({ title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
      <div style={{ flex:1, height:1, background:T.border }}/>
      <span style={{ color:T.gold, fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>{title}</span>
      <div style={{ flex:1, height:1, background:T.border }}/>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]             = useState("boss"); // boss | worker
  const [bossTab, setBossTab]       = useState("dashboard");
  const [workerView, setWorkerView] = useState("select"); // select | main
  const [activeWorker, setActiveWorker] = useState(null);
  const [workerTab, setWorkerTab]   = useState("tasks");

  const [jobs, setJobs]             = useState(INIT_JOBS);
  const [workers]                   = useState(INIT_WORKERS);
  const [tasks, setTasks]           = useState(INIT_TASKS);
  const [materials, setMaterials]   = useState(INIT_MATERIALS);
  const [tools, setTools]           = useState(INIT_TOOLS);
  const [clockIns, setClockIns]     = useState(INIT_CLOCKINS);
  const [selectedJob, setSelectedJob] = useState(null);

  // Wrap-up state
  const [wrapupOpen, setWrapupOpen] = useState(false);
  const [wrapupStep, setWrapupStep] = useState(0);
  const [wrapupData, setWrapupData] = useState({ doneTasks:[], leftover:"", materialsNeeded:"", toolsNeeded:"", orderSchedule:"", cleanChecks:{}, confirmed:false });

  const todayClockIns = clockIns.filter(c => c.date === today);
  const onSite = todayClockIns.filter(c => !c.clockOut);
  const pendingMaterials = materials.filter(m => !m.ordered);
  const myTasks = activeWorker ? tasks.filter(t => t.workerId === activeWorker.id) : [];
  const myJob = activeWorker ? jobs.find(j => j.id === (myTasks[0]?.jobId)) : null;

  // ── BOSS SIDE ──────────────────────────────────────────────────────────────
  if (view === "boss") {
    const BOSS_TABS = ["dashboard","jobs","workers","materials","tools","schedule"];

    return (
      <div style={{ fontFamily:"'Georgia',serif", background:T.bg, minHeight:"100vh", color:T.text }}>
        {/* Top Bar */}
        <div style={{ background:T.surface, borderBottom:`2px solid ${T.gold}`, padding:"0 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between", height:60, position:"sticky", top:0, zIndex:50 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, background:T.gold, borderRadius:6,
              display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#111", fontSize:18 }}>M</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:T.gold, letterSpacing:1.5, textTransform:"uppercase" }}>Madden Homes</div>
              <div style={{ fontSize:10, color:T.textDim, letterSpacing:1 }}>FIELD APP — BOSS VIEW</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:11, color:T.textMuted }}>📍 Sea Isle City Ops</span>
            <Btn variant="ghost" onClick={() => setView("worker")} style={{ fontSize:11, padding:"6px 12px" }}>
              Switch to Crew View →
            </Btn>
          </div>
        </div>

        <div style={{ display:"flex" }}>
          {/* Sidebar */}
          <div style={{ width:180, background:T.surface, minHeight:"calc(100vh - 60px)",
            borderRight:`1px solid ${T.border}`, padding:"20px 0", flexShrink:0, position:"sticky", top:60, height:"calc(100vh - 60px)", overflowY:"auto" }}>
            {BOSS_TABS.map(tab => (
              <div key={tab} onClick={() => setBossTab(tab)} style={{
                padding:"10px 20px", cursor:"pointer", fontSize:12, letterSpacing:1,
                textTransform:"uppercase", fontFamily:"'Georgia',serif",
                background: bossTab===tab ? "#1F1F1C" : "transparent",
                color: bossTab===tab ? T.gold : T.textMuted,
                borderLeft: bossTab===tab ? `3px solid ${T.gold}` : "3px solid transparent",
                transition:"all .15s",
              }}>
                {{ dashboard:"📊 Dashboard", jobs:"🏗 Jobs", workers:"👷 Workers",
                   materials:"📦 Materials", tools:"🔧 Tools", schedule:"📅 Schedule" }[tab]}
              </div>
            ))}

            {/* Quick stats */}
            <div style={{ margin:"24px 12px 0", padding:14, background:T.card, borderRadius:8, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:10, color:T.textDim, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>On Site Today</div>
              <div style={{ fontSize:28, fontWeight:700, color:T.gold }}>{onSite.length}</div>
              <div style={{ fontSize:10, color:T.textDim, marginTop:4 }}>of {workers.filter(w=>w.active).length} workers</div>
            </div>
            <div style={{ margin:"10px 12px 0", padding:14, background:T.card, borderRadius:8, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:10, color:T.textDim, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Pending Requests</div>
              <div style={{ fontSize:28, fontWeight:700, color: pendingMaterials.length>0 ? T.red : T.green }}>{pendingMaterials.length}</div>
              <div style={{ fontSize:10, color:T.textDim, marginTop:4 }}>material items</div>
            </div>
          </div>

          {/* Main */}
          <div style={{ flex:1, padding:28, overflowY:"auto", maxHeight:"calc(100vh - 60px)" }}>

            {/* DASHBOARD */}
            {bossTab === "dashboard" && (
              <div>
                <h2 style={{ fontSize:22, color:T.gold, fontWeight:"normal", letterSpacing:1, marginBottom:4 }}>Good Morning, Mark</h2>
                <p style={{ color:T.textMuted, fontSize:13, marginBottom:24 }}>Tuesday, April 21, 2026 — Here's your day at a glance</p>

                {/* Stat cards */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
                  {[
                    { label:"Active Jobs", value:jobs.filter(j=>j.status==="Active").length, sub:"in progress", color:T.gold },
                    { label:"On Site Now", value:onSite.length, sub:"workers clocked in", color:T.green },
                    { label:"Material Requests", value:pendingMaterials.length, sub:"need pickup", color:pendingMaterials.length>2?T.red:T.orange },
                    { label:"Active Value", value:fmt$(jobs.filter(j=>j.status==="Active").reduce((s,j)=>s+j.estimate,0)), sub:"in active jobs", color:T.text },
                  ].map(s => (
                    <Card key={s.label}>
                      <div style={{ fontSize:10, color:T.textDim, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{s.label}</div>
                      <div style={{ fontSize:26, fontWeight:700, color:s.color }}>{s.value}</div>
                      <div style={{ fontSize:10, color:T.textDim, marginTop:4 }}>{s.sub}</div>
                    </Card>
                  ))}
                </div>

                {/* Who's on site */}
                <SectionHead title="Who's On Site Today"/>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:28 }}>
                  {workers.filter(w=>w.active).map(w => {
                    const ci = todayClockIns.find(c => c.workerId === w.id);
                    const wtasks = tasks.filter(t => t.workerId===w.id && !t.done);
                    return (
                      <Card key={w.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{w.name}</div>
                          <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{w.role}</div>
                          {ci && <div style={{ fontSize:11, color:T.green, marginTop:6 }}>✓ Clocked in {ci.clockIn} — {ci.location}</div>}
                          {!ci && <div style={{ fontSize:11, color:T.red, marginTop:6 }}>✗ Not clocked in today</div>}
                          <div style={{ fontSize:11, color:T.textDim, marginTop:4 }}>{wtasks.length} open tasks</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          {wtasks.filter(t=>t.priority==="MUST FINISH TODAY").length > 0 &&
                            <div style={{ fontSize:10, color:T.red, fontWeight:700 }}>
                              {wtasks.filter(t=>t.priority==="MUST FINISH TODAY").length} MUST FINISH
                            </div>}
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Material requests */}
                {pendingMaterials.length > 0 && <>
                  <SectionHead title="Today's Material Pickup List"/>
                  <Card style={{ marginBottom:28 }}>
                    {pendingMaterials.map((m,i) => {
                      const w = workers.find(x=>x.id===m.workerId);
                      const j = jobs.find(x=>x.id===m.jobId);
                      return (
                        <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                          padding:"10px 0", borderBottom: i<pendingMaterials.length-1?`1px solid ${T.border}`:"none" }}>
                          <div>
                            <span style={{ fontWeight:700, color:T.text, fontSize:13 }}>{m.item}</span>
                            <span style={{ color:T.textMuted, fontSize:12, marginLeft:8 }}>{m.qty}</span>
                            {m.urgent && <span style={{ marginLeft:8, background:"#3A0A0A", color:T.red, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>URGENT</span>}
                            <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>Requested by {w?.name} — {j?.client}</div>
                          </div>
                          <Btn variant="success" style={{ fontSize:11, padding:"5px 12px" }}
                            onClick={() => setMaterials(prev => prev.map(x => x.id===m.id?{...x,ordered:true}:x))}>
                            Mark Ordered
                          </Btn>
                        </div>
                      );
                    })}
                  </Card>
                </>}

                {/* Jobs overview */}
                <SectionHead title="All Jobs"/>
                <JobsTable jobs={jobs} onSelect={setSelectedJob}/>
              </div>
            )}

            {/* JOBS TAB */}
            {bossTab === "jobs" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                  <div>
                    <h2 style={{ fontSize:22, color:T.gold, fontWeight:"normal", letterSpacing:1, marginBottom:4 }}>Jobs</h2>
                    <p style={{ color:T.textMuted, fontSize:13 }}>All active, pending, and completed jobs</p>
                  </div>
                  <Btn>+ New Job</Btn>
                </div>
                <JobsTable jobs={jobs} onSelect={setSelectedJob}/>
              </div>
            )}

            {/* WORKERS TAB */}
            {bossTab === "workers" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                  <h2 style={{ fontSize:22, color:T.gold, fontWeight:"normal", letterSpacing:1 }}>Workers</h2>
                  <Btn>+ Add Worker</Btn>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
                  {workers.map(w => {
                    const ci = todayClockIns.find(c=>c.workerId===w.id);
                    const wtasks = tasks.filter(t=>t.workerId===w.id);
                    const done = wtasks.filter(t=>t.done).length;
                    return (
                      <Card key={w.id}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:15 }}>{w.name}</div>
                            <div style={{ fontSize:12, color:T.textMuted }}>{w.role}</div>
                            <div style={{ fontSize:11, color:T.textDim, marginTop:2 }}>{w.phone}</div>
                          </div>
                          <span style={{ background: w.access==="supervisor"?"#1A1A2A":"#1A2A1A",
                            color: w.access==="supervisor"?T.purple:T.green,
                            fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:10, height:"fit-content" }}>
                            {w.access.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <div style={{ flex:1, background:T.surface, borderRadius:6, padding:"8px 12px" }}>
                            <div style={{ fontSize:10, color:T.textDim, marginBottom:3 }}>TODAY</div>
                            <div style={{ fontSize:12, color: ci?T.green:T.red }}>{ci ? `✓ In at ${ci.clockIn}` : "✗ Not on site"}</div>
                          </div>
                          <div style={{ flex:1, background:T.surface, borderRadius:6, padding:"8px 12px" }}>
                            <div style={{ fontSize:10, color:T.textDim, marginBottom:3 }}>TASKS</div>
                            <div style={{ fontSize:12, color:T.text }}>{done}/{wtasks.length} done</div>
                          </div>
                        </div>
                        <div style={{ marginTop:10 }}>
                          {wtasks.filter(t=>!t.done).slice(0,2).map(t => (
                            <div key={t.id} style={{ fontSize:11, color:T.textMuted, padding:"4px 0",
                              borderTop:`1px solid ${T.border}`, display:"flex", gap:6, alignItems:"center" }}>
                              {t.carriedOver && <span style={{ color:T.orange, fontSize:10 }}>↪</span>}
                              <PriorityTag p={t.priority}/>
                              <span style={{ marginLeft:4 }}>{t.text}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MATERIALS TAB */}
            {bossTab === "materials" && (
              <div>
                <h2 style={{ fontSize:22, color:T.gold, fontWeight:"normal", letterSpacing:1, marginBottom:24 }}>Material & Supply Requests</h2>
                <Card style={{ marginBottom:20 }}>
                  <div style={{ fontSize:12, color:T.textMuted, marginBottom:16 }}>
                    All requests submitted by crew — consolidated into one pickup list for you.
                  </div>
                  {materials.map((m,i) => {
                    const w = workers.find(x=>x.id===m.workerId);
                    const j = jobs.find(x=>x.id===m.jobId);
                    return (
                      <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                        padding:"12px 0", borderBottom: i<materials.length-1?`1px solid ${T.border}`:"none",
                        opacity: m.ordered?0.4:1 }}>
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontWeight:700, fontSize:13 }}>{m.item}</span>
                            <span style={{ color:T.textMuted, fontSize:12 }}>— {m.qty}</span>
                            {m.urgent && !m.ordered && <span style={{ background:"#3A0A0A", color:T.red, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>URGENT</span>}
                            {m.ordered && <span style={{ background:"#0A2A18", color:T.green, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 }}>✓ ORDERED</span>}
                          </div>
                          <div style={{ fontSize:11, color:T.textDim, marginTop:3 }}>
                            {w?.name} · {j?.client} · {j?.address}
                          </div>
                          <div style={{ fontSize:10, color:T.textDim }}>{m.date}</div>
                        </div>
                        {!m.ordered &&
                          <Btn variant="success" style={{ fontSize:11, padding:"5px 12px" }}
                            onClick={() => setMaterials(prev=>prev.map(x=>x.id===m.id?{...x,ordered:true}:x))}>
                            Mark Ordered
                          </Btn>}
                      </div>
                    );
                  })}
                </Card>
              </div>
            )}

            {/* TOOLS TAB */}
            {bossTab === "tools" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                  <h2 style={{ fontSize:22, color:T.gold, fontWeight:"normal", letterSpacing:1 }}>Tool Tracker</h2>
                  <Btn>+ Add Tool</Btn>
                </div>
                <Card>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                        {["Tool","Tag","Checked Out To","Condition",""].map(h => (
                          <th key={h} style={{ padding:"8px 12px", textAlign:"left", color:T.textDim,
                            fontSize:10, letterSpacing:1, textTransform:"uppercase", fontWeight:"normal" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tools.map(tool => {
                        const w = workers.find(x=>x.id===tool.checkedOutBy);
                        return (
                          <tr key={tool.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                            <td style={{ padding:"11px 12px", fontWeight:700 }}>{tool.name}</td>
                            <td style={{ padding:"11px 12px", color:T.textMuted, fontFamily:"monospace" }}>{tool.tag}</td>
                            <td style={{ padding:"11px 12px", color: w?T.text:T.textDim }}>{w?.name || "— In shop"}</td>
                            <td style={{ padding:"11px 12px" }}>
                              <span style={{ color: tool.condition==="Good"?T.green:T.orange, fontSize:11 }}>
                                {tool.condition==="Good"?"✓ Good":"⚠ "+tool.condition}
                              </span>
                            </td>
                            <td style={{ padding:"11px 12px" }}>
                              <Btn variant="ghost" style={{ fontSize:10, padding:"4px 10px" }}>Edit</Btn>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}

            {/* SCHEDULE TAB */}
            {bossTab === "schedule" && (
              <div>
                <h2 style={{ fontSize:22, color:T.gold, fontWeight:"normal", letterSpacing:1, marginBottom:24 }}>Schedule & Reminders</h2>
                <Card style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, color:T.textMuted, marginBottom:16, fontWeight:700 }}>Automatic Daily Reminders (AI-Powered)</div>
                  {[
                    { time:"7:00 AM", msg:"All workers: Submit your material list by 4pm today. Make it complete — no add-ons later.", days:"Mon–Fri" },
                    { time:"12:00 PM", msg:"Midday check-in — confirm you are still on site.", days:"Mon–Fri" },
                    { time:"3:30 PM", msg:"End of day wrap-up is now open. Complete it before you clock out.", days:"Mon–Fri" },
                    { time:"4:45 PM", msg:"30 minutes until clock-out. Any incomplete wrap-up items will be flagged.", days:"Mon–Fri" },
                    { time:"Friday 3:00 PM", msg:"Weekly deep clean checklist is now active. Complete before clock-out.", days:"Fri only" },
                    { time:"Monday 7:00 AM", msg:"Tool check-out required this morning. Log what tools you have.", days:"Mon only" },
                  ].map((r,i) => (
                    <div key={i} style={{ display:"flex", gap:16, padding:"10px 0",
                      borderBottom: i<5?`1px solid ${T.border}`:"none" }}>
                      <div style={{ width:120, flexShrink:0 }}>
                        <div style={{ fontSize:12, color:T.gold, fontWeight:700 }}>{r.time}</div>
                        <div style={{ fontSize:10, color:T.textDim }}>{r.days}</div>
                      </div>
                      <div style={{ fontSize:12, color:T.textMuted }}>{r.msg}</div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <div style={{ fontSize:13, color:T.textMuted, marginBottom:16, fontWeight:700 }}>Upcoming Job Milestones</div>
                  {jobs.filter(j=>j.end).map(j => (
                    <div key={j.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0",
                      borderBottom:`1px solid ${T.border}` }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:13 }}>{j.client}</span>
                        <span style={{ color:T.textMuted, fontSize:12, marginLeft:8 }}>{j.type}</span>
                      </div>
                      <div style={{ fontSize:12, color:T.textMuted }}>Target complete: {j.end}</div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Job detail modal */}
        {selectedJob && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)",
            display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}
            onClick={()=>setSelectedJob(null)}>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12,
              width:560, maxHeight:"85vh", overflowY:"auto", padding:32, position:"relative" }}
              onClick={e=>e.stopPropagation()}>
              <button onClick={()=>setSelectedJob(null)} style={{ position:"absolute", top:16, right:16,
                background:"none", border:"none", color:T.textMuted, fontSize:20, cursor:"pointer" }}>✕</button>
              <Badge status={selectedJob.status}/>
              <h2 style={{ color:T.gold, fontWeight:"normal", fontSize:20, margin:"10px 0 4px" }}>{selectedJob.client}</h2>
              <p style={{ color:T.textMuted, fontSize:13, margin:"0 0 20px" }}>{selectedJob.address}</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                {[
                  ["Job Type", selectedJob.type], ["Estimate", fmt$(selectedJob.estimate)],
                  ["Start", selectedJob.start||"TBD"], ["End", selectedJob.end||"TBD"],
                  ["Billed", fmt$(selectedJob.billed)], ["Balance", fmt$(selectedJob.estimate-selectedJob.billed)],
                ].map(([l,v]) => (
                  <div key={l} style={{ background:T.surface, borderRadius:6, padding:"10px 14px" }}>
                    <div style={{ fontSize:10, color:T.textDim, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>{l}</div>
                    <div style={{ fontSize:14 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:T.surface, borderRadius:6, padding:"12px 14px", marginBottom:16 }}>
                <div style={{ fontSize:10, color:T.textDim, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Notes</div>
                <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.6 }}>{selectedJob.notes}</div>
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, color:T.textDim, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Open Tasks</div>
                {tasks.filter(t=>t.jobId===selectedJob.id&&!t.done).map(t => {
                  const w = workers.find(x=>x.id===t.workerId);
                  return (
                    <div key={t.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0",
                      borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        {t.carriedOver && <span style={{ color:T.orange }}>↪</span>}
                        <PriorityTag p={t.priority}/>
                        <span style={{ marginLeft:4, color:T.text }}>{t.text}</span>
                      </div>
                      <span style={{ color:T.textDim }}>{w?.name}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                {["Estimate","Change Order","Contract"].map(b => (
                  <Btn key={b} variant="ghost" style={{ flex:1, fontSize:11, padding:"8px 0" }}>{b}</Btn>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── WORKER SIDE ────────────────────────────────────────────────────────────
  const CREW_TABS = ["tasks","checkin","materials","tools","wrapup"];

  // Worker select screen
  if (view === "worker" && workerView === "select") {
    return (
      <div style={{ fontFamily:"'Georgia',serif", background:T.bg, minHeight:"100vh", color:T.text,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ width:44, height:44, background:T.gold, borderRadius:8, display:"flex",
          alignItems:"center", justifyContent:"center", fontWeight:900, color:"#111", fontSize:22, marginBottom:16 }}>M</div>
        <div style={{ fontSize:18, color:T.gold, fontWeight:700, letterSpacing:1, marginBottom:4 }}>MADDEN HOMES FIELD APP</div>
        <div style={{ fontSize:12, color:T.textMuted, marginBottom:32 }}>Who are you?</div>
        <div style={{ width:"100%", maxWidth:360, display:"flex", flexDirection:"column", gap:10 }}>
          {workers.filter(w=>w.active).map(w => (
            <div key={w.id} onClick={() => { setActiveWorker(w); setWorkerView("main"); setWorkerTab("tasks"); }}
              style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10,
                padding:"16px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center",
                transition:"border-color .15s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.gold}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{w.name}</div>
                <div style={{ fontSize:12, color:T.textMuted }}>{w.role}</div>
              </div>
              <span style={{ color:T.gold, fontSize:20 }}>→</span>
            </div>
          ))}
        </div>
        <Btn variant="ghost" onClick={()=>setView("boss")} style={{ marginTop:24, fontSize:11 }}>← Boss View</Btn>
      </div>
    );
  }

  // Worker main view
  const workerClockIn = activeWorker ? clockIns.find(c=>c.workerId===activeWorker.id&&c.date===today) : null;
  const canClockOut = workerTab !== "wrapup"; // simplified — real version checks all items

  // Wrap-up steps
  const CLEANUP_ITEMS = [
    "All tools put away and secured",
    "No tools or materials on homeowner's furniture",
    "All trash, bottles, cans, and food picked up",
    "All toilets flushed",
    "Work area swept or blown out",
    "Materials stacked neatly",
    "Doors and windows closed and locked",
  ];

  const wrapupSteps = [
    "Tasks Completed",
    "What's Left & Carries Over",
    "Materials Needed Tomorrow",
    "Tools Needed Tomorrow",
    "Orders / Schedule",
    "Cleanup Checklist",
    "Final Confirmation",
  ];

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:T.bg, minHeight:"100vh", color:T.text, maxWidth:500, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ background:T.surface, borderBottom:`2px solid ${T.gold}`, padding:"0 16px",
        display:"flex", alignItems:"center", justifyContent:"space-between", height:56, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, background:T.gold, borderRadius:5,
            display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#111", fontSize:16 }}>M</div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.gold, letterSpacing:1 }}>MADDEN HOMES</div>
            <div style={{ fontSize:10, color:T.textDim }}>{activeWorker?.name}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {workerClockIn && !workerClockIn.clockOut &&
            <span style={{ fontSize:10, color:T.green, fontWeight:700 }}>● ON SITE</span>}
          <Btn variant="ghost" onClick={()=>{setWorkerView("select");setActiveWorker(null);}} style={{ fontSize:10, padding:"5px 10px" }}>
            ← Switch
          </Btn>
        </div>
      </div>

      {/* Clock In/Out Bar */}
      <div style={{ background:"#0A1A10", borderBottom:`1px solid #1A3A20`, padding:"12px 16px",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          {workerClockIn
            ? <div style={{ fontSize:12, color:T.green }}>✓ Clocked in at {workerClockIn.clockIn} — {workerClockIn.location}</div>
            : <div style={{ fontSize:12, color:T.textMuted }}>You are not clocked in yet</div>}
          <div style={{ fontSize:10, color:T.textDim, marginTop:2 }}>{myJob ? myJob.client + " — " + myJob.address : "No job assigned"}</div>
        </div>
        {!workerClockIn
          ? <Btn variant="success" style={{ fontSize:12, padding:"8px 16px" }}
              onClick={() => setClockIns(prev=>[...prev,{id:Date.now(),workerId:activeWorker.id,jobId:myTasks[0]?.jobId,clockIn:"Now",clockOut:null,date:today,location:myJob?.address||"Job Site"}])}>
              CLOCK IN 📍
            </Btn>
          : !workerClockIn.clockOut
            ? <Btn variant="danger" style={{ fontSize:12, padding:"8px 16px" }}
                onClick={() => setWorkerTab("wrapup")}>
                CLOCK OUT
              </Btn>
            : <span style={{ fontSize:11, color:T.textDim }}>Clocked out {workerClockIn.clockOut}</span>}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", background:T.surface, borderBottom:`1px solid ${T.border}`, overflowX:"auto" }}>
        {CREW_TABS.map(tab => (
          <div key={tab} onClick={()=>setWorkerTab(tab)} style={{
            padding:"11px 14px", cursor:"pointer", fontSize:11, fontWeight:700,
            letterSpacing:0.8, textTransform:"uppercase", whiteSpace:"nowrap",
            color: workerTab===tab?T.gold:T.textMuted,
            borderBottom: workerTab===tab?`2px solid ${T.gold}`:"2px solid transparent",
            transition:"all .15s",
          }}>
            {{ tasks:"✅ Tasks", checkin:"📍 Check-In", materials:"📦 Materials", tools:"🔧 Tools", wrapup:"🔒 Wrap-Up" }[tab]}
          </div>
        ))}
      </div>

      <div style={{ padding:16 }}>

        {/* TASKS */}
        {workerTab === "tasks" && (
          <div>
            <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>
              Your task list for today — complete in priority order. Tap to mark done.
            </div>
            {["MUST FINISH TODAY","HIGH PRIORITY","NORMAL","WHEN TIME ALLOWS"].map(pri => {
              const pts = myTasks.filter(t=>t.priority===pri);
              if(!pts.length) return null;
              return (
                <div key={pri} style={{ marginBottom:20 }}>
                  <div style={{ marginBottom:8 }}><PriorityTag p={pri}/></div>
                  {pts.map(task => (
                    <div key={task.id} style={{ background:T.card, border:`1px solid ${T.border}`,
                      borderRadius:8, padding:"12px 14px", marginBottom:8,
                      opacity: task.done?0.5:1, display:"flex", alignItems:"flex-start", gap:12 }}>
                      <div onClick={() => setTasks(prev=>prev.map(t=>t.id===task.id?{...t,done:!t.done}:t))}
                        style={{ width:22, height:22, borderRadius:5, flexShrink:0, cursor:"pointer",
                          background: task.done?T.green:"transparent", border:`2px solid ${task.done?T.green:T.border}`,
                          display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
                        {task.done && <span style={{ color:"#fff", fontSize:13, fontWeight:900 }}>✓</span>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:T.text, textDecoration:task.done?"line-through":"none" }}>{task.text}</div>
                        {task.carriedOver && <div style={{ fontSize:10, color:T.orange, marginTop:3 }}>↪ Carried over from yesterday</div>}
                        {task.assignedBy && <div style={{ fontSize:10, color:T.purple, marginTop:3 }}>Assigned by {workers.find(w=>w.id===task.assignedBy)?.name}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* CHECK-IN */}
        {workerTab === "checkin" && (
          <div>
            <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>
              Complete this checklist when you arrive on site each morning.
            </div>
            <Card style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:T.gold, fontWeight:700, marginBottom:12 }}>Morning Start-of-Day Checklist</div>
              {[
                "I have reviewed today's full task list",
                "All required tools are on site",
                "All materials for today's work are available",
                "Any missing materials have been flagged",
                "Site protection is in place (floors, furniture, fixtures)",
                "I understand my priority tasks for today",
              ].map((item,i) => (
                <label key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0",
                  borderBottom: i<5?`1px solid ${T.border}`:"none", cursor:"pointer" }}>
                  <input type="checkbox" style={{ width:18, height:18, accentColor:T.gold }}/>
                  <span style={{ fontSize:13 }}>{item}</span>
                </label>
              ))}
            </Card>
            <Card>
              <div style={{ fontSize:12, color:T.gold, fontWeight:700, marginBottom:12 }}>🎤 Voice Note to Mark</div>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:12 }}>
                Have something to flag first thing? Record a quick note — it goes straight to Mark's dashboard.
              </div>
              <Btn variant="ghost" style={{ width:"100%", fontSize:13, padding:"12px" }}>
                🎤 Hold to Record
              </Btn>
            </Card>
          </div>
        )}

        {/* MATERIALS */}
        {workerTab === "materials" && (
          <div>
            <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>
              Submit materials needed. Do this during your end-of-day wrap-up — not throughout the day.
            </div>
            <Card style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:T.gold, fontWeight:700, marginBottom:12 }}>Add Material Request</div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:T.textDim, marginBottom:4 }}>What do you need?</div>
                <input placeholder="e.g. 2x10x16 lumber" style={{ width:"100%", background:T.surface,
                  border:`1px solid ${T.border}`, borderRadius:6, padding:"9px 12px", color:T.text,
                  fontSize:13, boxSizing:"border-box" }}/>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, color:T.textDim, marginBottom:4 }}>Quantity</div>
                <input placeholder="e.g. 3 pieces" style={{ width:"100%", background:T.surface,
                  border:`1px solid ${T.border}`, borderRadius:6, padding:"9px 12px", color:T.text,
                  fontSize:13, boxSizing:"border-box" }}/>
              </div>
              <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, cursor:"pointer" }}>
                <input type="checkbox" style={{ accentColor:T.red }}/>
                <span style={{ fontSize:12, color:T.red }}>URGENT — needed first thing tomorrow</span>
              </label>
              <Btn variant="ghost" style={{ width:"100%", fontSize:13, marginBottom:10 }}>
                🎤 Speak Instead of Typing
              </Btn>
              <Btn style={{ width:"100%", fontSize:13 }}>Submit Request</Btn>
            </Card>

            <div style={{ fontSize:11, color:T.textDim, marginBottom:10, letterSpacing:1, textTransform:"uppercase" }}>Your Requests Today</div>
            {materials.filter(m=>m.workerId===activeWorker?.id).map(m => (
              <Card key={m.id} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{m.item}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{m.qty}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:8,
                    background: m.ordered?"#0A2A18":"#3A0A0A", color: m.ordered?T.green:T.red }}>
                    {m.ordered?"✓ Ordered":"Pending"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* TOOLS */}
        {workerTab === "tools" && (
          <div>
            <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>
              Tools checked out to you. Confirm every Monday. Flag any issues immediately.
            </div>
            {tools.filter(t=>t.checkedOutBy===activeWorker?.id).map(tool => (
              <Card key={tool.id} style={{ marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{tool.name}</div>
                  <div style={{ fontSize:11, color:T.textMuted, fontFamily:"monospace" }}>{tool.tag}</div>
                  <div style={{ fontSize:11, color: tool.condition==="Good"?T.green:T.orange, marginTop:4 }}>
                    {tool.condition==="Good"?"✓ Good condition":"⚠ "+tool.condition}
                  </div>
                </div>
                <Btn variant="ghost" style={{ fontSize:11, padding:"6px 12px" }}>Report Issue</Btn>
              </Card>
            ))}
            <Card style={{ marginTop:16 }}>
              <div style={{ fontSize:12, color:T.gold, fontWeight:700, marginBottom:8 }}>Transfer a Tool</div>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:12 }}>
                Moving a tool to another job or worker? Log it here so it stays tracked.
              </div>
              <Btn variant="ghost" style={{ width:"100%", fontSize:12 }}>+ Log Tool Transfer</Btn>
            </Card>
          </div>
        )}

        {/* WRAP-UP */}
        {workerTab === "wrapup" && (
          <div>
            <div style={{ background:"#1A0A00", border:`1px solid #3A2A00`, borderRadius:8,
              padding:"12px 14px", marginBottom:16, fontSize:12, color:T.orange }}>
              ⚠ You must complete all 7 steps before you can clock out. Take your time — do it right.
            </div>

            {/* Progress */}
            <div style={{ display:"flex", gap:4, marginBottom:20 }}>
              {wrapupSteps.map((s,i) => (
                <div key={i} onClick={()=>setWrapupStep(i)} style={{ flex:1, height:4, borderRadius:4, cursor:"pointer",
                  background: i<wrapupStep?T.green : i===wrapupStep?T.gold : T.border, transition:"background .2s" }}/>
              ))}
            </div>
            <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>
              Step {wrapupStep+1} of {wrapupSteps.length}: <span style={{ color:T.gold, fontWeight:700 }}>{wrapupSteps[wrapupStep]}</span>
            </div>

            {/* Step 0: Tasks done */}
            {wrapupStep===0 && (
              <Card>
                <div style={{ fontSize:13, color:T.text, marginBottom:14 }}>Which tasks did you complete today?</div>
                {myTasks.map(task => (
                  <label key={task.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0",
                    borderBottom:`1px solid ${T.border}`, cursor:"pointer" }}>
                    <input type="checkbox" defaultChecked={task.done} style={{ width:18, height:18, accentColor:T.green }}/>
                    <span style={{ fontSize:13 }}>{task.text}</span>
                  </label>
                ))}
              </Card>
            )}

            {/* Step 1: What's left */}
            {wrapupStep===1 && (
              <Card>
                <div style={{ fontSize:13, color:T.text, marginBottom:6 }}>What's left on your current task? Describe what still needs to be done — this becomes tomorrow's first task automatically.</div>
                <textarea rows={4} placeholder="e.g. Drywall — closet wall still needs to be hung. Need 4 more sheets of 1/2 inch."
                  style={{ width:"100%", background:T.surface, border:`1px solid ${T.border}`, borderRadius:6,
                    padding:"10px 12px", color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box", marginTop:8 }}/>
                <Btn variant="ghost" style={{ width:"100%", marginTop:10, fontSize:12 }}>🎤 Speak Instead</Btn>
              </Card>
            )}

            {/* Step 2: Materials */}
            {wrapupStep===2 && (
              <Card>
                <div style={{ fontSize:13, color:T.text, marginBottom:6 }}>What materials do you need for tomorrow? Be thorough — this is your one chance. List everything.</div>
                <textarea rows={5} placeholder="e.g. 4 sheets 1/2 inch drywall, box of drywall screws, roll of mesh tape..."
                  style={{ width:"100%", background:T.surface, border:`1px solid ${T.border}`, borderRadius:6,
                    padding:"10px 12px", color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box", marginTop:8 }}/>
                <Btn variant="ghost" style={{ width:"100%", marginTop:10, fontSize:12 }}>🎤 Speak Instead</Btn>
                <div style={{ marginTop:12, padding:10, background:"#1A0A00", borderRadius:6, fontSize:11, color:T.orange }}>
                  ⚠ If you submit a request tomorrow that's not on this list, it will be flagged automatically.
                </div>
              </Card>
            )}

            {/* Step 3: Tools */}
            {wrapupStep===3 && (
              <Card>
                <div style={{ fontSize:13, color:T.text, marginBottom:6 }}>Any tools you'll need tomorrow that aren't currently on site?</div>
                <textarea rows={3} placeholder="e.g. Need the finish nailer tomorrow — Mike has it on the other job."
                  style={{ width:"100%", background:T.surface, border:`1px solid ${T.border}`, borderRadius:6,
                    padding:"10px 12px", color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box", marginTop:8 }}/>
                <Btn variant="ghost" style={{ width:"100%", marginTop:10, fontSize:12 }}>🎤 Speak Instead</Btn>
              </Card>
            )}

            {/* Step 4: Orders/Schedule */}
            {wrapupStep===4 && (
              <Card>
                <div style={{ fontSize:13, color:T.text, marginBottom:6 }}>Anything that needs to be ordered, scheduled, or arranged? (Subs, deliveries, inspections, rentals)</div>
                <textarea rows={3} placeholder="e.g. Tile sub needs to be scheduled for next week. Windows arriving Thursday."
                  style={{ width:"100%", background:T.surface, border:`1px solid ${T.border}`, borderRadius:6,
                    padding:"10px 12px", color:T.text, fontSize:13, resize:"vertical", boxSizing:"border-box", marginTop:8 }}/>
                <Btn variant="ghost" style={{ width:"100%", marginTop:10, fontSize:12 }}>🎤 Speak Instead</Btn>
              </Card>
            )}

            {/* Step 5: Cleanup */}
            {wrapupStep===5 && (
              <Card>
                <div style={{ fontSize:13, color:T.text, marginBottom:14 }}>Confirm the job site is clean and secure before you leave.</div>
                {CLEANUP_ITEMS.map((item,i) => (
                  <label key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0",
                    borderBottom: i<CLEANUP_ITEMS.length-1?`1px solid ${T.border}`:"none", cursor:"pointer" }}>
                    <input type="checkbox" style={{ width:20, height:20, accentColor:T.green }}/>
                    <span style={{ fontSize:13 }}>{item}</span>
                  </label>
                ))}
              </Card>
            )}

            {/* Step 6: Confirm */}
            {wrapupStep===6 && (
              <Card>
                <div style={{ fontSize:14, color:T.text, marginBottom:16, lineHeight:1.6 }}>
                  By confirming, you are stating that your wrap-up is complete and accurate. Your material list is final.
                  Any new requests submitted tomorrow that were not on today's list will be automatically flagged.
                </div>
                <label style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:20, cursor:"pointer" }}>
                  <input type="checkbox" style={{ width:22, height:22, accentColor:T.green, marginTop:2 }}
                    onChange={e=>setWrapupData(d=>({...d,confirmed:e.target.checked}))}/>
                  <span style={{ fontSize:13, color:T.text }}>
                    I have thought through tomorrow's work. This wrap-up is complete and my material list is final.
                  </span>
                </label>
                <Btn disabled={!wrapupData.confirmed} style={{ width:"100%", fontSize:14, padding:"14px" }}
                  onClick={() => {
                    setClockIns(prev=>prev.map(c=>c.workerId===activeWorker?.id&&c.date===today?{...c,clockOut:"Now"}:c));
                    setWrapupStep(0);
                    setWorkerTab("tasks");
                  }}>
                  ✓ SUBMIT & CLOCK OUT
                </Btn>
              </Card>
            )}

            {/* Navigation */}
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              {wrapupStep > 0 &&
                <Btn variant="ghost" onClick={()=>setWrapupStep(s=>s-1)} style={{ flex:1 }}>← Back</Btn>}
              {wrapupStep < wrapupSteps.length-1 &&
                <Btn onClick={()=>setWrapupStep(s=>s+1)} style={{ flex:1 }}>Next →</Btn>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JobsTable({ jobs, onSelect }) {
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr style={{ background:T.surface, borderBottom:`1px solid ${T.border}` }}>
            {["Client","Address","Type","Status","Estimate","Billed"].map(h => (
              <th key={h} style={{ padding:"10px 14px", textAlign:"left", color:T.textDim,
                fontSize:10, letterSpacing:1, textTransform:"uppercase", fontWeight:"normal" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job,i) => (
            <tr key={job.id} onClick={()=>onSelect(job)} style={{ borderBottom:`1px solid ${T.border}`,
              background: i%2===0?T.card:T.surface, cursor:"pointer", transition:"background .1s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#222220"}
              onMouseLeave={e=>e.currentTarget.style.background=i%2===0?T.card:T.surface}>
              <td style={{ padding:"12px 14px", fontWeight:700 }}>{job.client}</td>
              <td style={{ padding:"12px 14px", color:T.textMuted, fontSize:12 }}>{job.address}</td>
              <td style={{ padding:"12px 14px", color:T.textMuted }}>{job.type}</td>
              <td style={{ padding:"12px 14px" }}><Badge status={job.status}/></td>
              <td style={{ padding:"12px 14px", color:T.gold, fontFamily:"monospace" }}>{fmt$(job.estimate)}</td>
              <td style={{ padding:"12px 14px", color:T.textMuted, fontFamily:"monospace" }}>{fmt$(job.billed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
