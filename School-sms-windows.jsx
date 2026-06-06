import { useState, useMemo, useEffect } from "react";

const DEFAULT_CLASSES = ["Nursery","KG","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th"];
const DEFAULT_SUBJECTS = {
  "Nursery":["English","Urdu","Math"],
  "KG":["English","Urdu","Math","Drawing"],
  "1st":["English","Urdu","Math","Science"],
  "2nd":["English","Urdu","Math","Science","Social Studies"],
  "3rd":["English","Urdu","Math","Science","Social Studies"],
  "4th":["English","Urdu","Math","Science","Social Studies","Computer"],
  "5th":["English","Urdu","Math","Science","Social Studies","Computer"],
  "6th":["English","Urdu","Math","Science","Social Studies","Computer","Art"],
  "7th":["English","Urdu","Math","Science","Social Studies","Computer","Art"],
  "8th":["English","Urdu","Math","Science","Social Studies","Computer","Art"],
  "9th":["English","Urdu","Math","Physics","Chemistry","Biology","Computer"],
  "10th":["English","Urdu","Math","Physics","Chemistry","Biology","Computer"],
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const gradeOf = p => p>=90?"A+":p>=80?"A":p>=70?"B":p>=60?"C":p>=50?"D":"F";

// ─── Shared Print / PDF Utility ───────────────────────────────────────────────
// ─── Print Utility ────────────────────────────────────────────────────────────

function printHTML(html, filename){
  // Download as .html file — open in browser then Ctrl+P to print or Save as PDF
  var blob = new Blob([html], {type: 'text/html;charset=utf-8'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href   = url;
  a.download = (filename||'document') + '.html';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 5000);
}

// ─── Logo Builder ─────────────────────────────────────────────────────────────
// Hardcoded max-height: 80px per spec. No sliders, no shape croppers.
function buildLogoHTML(logo, logoAlign){
  if(!logo) return "";
  const align = logoAlign||"left";
  const margin = align==="center" ? "0 auto 8px" : "0 auto 8px 0";
  const display = align==="center" ? "block" : "block";
  return `<img src="${logo}" style="height:80px;width:auto;max-width:240px;max-height:80px;object-fit:contain;display:${display};margin:${margin};" alt="School Logo"/>`;
}

// ─── Print Header Builder ──────────────────────────────────────────────────────
// logoAlign: "left" = split (logo left, school info right) | "center" = stacked center
// ─── Universal Print Header ───────────────────────────────────────────────────
// Shared across ALL print documents: Fee Receipt, Admission Form, Result Card,
// Attendance Report, etc.
//
// Layout (Flexbox justify-content:space-between):
//   LEFT  — Logo + School Name + Address + Session badge
//   RIGHT — Email + Phone + Website (contact info block)
//
// @media print protections included:
//   - Flexbox layout preserved on paper
//   - -webkit-print-color-adjust:exact so blue colors print correctly
//   - border-bottom: 2px solid #1E3A8A as universal separator
//
// In Electron/React component usage:
//   function UniversalPrintHeader({school,schoolAddr,schoolEmail,schoolPhone,schoolWebsite,logo,logoAlign,sess,labelText}){
//     return <div dangerouslySetInnerHTML={{__html: buildPrintHeader(logo,null,null,logoAlign,school,schoolAddr,sess,labelText,{email:schoolEmail,phone:schoolPhone,website:schoolWebsite})}}/>;
//   }
function buildPrintHeader(logo, _logoSize, _logoShape, logoAlign, school, schoolAddr, sess, labelText, contact){
  var align   = logoAlign||"left";
  var email   = (contact&&contact.email)   ? contact.email   : "";
  var phone   = (contact&&contact.phone)   ? contact.phone   : "";
  var website = (contact&&contact.website) ? contact.website : "";

  // Label badge (document type pill)
  var badge = labelText
    ? "<div style='margin-top:8px'><span style='background:#dbeafe;color:#1e3a8a;border-radius:20px;padding:3px 14px;font-size:11px;font-weight:700;letter-spacing:0.4px;display:inline-block'>"+labelText+" &bull; Session "+sess+"</span></div>"
    : "";

  // Logo HTML
  var logoHtml = logo
    ? "<img src='"+logo+"' style='height:80px;max-height:80px;width:auto;max-width:180px;object-fit:contain;display:block;' alt='Logo'/>"
    : "";

  // RIGHT column — contact info (only shown if at least one field exists)
  var contactLines = [];
  if(email)   contactLines.push("<div style='display:flex;align-items:center;gap:5px;justify-content:flex-end'><span style='color:#94a3b8;font-size:10px'>&#9993;</span><span>"+email+"</span></div>");
  if(phone)   contactLines.push("<div style='display:flex;align-items:center;gap:5px;justify-content:flex-end'><span style='color:#94a3b8;font-size:10px'>&#128222;</span><span>"+phone+"</span></div>");
  if(website) contactLines.push("<div style='display:flex;align-items:center;gap:5px;justify-content:flex-end'><span style='color:#94a3b8;font-size:10px'>&#127760;</span><span>"+website+"</span></div>");
  var rightCol = contactLines.length > 0
    ? "<div style='text-align:right;font-size:11px;color:#334155;line-height:1.7;flex-shrink:0;min-width:160px;max-width:220px;'>"+contactLines.join("")+"</div>"
    : "";

  // Print protection CSS (injected inline so it applies even in blob HTML)
  var printCSS = "<style>@media print{.uph{display:flex!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}.uph-left{display:flex!important;align-items:center!important;gap:12px!important;}}</style>";

  // ── LEFT identity block ──
  var leftText = "<div style='display:flex;flex-direction:column;justify-content:center;'>"
    +"<div style='font-size:22px;font-weight:800;color:#1e3a8a;letter-spacing:0.2px;line-height:1.2;-webkit-print-color-adjust:exact;print-color-adjust:exact;'>"+school+"</div>"
    +(schoolAddr ? "<div style='font-size:11px;color:#64748b;margin-top:3px'>"+schoolAddr+"</div>" : "")
    +badge
    +"</div>";

  var leftCol = "<div class='uph-left' style='display:flex;align-items:center;gap:12px;flex:1;'>"
    +(align!=="center" ? logoHtml : "")
    +leftText
    +"</div>";

  // ── CENTERED layout ──
  if(align==="center"){
    return printCSS
      +"<div style='text-align:center;border-bottom:2px solid #1e3a8a;padding-bottom:14px;margin-bottom:18px;-webkit-print-color-adjust:exact;print-color-adjust:exact;'>"
      +(logoHtml ? "<div style='margin-bottom:6px'>"+logoHtml.replace("display:block","display:block;margin:0 auto")+"</div>" : "")
      +"<div style='font-size:22px;font-weight:800;color:#1e3a8a;-webkit-print-color-adjust:exact;print-color-adjust:exact;'>"+school+"</div>"
      +(schoolAddr ? "<div style='font-size:11px;color:#64748b;margin-top:2px'>"+schoolAddr+"</div>" : "")
      +(phone||email ? "<div style='font-size:11px;color:#64748b;margin-top:2px'>"+(email?email:"")+(email&&phone?" &nbsp;|&nbsp; ":"")+(phone?phone:"")+"</div>" : "")
      +badge
      +"</div>";
  }

  // ── SPLIT / LEFT layout (default) — LEFT identity | RIGHT contact ──
  return printCSS
    +"<div class='uph' style='display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:2px solid #1e3a8a;padding-bottom:14px;margin-bottom:18px;-webkit-print-color-adjust:exact;print-color-adjust:exact;'>"
    +leftCol
    +rightCol
    +"</div>";
}

// ─── Student Info Block ────────────────────────────────────────────────────────
function buildStudentInfoBlock(student){
  const initials = (student.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const avatarColors = ["#0067c0","#107c10","#7e3ff2","#7a4419","#c42b1c"];
  const avatarBg = avatarColors[(student.name||"").charCodeAt(0)%avatarColors.length];
  const avatar = student.photo
    ? `<img src="${student.photo}" style="width:64px;height:80px;object-fit:cover;border-radius:6px;border:2px solid #0067c0;flex-shrink:0;" alt="Photo"/>`
    : `<div style="width:64px;height:80px;border-radius:50%;background:${avatarBg};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;">${initials}</div>`;
  return `<div style="display:flex;gap:14px;align-items:flex-start;background:#f0f6ff;border:1px solid #cce4f7;border-left:4px solid #0067c0;padding:12px;border-radius:0 6px 6px 0;margin-bottom:16px;">
    ${avatar}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;flex:1;font-size:13px;">
      <div><span style="font-weight:700;color:#555">Student:</span> <span>${student.name||""}</span></div>
      <div><span style="font-weight:700;color:#555">Father:</span> <span>${student.dad||"—"}</span></div>
      <div><span style="font-weight:700;color:#555">Class:</span> <span>${student.cls||""}</span></div>
      <div><span style="font-weight:700;color:#555">Mother:</span> <span>${student.mom||"—"}</span></div>
      <div><span style="font-weight:700;color:#555">S.No:</span> <span>${student.roll||""}</span></div>
      <div><span style="font-weight:700;color:#555">DOB:</span> <span>${student.dob||"—"}</span></div>
    </div>
  </div>`;
}

// ─── Shared Print CSS ──────────────────────────────────────────────────────────
const RESULT_CSS = `*{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}
body{max-width:780px;margin:0 auto;padding:28px;color:#1a1a1a}
table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}
th{background:#1a56a0;color:#fff;padding:7px 10px;text-align:left;font-weight:600}
td{padding:6px 10px;border-bottom:1px solid #ebebeb}
tr:nth-child(even) td{background:#f7f8fa}
.exam-hdr{font-weight:700;font-size:14px;border-left:4px solid #0067c0;padding:7px 12px;margin:16px 0 6px;background:#e8f0fb;color:#0067c0;border-radius:0 4px 4px 0}
.pill{border-radius:20px;font-size:11px;padding:2px 8px;font-weight:500;display:inline-block}
.pass-pill{background:#dcfce7;color:#166534}
.fail-pill{background:#fee2e2;color:#991b1b}
.fin{text-align:center;padding:14px;border-radius:8px;font-size:16px;font-weight:700;margin-top:16px}
.fin-pass{background:#dcfce7;color:#166534;border:2px solid #16a34a}
.fin-fail{background:#fee2e2;color:#991b1b;border:2px solid #dc2626}
.sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:36px;text-align:center;font-size:12px;color:#666}
.sl{border-top:1px solid #aaa;padding-top:6px;margin-top:30px}
.seal{width:72px;height:72px;border:2px dashed #bbb;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;font-size:10px;color:#bbb;font-style:italic;text-align:center;line-height:1.3}
.footer{display:flex;justify-content:space-between;font-size:10px;color:#aaa;margin-top:16px;border-top:1px solid #eee;padding-top:8px}
@media print{body{padding:6px}@page{margin:1cm}}`;

// ─── Watermark Builder ─────────────────────────────────────────────────────────
// Per spec:
//   Text → always -45deg diagonal, opacity controlled by intensity preset
//   Image → always 0deg centered, ~50% page width, opacity by intensity
//   Intensity: light=0.10, medium=0.20, strong=0.30
function buildWatermarkHTML(wm){
  if(!wm) return "";
  const activeType = wm.activeType||"text";
  const intensityMap = {light:0.10, medium:0.20, strong:0.30};
  const opacity = intensityMap[wm.intensity||"light"] || (wm.opacity/100) || 0.10;

  if(activeType==="image" && wm.image){
    // Image: centered, 0deg rotation, ~50% page width, within print area
    return `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:0;opacity:${opacity};width:50%;max-width:400px;">
      <img src="${wm.image}" style="width:100%;height:auto;max-height:400px;object-fit:contain;display:block;" alt=""/>
    </div>`;
  }

  if(activeType==="text" && wm.text){
    const text = (wm.text||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    // Text: always -45deg, font-size proportional to page width via vw, contained
    return `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);pointer-events:none;z-index:0;opacity:${opacity};font-size:clamp(24px,8vw,96px);font-weight:900;color:#000;white-space:nowrap;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0;max-width:90vw;overflow:hidden;text-align:center;">${text}</div>`;
  }
  return "";
}

// Legacy wrapper — returns "" (watermark is now injected as HTML div, not CSS)
function buildWatermarkCSS(wm){ return ""; }




const DEFAULT_EXAMS = [
  {id:"e1",name:"Test 1",      maxMarks:25, minPass:10, allClasses:true, subjects:{}},
  {id:"e2",name:"Test 2",      maxMarks:25, minPass:10, allClasses:true, subjects:{}},
  {id:"e3",name:"Half Yearly", maxMarks:100,minPass:40, allClasses:true, subjects:{}},
  {id:"e4",name:"Annual Exam", maxMarks:100,minPass:40, allClasses:true, subjects:{}},
];

const S0 = [
  {id:1,name:"Rahul Gandhi",sex:"M",dad:"Rajeev Gandhi",mom:"Indra Gandhi",dob:"2015-03-02",ph:"9876543210",abc:"123456789012",aadhaar:"1234567890345678",addr:"Mainpuri, UP",cls:"1st",roll:"1",photo:"",sess:"2026-27",typ:"old"},
  {id:2,name:"Sara Khan",sex:"F",dad:"Ali Hassan",mom:"Nadia Ali",dob:"2015-07-10",ph:"9812345678",abc:"234567890123",aadhaar:"2345678901234567",addr:"House 5, Block B",cls:"1st",roll:"2",photo:"",sess:"2026-27",typ:"old"},
  {id:3,name:"Usman Tariq",sex:"M",dad:"Tariq Mehmood",mom:"Saba Tariq",dob:"2014-01-15",ph:"9632587410",abc:"345678901234",aadhaar:"3456789012345678",addr:"Street 3, City",cls:"2nd",roll:"1",photo:"",sess:"2026-27",typ:"old"},
  {id:4,name:"Fatima Noor",sex:"F",dad:"Noor Ahmed",mom:"Hina Noor",dob:"2013-09-05",ph:"8745236980",abc:"456789012345",aadhaar:"4567890123456789",addr:"Block A, Town",cls:"3rd",roll:"1",photo:"",sess:"2026-27",typ:"old"},
];
const F0 = {
  1:{total:2000,pay:[{dt:"2026-01-05",amt:2000,mo:"January",by:"Cash"}]},
  2:{total:2000,pay:[{dt:"2026-01-08",amt:1000,mo:"January",by:"Online"}]},
  3:{total:2000,pay:[]},
  4:{total:2500,pay:[{dt:"2026-01-03",amt:2500,mo:"January",by:"Cash"}]},
};

// ─── Theme Definitions ───────────────────────────────────────────────────────
const THEMES = {
  light:{
    tb:"#1f1f1f", bg:"#f3f3f3", sb:"#f9f9f9", sbb:"#e5e5e5",
    ac:"#0067c0", acl:"#cce4f7", sf:"#ffffff", bd:"#d1d1d1",
    hv:"#f0f0f0", tx:"#1a1a1a", mu:"#5a5a5a", fa:"#9a9a9a",
    er:"#c42b1c", erb:"#fde7e4", ok:"#107c10", okb:"#dff6dd",
    wn:"#7a4419", wnb:"#fff4ce", pu:"#7e3ff2", pub:"#ede7fd",
    th:"#f0f0f0", ta:"#fafafa", rb:"#eef2f8", stb:"#dce6f0",
    modHdr:"#f5f5f5", rowHov:"#eef4ff", accentWin:"#6b8cae",
  },
  dark:{
    tb:"#0d0d0d", bg:"#141414", sb:"#1c1c1c", sbb:"#2a2a2a",
    ac:"#4da6ff", acl:"#1a3550", sf:"#252525", bd:"#3a3a3a",
    hv:"#2e2e2e", tx:"#e2e2e2", mu:"#999999", fa:"#555555",
    er:"#ff6b6b", erb:"#3a1515", ok:"#4caf50", okb:"#1a3a1a",
    wn:"#ffb74d", wnb:"#3a2800", pu:"#c29bff", pub:"#231a40",
    th:"#2e2e2e", ta:"#202020", rb:"#1c2430", stb:"#141c28",
    modHdr:"#1e1e1e", rowHov:"#1e2d40", accentWin:"#2a3a50",
  },
};
// Module-level mutable reference — App updates this on theme change
// All components read from W directly (no context needed)
let W = {...THEMES.light};

const gISt = () => ({background:W.sf,border:"1px solid "+W.bd,borderRadius:4,padding:"5px 8px",fontSize:13,color:W.tx,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"Segoe UI,sans-serif"});
function WI({style,...p}){ return <input {...p} style={{...gISt(),...style}}/>; }
function WS({children,style,...p}){ return <select {...p} style={{...gISt(),...style,cursor:"pointer"}}>{children}</select>; }
function WB({v,children,style,...p}){
  const vs={d:{background:W.sf,border:"1px solid "+W.bd,color:W.tx},p:{background:W.ac,border:"1px solid #004f9c",color:"#fff"},e:{background:W.er,border:"1px solid #a32012",color:"#fff"},s:{background:W.ok,border:"1px solid #0a5c0a",color:"#fff"},g:{background:"transparent",border:"1px solid "+W.bd,color:W.mu}};
  return <button {...p} style={{...vs[v||"d"],borderRadius:4,padding:"5px 14px",fontSize:13,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap",...style}}>{children}</button>;
}
function Tag({t,children}){
  const ts={blue:{bg:W.acl,c:W.ac},green:{bg:W.okb,c:W.ok},red:{bg:W.erb,c:W.er},yellow:{bg:W.wnb,c:W.wn},purple:{bg:W.pub,c:W.pu},gray:{bg:W.th,c:W.mu}};
  const x=ts[t]||ts.gray;
  return <span style={{background:x.bg,color:x.c,padding:"1px 8px",borderRadius:3,fontSize:12,fontWeight:600,fontFamily:"Segoe UI,sans-serif"}}>{children}</span>;
}
function Modal({title,icon,onClose,children,w}){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:8,width:"100%",maxWidth:w||480,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 48px rgba(0,0,0,0.4)"}}>
        <div style={{background:W.modHdr,borderBottom:"1px solid "+W.bd,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {icon&&<span style={{fontSize:16}}>{icon}</span>}
            <span style={{fontSize:13,fontWeight:600,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>{title}</span>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:W.mu,fontSize:18,lineHeight:1,padding:"0 4px"}}>✕</button>
        </div>
        <div style={{overflowY:"auto",padding:20,flex:1,background:W.sf}}>{children}</div>
      </div>
    </div>
  );
}
function Row({children}){ return <div style={{display:"flex",gap:10,marginBottom:8,flexWrap:"wrap"}}>{children}</div>; }
function Fld({label,half,children}){
  return (
    <div style={{flex:half?"1 1 calc(50% - 5px)":"1 1 100%",minWidth:160,marginBottom:2}}>
      <label style={{display:"block",fontSize:12,color:W.mu,marginBottom:3,fontFamily:"Segoe UI,sans-serif"}}>{label}</label>
      {children}
    </div>
  );
}
function TH({children,onClick,sorted}){
  return (
    <th onClick={onClick} style={{padding:"7px 12px",textAlign:"left",fontSize:12,color:W.mu,borderBottom:"1px solid "+W.bd,fontWeight:600,whiteSpace:"nowrap",cursor:onClick?"pointer":"default",userSelect:"none",background:W.th,fontFamily:"Segoe UI,sans-serif"}}>
      {children}{sorted?" ↑":""}
    </th>
  );
}
function TD({children,style}){
  return <td style={{padding:"6px 12px",borderBottom:"1px solid "+W.bd,fontSize:13,fontFamily:"Segoe UI,sans-serif",...style}}>{children}</td>;
}
function Clock(){
  const [t,setT]=useState(new Date());
  useEffect(()=>{const i=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(i);},[]);
  return (
    <div style={{textAlign:"right",lineHeight:1.4}}>
      <div style={{fontSize:12,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>{t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
      <div style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{t.toLocaleDateString([],{day:"numeric",month:"short",year:"numeric"})}</div>
    </div>
  );
}

// ─── Class Manager Modal ──────────────────────────────────────────────────────
function ClassManager({classes,subjects,onSave,onClose,students}){
  const [cls,setCls]     = useState(classes.map(c=>({name:c,_orig:c})));
  const [newName,setNew] = useState("");
  const [editIdx,setEditIdx] = useState(null);
  const [editVal,setEditVal] = useState("");
  const [selCls,setSelCls]   = useState(classes[0]||"");
  const [subEdit,setSubEdit] = useState({});
  const [newSub,setNewSub]   = useState("");

  useEffect(()=>{
    const s={};
    classes.forEach(c=>{s[c]=[...(subjects[c]||[])];});
    setSubEdit(s);
  },[]);

  function addCls(){
    const n=newName.trim();
    if(!n){alert("Enter a class name");return;}
    if(cls.find(c=>c.name===n)){alert("Class already exists");return;}
    setCls(p=>[...p,{name:n,_orig:null}]);
    setSubEdit(p=>({...p,[n]:["English","Math"]}));
    setSelCls(n);
    setNew("");
  }
  function startEdit(i){setEditIdx(i);setEditVal(cls[i].name);}
  function saveEdit(i){
    const n=editVal.trim();
    if(!n){setEditIdx(null);return;}
    if(cls.find((c,j)=>c.name===n&&j!==i)){alert("Name already taken");return;}
    setCls(p=>p.map((c,j)=>j===i?{...c,name:n}:c));
    const old=cls[i].name;
    if(old!==n){
      setSubEdit(p=>{const nn={...p};nn[n]=nn[old]||[];delete nn[old];return nn;});
      if(selCls===old)setSelCls(n);
    }
    setEditIdx(null);
  }
  function delCls(i){
    const name=cls[i].name;
    const count=students.filter(s=>s.cls===name).length;
    if(count>0&&!window.confirm("Class \""+name+"\" has "+count+" student(s). They will become unclassified. Delete anyway?"))return;
    setCls(p=>p.filter((_,j)=>j!==i));
    setSubEdit(p=>{const nn={...p};delete nn[name];return nn;});
    if(selCls===name)setSelCls(cls.filter((_,j)=>j!==i)[0]?.name||"");
  }
  function moveCls(i,dir){
    const arr=[...cls];
    const ni=i+dir;
    if(ni<0||ni>=arr.length)return;
    [arr[i],arr[ni]]=[arr[ni],arr[i]];
    setCls(arr);
  }
  function addSub(){
    const n=newSub.trim();
    if(!n||!selCls)return;
    setSubEdit(p=>({...p,[selCls]:[...(p[selCls]||[]),n]}));
    setNewSub("");
  }
  function delSub(idx){
    setSubEdit(p=>({...p,[selCls]:p[selCls].filter((_,i)=>i!==idx)}));
  }
  function apply(){
    const finalCls=cls.map(c=>c.name);
    const finalSubs={};
    finalCls.forEach(c=>{finalSubs[c]=subEdit[c]||[];});
    onSave(finalCls,finalSubs);
  }

  return (
    <Modal title="Manage Classes" icon="🗂️" onClose={onClose} w={440}>
      <div style={{fontSize:12,fontWeight:600,color:W.mu,marginBottom:8,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>Classes ({cls.length})</div>
      <div style={{border:"1px solid "+W.bd,borderRadius:4,overflow:"hidden",marginBottom:10,maxHeight:360,overflowY:"auto"}}>
        {cls.length===0&&<div style={{padding:20,textAlign:"center",color:W.fa,fontSize:13}}>No classes yet. Add one below.</div>}
        {cls.map((c,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:i%2===1?W.ta:W.sf,borderBottom:i<cls.length-1?"1px solid #ebebeb":"none"}}>
            {editIdx===i?(
              <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")saveEdit(i);if(e.key==="Escape")setEditIdx(null);}}
                onBlur={()=>saveEdit(i)}
                style={{...gISt(),flex:1,padding:"3px 6px",fontSize:13}}/>
            ):(
              <span style={{flex:1,fontSize:13,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>{c.name}</span>
            )}
            <span style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif",minWidth:24}}>{students.filter(s=>s.cls===c.name).length}👤</span>
            <button title="Move up" onClick={e=>{e.stopPropagation();moveCls(i,-1);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:12,color:W.mu,padding:"0 2px"}}>↑</button>
            <button title="Move down" onClick={e=>{e.stopPropagation();moveCls(i,1);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:12,color:W.mu,padding:"0 2px"}}>↓</button>
            <button title="Rename" onClick={e=>{e.stopPropagation();startEdit(i);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:13,color:W.ac,padding:"0 2px"}}>✏️</button>
            <button title="Delete class" onClick={e=>{e.stopPropagation();delCls(i);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:13,color:W.er,padding:"0 2px"}}>🗑</button>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:6}}>
        <WI value={newName} onChange={e=>setNew(e.target.value)} placeholder="New class name…" onKeyDown={e=>e.key==="Enter"&&addCls()} style={{flex:1}}/>
        <WB v="p" onClick={addCls} style={{padding:"5px 12px"}}>➕ Add</WB>
      </div>
      <p style={{fontSize:11,color:W.fa,margin:"0 0 16px",fontFamily:"Segoe UI,sans-serif"}}>✏️ Rename · 🗑 Delete · ↑↓ Reorder · Shows student count per class</p>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,borderTop:"1px solid "+W.bd,paddingTop:14}}>
        <WB onClick={onClose}>Cancel</WB>
        <WB v="p" onClick={apply}>✓ Apply Changes</WB>
      </div>
    </Modal>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({students,fees,session,school,classes}){
  const byCls=classes.map(c=>({c,tot:students.filter(s=>s.cls===c).length,boys:students.filter(s=>s.cls===c&&s.sex==="M").length,girls:students.filter(s=>s.cls===c&&s.sex==="F").length})).filter(r=>r.tot>0);
  return (
    <div style={{padding:20}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:26,fontWeight:700,color:W.tx,margin:"0 0 4px",fontFamily:"Segoe UI,sans-serif"}}>{school}</h1>
        <div style={{fontSize:13,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>Academic Management System · Session {session}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:20}}>
        {[
          {label:"Session",value:session,sub:"Current Academic Year",icon:"📅",c:W.ac},
          {label:"Classes",value:classes.length+" classes",sub:"Fully customisable",icon:"🏫",c:W.pu},
          {label:"Total Students",value:students.length,sub:students.filter(s=>s.typ==="new").length+" new this session",icon:"👨‍🎓",c:W.ok},
        ].map(s=>(
          <div key={s.label} style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:6,padding:"14px 16px",borderTop:"3px solid "+s.c}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:18}}>{s.icon}</span><span style={{fontSize:11,color:W.mu,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>{s.label}</span></div>
            <div style={{fontSize:18,fontWeight:700,color:W.tx,fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>{s.value}</div>
            <div style={{fontSize:12,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{s.sub}</div>
          </div>
        ))}
      </div>
      {byCls.length>0&&(
        <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:6,overflow:"hidden"}}>
          <div style={{background:W.th,borderBottom:"1px solid "+W.bd,padding:"8px 16px",fontSize:13,fontWeight:600,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>Class-wise Student Strength</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Class","Total Students","Boys","Girls"].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
            <tbody>
              {byCls.map((r,i)=>(
                <tr key={r.c} style={{background:i%2===1?W.ta:W.sf}}>
                  <TD style={{fontWeight:600,color:W.ac}}>{r.c}</TD>
                  <TD>{r.tot}</TD>
                  <TD><Tag t="blue">{r.boys} Boys</Tag></TD>
                  <TD><Tag t="purple">{r.girls} Girls</Tag></TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Admission ────────────────────────────────────────────────────────────────

// ─── Default Column Definitions ───────────────────────────────────────────────
const DEFAULT_COLS = [
  {key:"roll",  label:"Serial No.",    type:"text",   required:true,  visible:true,  locked:true},
  {key:"photo", label:"Photo",          type:"photo",  required:false, visible:true,  locked:false},
  {key:"name",  label:"Student Name",  type:"name",   required:true,  visible:true,  locked:true},
  {key:"sex",   label:"M/F",           type:"gender", required:false, visible:true,  locked:true},
  {key:"dad",   label:"Father's Name", type:"name",   required:false, visible:true,  locked:false},
  {key:"mom",   label:"Mother's Name", type:"name",   required:false, visible:true,  locked:false},
  {key:"dob",   label:"Date of Birth", type:"date",   required:false, visible:true,  locked:false},
  {key:"ph",    label:"Mobile No.",    type:"number", required:false, visible:true,  locked:false},
  {key:"abc",   label:"ABC ID",        type:"number", required:false, visible:true,  locked:false},
  {key:"aadhaar",label:"Aadhaar No.",  type:"number", required:false, visible:true,  locked:false},
  {key:"addr",  label:"Address",       type:"text",   required:false, visible:true,  locked:false},
  {key:"typ",   label:"Status",        type:"status", required:false, visible:true,  locked:true},
];
const COL_TYPES = [
  {id:"text",   label:"Text",        icon:"🔤", hint:"Any text (names, addresses)"},
  {id:"name",   label:"Name",        icon:"👤", hint:"Person name — title case"},
  {id:"number", label:"Number/ID",   icon:"🔢", hint:"Digits only (phone, ID, code)"},
  {id:"date",   label:"Date",        icon:"📅", hint:"Date picker"},
  {id:"gender", label:"Gender",      icon:"⚧",  hint:"Male / Female dropdown"},
  {id:"status", label:"Status",      icon:"🏷️", hint:"New / Old dropdown"},
  {id:"photo",  label:"Photo",       icon:"📷", hint:"Student photo (JPG/PNG, 15–50 KB)"},
];

const emptyForm = (cls, cols) => {
  const base = {cls:cls||"", sess:"2026-27"};
  (cols||DEFAULT_COLS).forEach(c => { base[c.key] = c.type==="gender"?"M": c.type==="status"?"new":""; });
  return base;
};

// ─── Column Manager Modal ──────────────────────────────────────────────────────
function ColManager({cols, onSave, onClose}){
  const [list, setList] = useState(cols.map(c=>({...c})));
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType]   = useState("text");
  const [editIdx, setEditIdx]   = useState(null);

  function addCol(){
    const lbl = newLabel.trim();
    if(!lbl){alert("Enter a column label.");return;}
    const key = "c_"+Date.now();
    setList(p=>[...p,{key,label:lbl,type:newType,required:false,visible:true,locked:false}]);
    setNewLabel(""); setNewType("text");
  }
  function toggleVisible(i){
    setList(p=>p.map((x,j)=>j===i?{...x,visible:!x.visible}:x));
  }
  function toggleLock(i){
    setList(p=>p.map((x,j)=>j===i?{...x,locked:!x.locked}:x));
  }
  function delCol(i){
    if(list[i].required){alert("This is a core required column and cannot be deleted.");return;}
    setList(p=>p.filter((_,j)=>j!==i));
  }
  function move(i,dir){
    const a=[...list]; const ni=i+dir;
    if(ni<0||ni>=a.length)return;
    [a[i],a[ni]]=[a[ni],a[i]]; setList(a);
  }
  function changeType(i,t){
    if(list[i].required)return;
    setList(p=>p.map((x,j)=>j===i?{...x,type:t}:x));
  }
  function changeLabel(i,v){
    if(list[i].required)return;
    setList(p=>p.map((x,j)=>j===i?{...x,label:v}:x));
  }

  const typeIcon = t => (COL_TYPES.find(x=>x.id===t)||{icon:"🔤"}).icon;

  return (
    <Modal title="Customize Admission Columns" icon="⚙️" onClose={onClose} w={680}>
      <div style={{fontSize:11,color:W.mu,marginBottom:10,fontFamily:"Segoe UI,sans-serif",background:W.acl,border:"1px solid "+W.bd,borderRadius:4,padding:"6px 12px"}}>
        ✦ Toggle columns on/off · Drag to reorder with ↑↓ · Add custom columns · Locked columns (🔒) are required fields
      </div>

      {/* Column list */}
      <div style={{border:"1px solid "+W.bd,borderRadius:4,overflow:"hidden",marginBottom:12,maxHeight:360,overflowY:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"28px 1fr 130px 80px 70px",background:W.th,borderBottom:"1px solid "+W.bd,padding:"5px 8px",gap:6}}>
          {["","Column Label","Data Type","Visible",""].map((h,i)=>(
            <div key={i} style={{fontSize:11,fontWeight:600,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>{h}</div>
          ))}
        </div>
        {list.map((col,i)=>(
          <div key={col.key} style={{display:"grid",gridTemplateColumns:"28px 1fr 130px 80px 70px",alignItems:"center",padding:"6px 8px",gap:6,background:i%2===1?W.ta:W.sf,borderBottom:i<list.length-1?"1px solid "+W.bd:"none",opacity:col.visible?1:0.5}}>
            {/* Lock toggle — clickable for all except required cols */}
            <span
              onClick={()=>!col.required&&toggleLock(i)}
              title={col.required?"Required — cannot unlock":col.locked?"Click to unlock":"Click to lock"}
              style={{fontSize:13,textAlign:"center",cursor:col.required?"default":"pointer",opacity:col.required?0.5:1}}>
              {col.locked?"🔒":"⠿"}
            </span>
            {/* Label */}
            {editIdx===i&&!col.required?(
              <input autoFocus value={col.label}
                onChange={e=>changeLabel(i,e.target.value)}
                onBlur={()=>setEditIdx(null)}
                onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape")setEditIdx(null);}}
                style={{...gISt(),fontSize:12,padding:"3px 6px"}}/>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:6,cursor:col.required?"default":"pointer"}} onClick={()=>!col.required&&setEditIdx(i)}>
                <span style={{fontSize:13}}>{typeIcon(col.type)}</span>
                <span style={{fontSize:13,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>{col.label}</span>
                {!col.locked&&<span style={{fontSize:10,color:W.fa}}>✏️</span>}
              </div>
            )}
            {/* Type selector */}
            <select value={col.type} disabled={col.required}
              onChange={e=>changeType(i,e.target.value)}
              style={{...gISt(),fontSize:11,padding:"2px 5px",opacity:col.required?0.5:1}}>
              {COL_TYPES.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
            {/* Visible toggle */}
            <div style={{display:"flex",justifyContent:"center"}}>
              <div onClick={()=>toggleVisible(i)} style={{width:38,height:20,borderRadius:10,background:col.visible?W.ok:"#888",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                <div style={{position:"absolute",top:2,left:col.visible?20:2,width:16,height:16,borderRadius:8,background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
              </div>
            </div>
            {/* Actions */}
            <div style={{display:"flex",gap:2}}>
              <button title="Move up" onClick={()=>move(i,-1)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:12,color:W.mu,padding:"1px 3px"}}>↑</button>
              <button title="Move down" onClick={()=>move(i,1)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:12,color:W.mu,padding:"1px 3px"}}>↓</button>
              {!col.required&&<button title="Delete" onClick={()=>delCol(i)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:12,color:W.er,padding:"1px 3px"}}>🗑</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Add new column */}
      <div style={{background:W.rb,border:"1px solid "+W.bd,borderRadius:4,padding:"10px 12px",marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:W.mu,marginBottom:8,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.4}}>Add Custom Column</div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input value={newLabel} onChange={e=>setNewLabel(e.target.value)}
            placeholder="Column label e.g. Religion, Blood Group…"
            onKeyDown={e=>e.key==="Enter"&&addCol()}
            style={{...gISt(),flex:1,minWidth:160,fontSize:12}}/>
          <select value={newType} onChange={e=>setNewType(e.target.value)}
            style={{...gISt(),width:140,fontSize:12}}>
            {COL_TYPES.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label} — {t.hint}</option>)}
          </select>
          <WB v="p" onClick={addCol} style={{padding:"5px 12px",fontSize:12,flexShrink:0}}>➕ Add Column</WB>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
          {["Religion","Blood Group","Category","Emergency Contact","Previous School","Transport Route","House No.","Nationality"].map(s=>(
            <button key={s} onClick={()=>setNewLabel(s)}
              style={{background:W.acl,border:"1px solid "+W.bd,borderRadius:3,padding:"2px 8px",fontSize:11,color:W.ac,cursor:"pointer",fontFamily:"Segoe UI,sans-serif"}}>+{s}</button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid "+W.bd,paddingTop:12}}>
        <WB v="e" onClick={()=>{if(window.confirm("Reset to default columns?"))setList(DEFAULT_COLS.map(c=>({...c})));}}> ↺ Reset to Default</WB>
        <div style={{display:"flex",gap:8}}>
          <WB onClick={onClose}>Cancel</WB>
          <WB v="p" onClick={()=>onSave(list)}>✓ Save Columns</WB>
        </div>
      </div>
    </Modal>
  );
}

// ─── Admission ────────────────────────────────────────────────────────────────
function Admission({students,setStudents,fees,setFees,classes,subjects,onManageClasses,school,sess,schoolAddr,cols,setCols,logo,logoAlign,watermark,schoolEmail,schoolPhone,schoolWebsite,isArchived}){
  const [cls,setCls]       = useState(classes[0]||"");
  const [q,setQ]           = useState("");
  const [form,setForm]     = useState(emptyForm(classes[0]||"",cols));
  const [editId,setEditId] = useState(null);
  const [showF,setShowF]   = useState(false);
  const [showI,setShowI]   = useState(false);
  const [showCols,setShowCols] = useState(false);
  const [sort,setSort]     = useState("roll");

  useEffect(()=>{if(!classes.includes(cls))setCls(classes[0]||"");},[classes]);

  const visCols = cols.filter(c=>c.visible);

  const list = useMemo(()=>{
    let r=students.filter(s=>s.cls===cls&&(
      s.name?.toLowerCase().includes(q.toLowerCase())||
      s.roll?.toString().includes(q)||
      Object.values(s).some(v=>String(v||"").toLowerCase().includes(q.toLowerCase()))
    ));
    r.sort((a,b)=>String(a[sort]||"").localeCompare(String(b[sort]||"")));
    return r;
  },[students,cls,q,sort]);

  // Auto-assign serial number (class-wise, 1-based)
  function nextSerial(cls){
    const classStudents = students.filter(s=>s.cls===cls);
    if(classStudents.length===0) return "1";
    const max = classStudents.reduce((m,s)=>Math.max(m, parseInt(s.roll)||0), 0);
    return String(max+1);
  }

  function save(){
    if(!form.name){alert("Student name is required.");return;}
    if(editId){
      setStudents(p=>p.map(s=>s.id===editId?{...s,...form}:s));
    } else {
      const id = Date.now();
      const roll = nextSerial(form.cls||cls);
      setStudents(p=>[...p,{...form,id,roll}]);
      setFees(p=>({...p,[id]:{total:2000,pay:[]}}));
    }
    setShowF(false);
  }
  function del(id){if(window.confirm("Delete this student record?"))setStudents(p=>p.filter(s=>s.id!==id));}

  function qc(v){ return '"'+String(v||"").replace(/"/g,'""')+'"'; }

  function renderCell(s, col){
    const v = s[col.key];
    if(col.key==="roll") return <TD key={col.key} style={{fontWeight:700,color:W.ac,textAlign:"center"}}>{v}</TD>;
    if(col.key==="photo") return (
      <TD key={col.key} style={{padding:"3px 8px"}}>
        {v ? <img src={v} alt="Photo" style={{width:32,height:38,objectFit:"cover",borderRadius:3,border:"1px solid "+W.bd,display:"block"}}/> : <span style={{fontSize:10,color:W.fa}}>—</span>}
      </TD>
    );
    if(col.key==="name") return <TD key={col.key} style={{fontWeight:600,color:W.tx,whiteSpace:"nowrap"}}>{v}</TD>;
    if(col.type==="gender") return <TD key={col.key}><Tag t={v==="M"?"blue":"purple"}>{v}</Tag></TD>;
    if(col.type==="status") return <TD key={col.key}><Tag t={v==="new"?"green":"gray"}>{v==="new"?"New":"Old"}</Tag></TD>;
    if(col.type==="date") return <TD key={col.key} style={{color:W.mu,fontSize:12,whiteSpace:"nowrap"}}>{v}</TD>;
    if(col.type==="number") return <TD key={col.key} style={{color:W.fa,fontSize:12}}>{v}</TD>;
    return <TD key={col.key} style={{color:W.mu,fontSize:12,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v||""}</TD>;
  }

  function renderFormField(col){
    const v = form[col.key]||"";
    // Serial No — auto-generated, show read-only
    if(col.key==="roll") return (
      <Fld key={col.key} label="Serial No. (auto)" half>
        <div style={{...gISt(),background:W.th,color:W.mu,cursor:"default",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:12}}>🔢</span>
          <span>{editId ? (form.roll||"—") : "Auto-assigned on save"}</span>
        </div>
      </Fld>
    );
    if(col.type==="photo") return (
      <Fld key={col.key} label="Student Photo (JPG/PNG, 15–50 KB)" half>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {v && <img src={v} alt="Preview" style={{width:44,height:52,objectFit:"cover",borderRadius:4,border:"1px solid "+W.bd,flexShrink:0}}/>}
          <div style={{flex:1}}>
            <label style={{display:"block",background:W.acl,border:"1px dashed "+W.ac,borderRadius:4,padding:"6px 10px",cursor:"pointer",fontSize:12,color:W.ac,textAlign:"center",fontFamily:"Segoe UI,sans-serif"}}>
              📷 {v?"Change Photo":"Upload Photo"}
              <input type="file" accept=".jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>{
                const file=e.target.files[0]; if(!file) return;
                if(!["image/jpeg","image/jpg","image/png"].includes(file.type)){alert("Only JPG or PNG files allowed.");return;}
                if(file.size<15*1024){alert("Photo too small. Minimum size is 15 KB.");return;}
                if(file.size>50*1024){alert("Photo too large. Maximum size is 50 KB.");return;}
                const reader=new FileReader();
                reader.onload=ev=>setForm(f=>({...f,photo:ev.target.result}));
                reader.readAsDataURL(file);
              }}/>
            </label>
            {v && <button onClick={()=>setForm(f=>({...f,photo:""}))} style={{marginTop:4,background:"transparent",border:"1px solid "+W.bd,borderRadius:3,padding:"2px 8px",fontSize:10,color:W.er,cursor:"pointer",display:"block",width:"100%"}}>✕ Remove</button>}
            <div style={{fontSize:10,color:W.fa,marginTop:3,fontFamily:"Segoe UI,sans-serif"}}>15 KB – 50 KB · JPG / PNG</div>
          </div>
        </div>
      </Fld>
    );
    if(col.type==="gender") return (
      <Fld key={col.key} label={col.label} half>
        <WS value={v} onChange={e=>setForm(f=>({...f,[col.key]:e.target.value}))}>
          <option value="M">Male</option><option value="F">Female</option>
        </WS>
      </Fld>
    );
    if(col.type==="status") return (
      <Fld key={col.key} label={col.label} half>
        <WS value={v} onChange={e=>setForm(f=>({...f,[col.key]:e.target.value}))}>
          <option value="new">New Admission</option><option value="old">Old Student</option>
        </WS>
      </Fld>
    );
    if(col.type==="date") return (
      <Fld key={col.key} label={col.label} half>
        <WI type="date" value={v} onChange={e=>setForm(f=>({...f,[col.key]:e.target.value}))}/>
      </Fld>
    );
    if(col.key==="cls") return (
      <Fld key={col.key} label="Class" half>
        <WS value={form.cls} onChange={e=>setForm(f=>({...f,cls:e.target.value}))}>
          {classes.map(c=><option key={c}>{c}</option>)}
        </WS>
      </Fld>
    );
    return (
      <Fld key={col.key} label={col.label} half>
        <WI
          type="text"
          inputMode={col.type==="number"?"numeric":"text"}
          value={v}
          onChange={e=>setForm(f=>({...f,[col.key]:e.target.value}))}
          placeholder={col.label}/>
      </Fld>
    );
  }

  function exportCSV(){
    if(list.length===0){alert("No students to export.");return;}
    const headers = visCols.map(c=>qc(c.label));
    const rows = list.map(s=>visCols.map(c=>qc(s[c.key]||"")));
    const csv = [headers,...rows].map(r=>r.join(",")).join("\r\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download="Class_"+cls+"_Students.csv";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function printApplicationForm(s){
    const photoHTML = s.photo
      ? `<img src="${s.photo}" style="width:90px;height:110px;object-fit:cover;border:2px solid #0067c0;border-radius:4px;" alt="Photo"/>`
      : `<div style="width:90px;height:110px;border:2px dashed #cce4f7;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:36px;background:#f0f6ff;">👤</div>`;

    const fieldRow = (label, value) =>
      `<div class="field-row"><div class="field-label">${label}</div><div class="field-value">${value||"—"}</div></div>`;

    const allCols = cols.filter(c=>c.visible && c.key!=="photo" && c.key!=="typ");
    const fieldGroups = [];
    for(let i=0;i<allCols.length;i+=2){
      const a=allCols[i], b=allCols[i+1];
      let label_a = a.label, val_a = s[a.key]||"";
      if(a.type==="gender") val_a = val_a==="M"?"Male":"Female";
      fieldGroups.push(
        `<div class="field-group">` +
        `<div class="field-row"><div class="field-label">${label_a}</div><div class="field-value">${val_a||"—"}</div></div>` +
        (b ? `<div class="field-row"><div class="field-label">${b.label}</div><div class="field-value">${(b.type==="gender"?(s[b.key]==="M"?"Male":"Female"):s[b.key])||"—"}</div></div>` : "") +
        `</div>`
      );
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Application Form — ${s.name}</title><style>
*{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}
body{max-width:700px;margin:0 auto;padding:24px;color:#1a1a1a}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0067c0;padding-bottom:14px;margin-bottom:18px}
.hdr-left{flex:1}
.school-name{font-size:20px;font-weight:700;color:#0067c0}
.school-addr{font-size:11px;color:#666;margin-top:3px}
.form-title{font-size:14px;font-weight:700;color:#333;margin-top:6px;text-transform:uppercase;letter-spacing:1px}
.session-badge{background:#e8f0fb;color:#0067c0;font-size:11px;font-weight:600;padding:2px 10px;border-radius:3px;margin-top:4px;display:inline-block}
.top-section{display:flex;gap:18px;margin-bottom:16px;align-items:flex-start}
.photo-box{flex-shrink:0}
.info-box{flex:1}
.sno-bar{background:#0067c0;color:#fff;padding:5px 14px;border-radius:4px;font-size:13px;font-weight:700;margin-bottom:10px;display:inline-block}
.field-group{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:0}
.field-row{display:flex;border:1px solid #d0d8e8;margin-top:-1px;margin-left:-1px}
.field-label{background:#eef3fb;color:#0067c0;font-size:11px;font-weight:600;padding:5px 8px;min-width:110px;border-right:1px solid #d0d8e8;flex-shrink:0}
.field-value{font-size:12px;padding:5px 8px;color:#1a1a1a;flex:1;word-break:break-word}
.section-title{font-size:12px;font-weight:700;color:#0067c0;background:#e8f0fb;padding:5px 10px;border-left:4px solid #0067c0;margin:14px 0 0;border-radius:0 4px 4px 0}
.decl{font-size:11px;color:#555;margin:14px 0 8px;line-height:1.6;border:1px solid #e0e0e0;padding:8px 12px;border-radius:4px;background:#fafafa}
.sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:24px}
.sig-line{border-top:1px solid #888;padding-top:5px;margin-top:28px;font-size:11px;color:#888;text-align:center}
.footer{text-align:right;font-size:10px;color:#bbb;margin-top:16px;border-top:1px solid #eee;padding-top:6px}
.status-badge{padding:2px 10px;border-radius:3px;font-size:11px;font-weight:700;display:inline-block}
@media print{body{padding:6px}@page{margin:1cm;size:A4}}
</style></head><body>

${buildPrintHeader(logo,null,null,logoAlign,school,schoolAddr,sess,"Admission Application",{email:schoolEmail,phone:schoolPhone,website:schoolWebsite})}
<div style="display:flex;justify-content:flex-end;margin-bottom:12px">
  <div style="text-align:right;font-size:10px;color:#888">
    <div style="margin-bottom:4px">Application No. <span style="display:inline-block;width:80px;height:20px;border-bottom:1px solid #aaa"></span></div>
    <div>Date: ___________</div>
  </div>
</div>

<div class="top-section">
  <div class="photo-box">
    ${photoHTML}
    <div style="text-align:center;font-size:9px;color:#888;margin-top:4px">Student Photo</div>
  </div>
  <div class="info-box">
    <div class="sno-bar">Serial No: ${s.roll}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
      <div class="field-row"><div class="field-label">Student Name</div><div class="field-value" style="font-weight:700">${s.name||"—"}</div></div>
      <div class="field-row"><div class="field-label">Class</div><div class="field-value" style="font-weight:700">${s.cls||"—"}</div></div>
      <div class="field-row"><div class="field-label">Status</div><div class="field-value"><span class="status-badge" style="background:${s.typ==="new"?"#dff6dd":"#ebebeb"};color:${s.typ==="new"?"#107c10":"#555"}">${s.typ==="new"?"New Admission":"Old Student"}</span></div></div>
      <div class="field-row"><div class="field-label">Gender</div><div class="field-value">${s.sex==="M"?"Male":"Female"}</div></div>
    </div>
  </div>
</div>

<div class="section-title">Personal &amp; Family Information</div>
<div style="border:1px solid #d0d8e8;border-radius:4px;overflow:hidden;margin-top:6px">
  ${fieldGroups.join("")}
</div>

<div class="decl">
  I hereby declare that the information provided above is true and correct to the best of my knowledge. I agree to abide by the rules and regulations of ${school}.
</div>

<div class="sigs">
  <div><div class="sig-line">Parent / Guardian Signature</div></div>
  <div><div class="sig-line">Class Teacher</div></div>
  <div><div class="sig-line">Principal</div></div>
</div>

<div class="footer">${school} &nbsp;·&nbsp; Session ${sess} &nbsp;·&nbsp; Printed: ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
</body></html>`;

    const _wmHtml = buildWatermarkHTML(watermark);
    if(_wmHtml) html = html.replace(/<\/body>/i, _wmHtml+"</body>");
    printHTML(html, "ApplicationForm_"+s.name+"_"+s.cls);
  }

  function exportPDF(){
    if(list.length===0){alert("No students to export.");return;}
    const CSS=`*{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}
body{padding:24px;color:#1a1a1a}${buildWatermarkCSS(watermark)}
.hdr{text-align:center;border-bottom:3px solid #0067c0;padding-bottom:14px;margin-bottom:20px}
.sch{font-size:24px;font-weight:700;color:#0067c0;letter-spacing:0.5px}
.addr{font-size:12px;color:#555;margin-top:4px}
.sub{font-size:13px;color:#333;margin-top:6px;font-weight:600}
.badge{display:inline-block;background:#e8f0fb;color:#0067c0;border-radius:4px;padding:2px 10px;font-size:11px;margin-top:4px;margin-right:4px}
.info-row{display:flex;gap:16px;background:#f0f6ff;border:1px solid #cce4f7;border-radius:4px;padding:10px 14px;margin-bottom:16px;font-size:12px;flex-wrap:wrap}
.info-item{color:#555}.info-val{font-weight:700;color:#1a1a1a;margin-left:4px}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px}
thead tr{background:#0067c0}
th{color:#fff;padding:8px 10px;text-align:left;font-weight:600;letter-spacing:0.3px}
td{padding:6px 10px;border-bottom:1px solid #e8e8e8;vertical-align:top}
tr:nth-child(even) td{background:#f8fbff}
tr:nth-child(odd) td{background:#fff}
.roll{font-weight:700;color:#0067c0}
.name{font-weight:600;color:#1a1a1a}
.foot{margin-top:16px;border-top:2px solid #0067c0;padding-top:8px;display:flex;justify-content:space-between;font-size:11px;color:#777}
.stamp{border:1px dashed #ccc;border-radius:4px;padding:8px 16px;text-align:center;font-size:11px;color:#aaa;margin-top:20px}
@media print{body{padding:6px}@page{margin:1cm}}`;
    const ths = visCols.map(c=>"<th>"+c.label+"</th>").join("");
    const rows = list.map((s,i)=>{
      return "<tr>"+visCols.map(c=>{
        const v=s[c.key]||"";
        if(c.key==="roll") return "<td class='roll' style='text-align:center;font-weight:700'>"+v+"</td>";
        if(c.key==="photo") return "<td style='text-align:center;padding:2px'>"+(v?"<img src='"+v+"' style='width:28px;height:34px;object-fit:cover;border-radius:2px;border:1px solid #ddd'/>":"—")+"</td>";
        if(c.key==="name") return "<td class='name'>"+v+"</td>";
        return "<td>"+v+"</td>";
      }).join("")+"</tr>";
    }).join("");
    let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Student List — ${cls}</title><style>${CSS}</style></head><body>`;
    html+=buildPrintHeader(logo,null,null,logoAlign,school,schoolAddr,sess,"Student Admission Register &bull; Class "+cls,{email:schoolEmail,phone:schoolPhone,website:schoolWebsite});
    html+=`
<div class="hdr">
  ${buildLogoHTML(logo, logoAlign)}
  <div class="sch">${school}</div>
  ${schoolAddr?"<div class='addr'>"+schoolAddr+"</div>":""}
  <div class="sub">Student Admission Register</div>
  <div style="margin-top:6px">
    <span class="badge">Session: ${sess}</span>
    <span class="badge">Class: ${cls}</span>
    <span class="badge">Total: ${list.length} Students</span>
  </div>
</div>
<div class="info-row">
  <span class="info-item">Boys:<span class="info-val">${list.filter(s=>s.sex==="M").length}</span></span>
  <span class="info-item">Girls:<span class="info-val">${list.filter(s=>s.sex==="F").length}</span></span>
  <span class="info-item">New Admissions:<span class="info-val">${list.filter(s=>s.typ==="new").length}</span></span>
  <span class="info-item">Old Students:<span class="info-val">${list.filter(s=>s.typ!=="new").length}</span></span>
  <span class="info-item">Columns:<span class="info-val">${visCols.length}</span></span>
</div>
<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>
<div class="stamp">🖊 Class Teacher Signature: ___________________________ &nbsp;&nbsp;&nbsp; Date: ___________</div>
<div class="foot"><span>Generated: ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</span><span>${school}</span></div>
</body></html>`;
    const _wmHtml = buildWatermarkHTML(watermark);
    if(_wmHtml) html = html.replace(/<\/body>/i, _wmHtml+"</body>");
    printHTML(html, "Students_"+cls+"_"+sess);
  }

  // Pair form fields: group into rows of 2
  const formCols = cols.filter(c=>c.key!=="typ"&&c.key!=="cls"&&c.key!=="sess");
  const extraCols = cols.filter(c=>c.key==="typ"||c.key==="cls"||c.key==="sess");

  return (
    <div style={{padding:20}}>
      {isArchived&&<ArchivedBanner sess={sess}/>}
      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:13,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>Class:</span>
          <WS value={cls} onChange={e=>setCls(e.target.value)} style={{width:120}}>
            {classes.map(c=><option key={c}>{c}</option>)}
          </WS>
          <span style={{fontSize:12,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>({students.filter(s=>s.cls===cls).length} students)</span>
          <WB onClick={onManageClasses} style={{padding:"4px 10px",fontSize:12,background:W.acl,border:"1px solid "+W.bd,color:W.ac}}>🗂️ Manage Classes</WB>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",fontSize:13,color:W.fa}}>🔍</span>
            <WI placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:26,width:160}}/>
          </div>
          <WB onClick={()=>setShowCols(true)} style={{background:W.wnb,border:"1px solid "+W.wn,color:W.wn,fontSize:12,padding:"4px 10px"}}>⚙️ Columns ({visCols.length})</WB>
          <WB onClick={exportPDF}>📄 PDF</WB>
          <WB onClick={()=>setShowI(true)}>📤 Import</WB>
          {!isArchived&&<WB v="p" onClick={()=>{setForm(emptyForm(cls,cols));setEditId(null);setShowF(true);}}>➕ Add Student</WB>}
        </div>
      </div>

      {/* Class info bar */}
      <div style={{background:W.acl,borderLeft:"3px solid "+W.ac,border:"1px solid "+W.bd,padding:"6px 14px",marginBottom:10,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:13,fontWeight:600,color:W.ac,fontFamily:"Segoe UI,sans-serif"}}>Class — {cls} &nbsp;|&nbsp; {list.length} Students</span>
        <div style={{display:"flex",gap:6}}>
          <Tag t="blue">{students.filter(s=>s.cls===cls&&s.sex==="M").length} Boys</Tag>
          <Tag t="purple">{students.filter(s=>s.cls===cls&&s.sex==="F").length} Girls</Tag>
          <Tag t="green">{students.filter(s=>s.cls===cls&&s.typ==="new").length} New</Tag>
        </div>
      </div>

      {/* Table */}
      <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:4,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:Math.max(600,visCols.length*110)}}>
          <thead>
            <tr>
              {visCols.map(col=>(
                <TH key={col.key} onClick={()=>setSort(col.key)} sorted={sort===col.key}>{col.label}</TH>
              ))}
              <TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {list.length===0&&(
              <tr><td colSpan={visCols.length+1} style={{textAlign:"center",padding:40,color:W.fa,fontSize:13,fontFamily:"Segoe UI,sans-serif"}}>
                No students in Class {cls}. Click <b>➕ Add Student</b> to begin.
              </td></tr>
            )}
            {list.map((s,i)=>(
              <tr key={s.id} style={{background:i%2===1?W.ta:W.sf}}
                onMouseEnter={e=>e.currentTarget.style.background=W.rowHov}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===1?W.ta:W.sf}>
                {visCols.map(col=>renderCell(s,col))}
                <TD>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {!isArchived&&<WB style={{padding:"3px 8px",fontSize:12}} onClick={()=>{setForm({...s});setEditId(s.id);setShowF(true);}}>✏️ Edit</WB>}
                    {!isArchived&&<WB v="e" style={{padding:"3px 8px",fontSize:12}} onClick={()=>del(s.id)}>🗑</WB>}
                    <WB style={{padding:"3px 8px",fontSize:12,background:"#f0f4ff",border:"1px solid "+W.acl,color:W.ac}} title="Print Application Form" onClick={()=>printApplicationForm(s)}>🖨️ Form</WB>
                  </div>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:5,fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{list.length} record(s) · {visCols.length} columns visible · Click headers to sort</div>

      {/* Add/Edit Modal */}
      {showF&&(
        <Modal title={editId?"Edit Student Record":"New Student Admission"} icon="👤" onClose={()=>setShowF(false)} w={660}>
          {/* Render form fields in pairs */}
          {(()=>{
            const fields = cols.filter(c=>c.key!=="cls"&&c.key!=="sess");
            const pairs = [];
            for(let i=0;i<fields.length;i+=2) pairs.push(fields.slice(i,i+2));
            return pairs.map((pair,pi)=>(
              <Row key={pi}>{pair.map(col=>renderFormField(col))}</Row>
            ));
          })()}
          <Row>
            <Fld label="Class" half>
              <WS value={form.cls} onChange={e=>setForm(f=>({...f,cls:e.target.value}))}>
                {classes.map(c=><option key={c}>{c}</option>)}
              </WS>
            </Fld>
            <Fld label="Session" half>
              <WS value={form.sess||"2026-27"} onChange={e=>setForm(f=>({...f,sess:e.target.value}))}>
                {["2025-26","2026-27","2027-28"].map(s=><option key={s}>{s}</option>)}
              </WS>
            </Fld>
          </Row>
          <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end",borderTop:"1px solid "+W.bd,paddingTop:12}}>
            <WB onClick={()=>setShowF(false)}>Cancel</WB>
            <WB v="p" onClick={save}>{editId?"Save Changes":"Admit Student"}</WB>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showI&&(
        <Modal title="Import Students from CSV" icon="📥" onClose={()=>setShowI(false)}>
          <p style={{fontSize:13,color:W.mu,margin:"0 0 10px",fontFamily:"Segoe UI,sans-serif"}}>
            CSV columns must match visible column labels:<br/>
            <b>{visCols.map(c=>c.label).join(", ")}</b>
          </p>
          <input type="file" accept=".csv" onChange={e=>{
            const file=e.target.files[0];if(!file)return;
            const reader=new FileReader();
            reader.onload=ev=>{
              const lines=ev.target.result.split("\n").slice(1);
              const ns=lines.filter(l=>l.trim()).map((line,i)=>{
                const parts=line.split(",").map(p=>p.replace(/^"|"$/g,"").trim());
                const obj={id:Date.now()+i,cls,sess:"2026-27"};
                visCols.forEach((col,ci)=>{obj[col.key]=parts[ci]||"";});
                if(!obj.roll)obj.roll=String(i+1).padStart(2,"0");
                // Normalize sex: "Male"/"male"/"m"/"Boy" → "M", anything else → "F"
                const rawSex=String(obj.sex||"").trim().toLowerCase();
                obj.sex=["m","male","boy","boys","b"].includes(rawSex)?"M":"F";
                // Normalize typ: "new"/"New Admission" → "new", else "old"
                const rawTyp=String(obj.typ||"").trim().toLowerCase();
                obj.typ=["new","new admission","fresh"].includes(rawTyp)?"new":"old";
                if(!obj.typ)obj.typ="new";
                return obj;
              });
              setStudents(p=>[...p,...ns]);
              ns.forEach(s=>setFees(p=>({...p,[s.id]:{total:2000,pay:[]}})));
              setShowI(false);
              alert(ns.length+" students imported into Class "+cls+".");
            };
            reader.readAsText(file);
          }} style={{...gISt(),cursor:"pointer"}}/>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}><WB onClick={()=>setShowI(false)}>Close</WB></div>
        </Modal>
      )}

      {/* Column Manager Modal */}
      {showCols&&(
        <ColManager
          cols={cols}
          onSave={c=>{setCols(c);setShowCols(false);}}
          onClose={()=>setShowCols(false)}
        />
      )}
    </div>
  );
}

// ─── Fee Management ───────────────────────────────────────────────────────────
function FeeManagement({students,fees,setFees,classes,school,sess,schoolAddr,logo,logoAlign,watermark,schoolEmail,schoolPhone,schoolWebsite,isArchived}){
  const [cls,setCls]     = useState("All");
  const [q,setQ]         = useState("");
  const [statusFilter,setStatusFilter] = useState("All"); // All | Cleared | Partial | Pending
  const [sel,setSel]     = useState(null);
  const [mod,setMod]     = useState(null);
  const [pf,setPf]       = useState({amt:"",dt:new Date().toISOString().split("T")[0],mo:MONTHS[new Date().getMonth()],by:"Cash"});
  const [nf,setNf]       = useState("");

  const fi = id => {
    const f=fees[id]||{total:0,pay:[]};
    const paid=(f.pay||[]).reduce((s,p)=>s+Number(p.amt),0);
    return{total:f.total,paid,bal:f.total-paid,pay:f.pay||[]};
  };
  const statusOf = id => { const f=fi(id); return f.bal===0?"Cleared":"Due"; };

  const list = useMemo(()=>students.filter(s=>{
    if(cls!=="All"&&s.cls!==cls) return false;
    if(q&&!s.name.toLowerCase().includes(q.toLowerCase())&&!s.roll.includes(q)) return false;
    if(statusFilter!=="All"&&statusOf(s.id)!==statusFilter) return false;
    return true;
  }),[students,cls,q,statusFilter,fees]);

  const tots = useMemo(()=>{
    let due=0,paid=0;
    students.forEach(s=>{const f=fi(s.id);due+=f.total;paid+=f.paid;});
    return{
      due,paid,bal:due-paid,
      cleared:students.filter(s=>statusOf(s.id)==="Cleared").length,
      dueCnt:students.filter(s=>statusOf(s.id)==="Due").length,
    };
  },[students,fees]);

  function savePay(){
    if(!pf.amt||isNaN(pf.amt)){alert("Enter a valid amount");return;}
    setFees(p=>{const ex=p[sel.id]||{total:0,pay:[]};return{...p,[sel.id]:{...ex,pay:[...(ex.pay||[]),{...pf,amt:Number(pf.amt)}]}};});
    setMod(null);
  }
  function saveFee(){
    if(!nf||isNaN(nf)){alert("Enter a valid fee");return;}
    setFees(p=>({...p,[sel.id]:{...(p[sel.id]||{pay:[]}),total:Number(nf)}}));
    setMod(null);
  }
  function setAllFee(c,amt){
    const cs=students.filter(s=>s.cls===c);
    setFees(p=>{const n={...p};cs.forEach(s=>{n[s.id]={...(n[s.id]||{pay:[]}),total:amt};});return n;});
    setMod(null);
  }

  function printReceipt(s){
    const f=fi(s.id);
    const allPay=[...f.pay].reverse();
    const receiptNo="RCP"+String(s.id).slice(-6)+"-"+f.pay.length;
    const CSS=`*{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}
body{max-width:480px;margin:0 auto;padding:28px;color:#1a1a1a}${buildWatermarkCSS(watermark)}
.outer{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-top:0}
.top{background:#0067c0;padding:16px 20px;text-align:center;color:#fff}
.top .sch{font-size:18px;font-weight:700;letter-spacing:0.5px}
.top .addr{font-size:11px;opacity:0.85;margin-top:3px}
.top .rcpt-title{font-size:13px;font-weight:600;margin-top:8px;background:rgba(255,255,255,0.2);display:inline-block;padding:2px 14px;border-radius:10px}
.body{padding:16px 20px}
.rcpt-no{font-size:10px;color:#888;text-align:right;margin-bottom:10px}
.section{border:1px solid #e0e0e0;border-radius:4px;overflow:hidden;margin-bottom:10px}
.section-hdr{background:#f0f6ff;padding:5px 10px;font-size:11px;font-weight:700;color:#0067c0;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e0e0e0}
.row{display:flex;justify-content:space-between;padding:5px 10px;font-size:12px;border-bottom:1px solid #f0f0f0}
.row:last-child{border-bottom:none}
.lbl{color:#666}.val{font-weight:600;color:#1a1a1a}
.fee-row{display:flex;justify-content:space-between;padding:6px 10px;font-size:13px;border-bottom:1px solid #f0f0f0}
.fee-row:last-child{border-bottom:none}
.total-row{display:flex;justify-content:space-between;padding:8px 10px;font-size:14px;font-weight:700;background:#f8f8f8}
.green{color:#107c10}.red{color:#c42b1c}
.hist-hdr{background:#f8f8f8;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:4px 10px;font-size:10px;font-weight:700;color:#888;border-bottom:1px solid #e0e0e0;text-transform:uppercase}
.hist-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;padding:4px 10px;font-size:11px;border-bottom:1px solid #f0f0f0}
.hist-row:last-child{border-bottom:none}
.status-bar{text-align:center;padding:10px;font-size:13px;font-weight:700;border-radius:4px;margin-bottom:10px}
.sigs{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:16px;text-align:center;font-size:11px;color:#888}
.sig-line{border-top:1px solid #ccc;padding-top:5px;margin-top:20px}
.footer{text-align:center;font-size:10px;color:#bbb;margin-top:12px;border-top:1px solid #f0f0f0;padding-top:8px}
@media print{body{padding:4px;max-width:100%}@page{margin:0.5cm}}`;

    const statusColor = f.bal===0?"#107c10":"#c42b1c";
    const statusBg    = f.bal===0?"#dff6dd":"#fde7e4";
    const statusText  = f.bal===0?"✓ FULLY CLEARED":"⚠ BALANCE DUE — Rs."+f.bal.toLocaleString();

    const histRows = allPay.length===0
      ? "<div style='padding:8px 10px;font-size:11px;color:#aaa;text-align:center'>No payments recorded</div>"
      : "<div class='hist-hdr'><span>Month</span><span>Date</span><span>Amount</span><span>Method</span></div>"
        + allPay.map(p=>
          "<div class='hist-row'>"
          +"<span>"+p.mo+"</span>"
          +"<span style='color:#888'>"+p.dt+"</span>"
          +"<span style='color:#107c10;font-weight:600'>Rs."+Number(p.amt).toLocaleString()+"</span>"
          +"<span style='color:#888'>"+p.by+"</span>"
          +"</div>"
        ).join("");

    let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fee Receipt — ${s.name}</title><style>${CSS}</style></head><body>
${buildPrintHeader(logo,null,null,logoAlign,school,schoolAddr,sess,"Fee Receipt",{email:schoolEmail,phone:schoolPhone,website:schoolWebsite})}
<div class="outer">
  <div class="body">
    <div class="rcpt-no">Receipt No: ${receiptNo} &nbsp;|&nbsp; Printed: ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>

    <div class="section">
      <div class="section-hdr">Student Details</div>
      <div class="row"><span class="lbl">Student Name</span><span class="val">${s.name}</span></div>
      <div class="row"><span class="lbl">Class &amp; Roll</span><span class="val">${s.cls} &nbsp;|&nbsp; S.No ${s.roll}</span></div>
      <div class="row"><span class="lbl">Father's Name</span><span class="val">${s.dad||"—"}</span></div>
      <div class="row"><span class="lbl">Session</span><span class="val">${sess}</span></div>
    </div>

    <div class="status-bar" style="background:${statusBg};color:${statusColor}">${statusText}</div>

    <div class="section">
      <div class="section-hdr">Fee Summary</div>
      <div class="fee-row"><span class="lbl">Total Annual Fee</span><span class="val">Rs.${f.total.toLocaleString()}</span></div>
      <div class="fee-row"><span class="lbl">Total Paid</span><span class="val green">Rs.${f.paid.toLocaleString()}</span></div>
      <div class="total-row"><span>Balance Due</span><span class="${f.bal>0?"red":"green"}">Rs.${f.bal.toLocaleString()}</span></div>
    </div>

    <div class="section">
      <div class="section-hdr">Payment History (${allPay.length} transactions)</div>
      ${histRows}
    </div>

    <div class="sigs">
      <div><div class="sig-line">Parent / Guardian</div></div>
      <div><div class="sig-line">Cashier / Accountant</div></div>
    </div>
    <div class="footer">${school} &nbsp;·&nbsp; Session ${sess} &nbsp;·&nbsp; This is a computer-generated receipt</div>
  </div>
</div>
</body></html>`;
    const _wmHtml = buildWatermarkHTML(watermark);
    if(_wmHtml) html = html.replace(/<\/body>/i, _wmHtml+"</body>");
    printHTML(html, "FeeReceipt_"+s.name+"_"+s.cls);
  }

  function exportListPDF(){
    if(list.length===0){alert("No records to export.");return;}
    const filterLabel = [
      cls!=="All"?"Class: "+cls:"",
      statusFilter!=="All"?"Status: "+statusFilter:"",
      q?"Search: "+q:"",
    ].filter(Boolean).join(" · ")||"All Students";

    const listTot  = list.reduce((s,x)=>s+fi(x.id).total,0);
    const listPaid = list.reduce((s,x)=>s+fi(x.id).paid,0);
    const listBal  = list.reduce((s,x)=>s+fi(x.id).bal,0);

    const statusColor = st => st==="Cleared"?"#107c10":"#c42b1c";
    const statusBg    = st => st==="Cleared"?"#dff6dd":"#fde7e4";

    const rows = list.map((s,i)=>{
      const f=fi(s.id);
      const st=statusOf(s.id);
      const pct=f.total>0?Math.round(f.paid/f.total*100):0;
      return "<tr style='background:"+(i%2===0?"#fff":"#f8f8f8")+"'>"
        +"<td>"+(i+1)+"</td>"
        +"<td>"+s.roll+"</td>"
        +"<td><b>"+s.name+"</b><br><span style='font-size:10px;color:#888'>"+s.dad+"</span></td>"
        +"<td>"+s.cls+"</td>"
        +"<td style='text-align:right'>Rs."+f.total.toLocaleString()+"</td>"
        +"<td style='text-align:right;color:#107c10;font-weight:600'>Rs."+f.paid.toLocaleString()+"</td>"
        +"<td style='text-align:right;color:"+(f.bal>0?"#c42b1c":"#107c10")+";font-weight:600'>Rs."+f.bal.toLocaleString()+"</td>"
        +"<td style='text-align:center'>"
          +"<div style='background:#e5e5e5;border-radius:3px;height:7px;width:70px;display:inline-block;vertical-align:middle'>"
            +"<div style='background:"+(pct===100?"#107c10":pct>0?"#ca8a04":"#c42b1c")+";height:100%;border-radius:3px;width:"+pct+"%'></div>"
          +"</div>"
          +" <span style='font-size:10px;color:#555'>"+pct+"%</span>"
        +"</td>"
        +"<td style='text-align:center'><span style='background:"+statusBg(st)+";color:"+statusColor(st)+";padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700'>"+st+"</span></td>"
        +"</tr>";
    }).join("");

    const CSS_FEE=`*{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}
body{padding:24px;color:#1a1a1a}${buildWatermarkCSS(watermark)}
.hdr{text-align:center;border-bottom:3px solid #0067c0;padding-bottom:14px;margin-bottom:18px}
.sch{font-size:22px;font-weight:700;color:#0067c0;letter-spacing:0.5px}
.addr{font-size:12px;color:#555;margin-top:3px}
.sub{font-size:13px;color:#333;margin-top:5px;font-weight:600}
.badge{display:inline-block;background:#e8f0fb;color:#0067c0;border-radius:3px;padding:2px 10px;font-size:11px;margin-top:5px;margin-right:4px}
.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.sum-box{border:1px solid #ddd;border-radius:6px;padding:12px;text-align:center}
.sum-val{font-size:18px;font-weight:700}
.sum-lbl{font-size:10px;color:#888;margin-top:3px;text-transform:uppercase;letter-spacing:0.4px}
table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px}
thead tr{background:#0067c0}
th{color:#fff;padding:8px 10px;text-align:left;font-weight:600;letter-spacing:0.3px}
th.r{text-align:right}th.c{text-align:center}
td{padding:6px 10px;border-bottom:1px solid #ebebeb;vertical-align:middle}
tr:nth-child(even) td{background:#f8fbff}
.prog-wrap{background:#e5e5e5;border-radius:3px;height:7px;width:70px;display:inline-block;vertical-align:middle}
.prog-bar{height:100%;border-radius:3px}
.status-badge{padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700}
tfoot td{background:#e8f0fb;font-weight:700;padding:8px 10px;border-top:2px solid #0067c0}
.footer{margin-top:14px;display:flex;justify-content:space-between;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:8px}
@media print{body{padding:6px}@page{margin:1cm}}`;

    let html="<!DOCTYPE html><html><head><meta charset='utf-8'><title>Fee Report</title><style>"+CSS_FEE+"</style></head><body>"
      +(logo?"<div style='text-align:center;margin-bottom:6px'><img src='"+logo+"' style='height:56px;width:auto;object-fit:contain'/></div>":"")
        +"<div class='hdr'>"
        +"<div class='sch'>"+school+"</div>"
        +(schoolAddr?"<div class='addr'>"+schoolAddr+"</div>":"")
        +"<div class='sub'>Fee Collection Report</div>"
        +"<div><span class='badge'>Session: "+sess+"</span><span class='badge'>Filter: "+filterLabel+"</span><span class='badge'>"+list.length+" Students</span></div>"
      +"</div>"
      +"<div class='summary'>"
        +"<div class='sum-box'><div class='sum-val' style='color:#0067c0'>Rs."+listTot.toLocaleString()+"</div><div class='sum-lbl'>Total Fee</div></div>"
        +"<div class='sum-box'><div class='sum-val' style='color:#107c10'>Rs."+listPaid.toLocaleString()+"</div><div class='sum-lbl'>Collected</div></div>"
        +"<div class='sum-box'><div class='sum-val' style='color:#c42b1c'>Rs."+listBal.toLocaleString()+"</div><div class='sum-lbl'>Outstanding</div></div>"
      +"</div>"
      +"<table><thead><tr><th>#</th><th>S.No</th><th>Student</th><th>Class</th><th class='r'>Total Fee</th><th class='r'>Paid</th><th class='r'>Balance</th><th class='c'>Progress</th><th class='c'>Status</th></tr></thead>"
      +"<tbody>"+rows+"</tbody>"
      +"<tfoot><tr>"
        +"<td colspan='4'>Totals ("+list.length+" students)</td>"
        +"<td style='text-align:right'>Rs."+listTot.toLocaleString()+"</td>"
        +"<td style='text-align:right;color:#107c10'>Rs."+listPaid.toLocaleString()+"</td>"
        +"<td style='text-align:right;color:#c42b1c'>Rs."+listBal.toLocaleString()+"</td>"
        +"<td colspan='2'></td>"
      +"</tr></tfoot></table>"
      +"<div class='footer'><span>Generated: "+new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})+"</span><span>"+school+"</span></div>"
      +"</body></html>"
    const _wmHtml = buildWatermarkHTML(watermark);
    if(_wmHtml) html = html.replace(/<\/body>/i, _wmHtml+"</body>");
    printHTML(html, "FeeReport_"+cls+"_"+sess);
  }

  const STATUS_FILTERS = [
    {id:"All",    label:"All Students",         icon:"👥", color:W.ac},
    {id:"Due",    label:"Due / Partially Paid", icon:"🔴", color:W.er},
    {id:"Cleared",label:"Fully Cleared",        icon:"🟢", color:W.ok},
  ];

  return (
    <div style={{padding:20}}>

      {/* Summary tiles — clickable to filter */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:14}}>
        {[
          {id:"All",    l:"All Students",          v:students.length,                    c:W.ac,  sub:"Rs."+tots.due.toLocaleString()+" total fee"},
          {id:"Due",    l:"Due / Partially Paid",  v:tots.dueCnt,                        c:W.er,  sub:"Rs."+tots.bal.toLocaleString()+" outstanding"},
          {id:"Cleared",l:"Fully Cleared",         v:tots.cleared,                       c:W.ok,  sub:"Rs."+tots.paid.toLocaleString()+" collected"},
        ].map((s,i)=>(
          <div key={i} onClick={()=>setStatusFilter(s.id)}
            style={{background:W.sf,border:"1px solid "+(statusFilter===s.id?s.c:W.bd),borderLeft:"3px solid "+s.c,borderRadius:4,padding:"10px 14px",cursor:"pointer",transition:"all 0.15s",boxShadow:statusFilter===s.id?"0 0 0 2px "+s.c+"33":"none"}}>
            <div style={{fontSize:17,fontWeight:700,color:s.c,fontFamily:"Segoe UI,sans-serif"}}>{s.v}</div>
            <div style={{fontSize:12,color:W.mu,fontFamily:"Segoe UI,sans-serif",marginTop:2}}>{s.l}</div>
            <div style={{fontSize:10,color:W.fa,fontFamily:"Segoe UI,sans-serif",marginTop:1}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:6,padding:"10px 14px",marginBottom:10}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {/* Class filter */}
          <span style={{fontSize:12,color:W.mu,fontFamily:"Segoe UI,sans-serif",whiteSpace:"nowrap"}}>Class:</span>
          <WS value={cls} onChange={e=>setCls(e.target.value)} style={{width:110}}>
            <option>All</option>{classes.map(c=><option key={c}>{c}</option>)}
          </WS>

          {/* Status filter chips */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {STATUS_FILTERS.map(sf=>(
              <button key={sf.id+"_"+sf.label} onClick={()=>setStatusFilter(sf.id)}
                style={{padding:"4px 10px",borderRadius:14,border:"1px solid "+(statusFilter===sf.id&&sf.label===STATUS_FILTERS.find(x=>x.id===statusFilter)?.label?sf.color:W.bd),background:statusFilter===sf.id?sf.color+"22":W.sf,color:statusFilter===sf.id?sf.color:W.mu,fontSize:12,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",fontWeight:statusFilter===sf.id?600:400,whiteSpace:"nowrap"}}>
                {sf.icon} {sf.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{position:"relative",flex:1,minWidth:160}}>
            <span style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",fontSize:13,color:W.fa}}>🔍</span>
            <WI placeholder="Search student name or roll…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:26}}/>
          </div>

          {/* Export PDF */}
          <WB onClick={exportListPDF} style={{background:W.er,border:"1px solid #a32012",color:"#fff",padding:"5px 12px",flexShrink:0}}>
            📄 Export PDF
          </WB>

          {/* Reset */}
          {(cls!=="All"||statusFilter!=="All"||q)&&(
            <WB onClick={()=>{setCls("All");setStatusFilter("All");setQ("");}} style={{fontSize:12,padding:"5px 10px"}}>
              ✕ Reset
            </WB>
          )}
        </div>

        {/* Active filter summary */}
        <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>
            Showing <b style={{color:W.tx}}>{list.length}</b> of <b style={{color:W.tx}}>{students.length}</b> students
            {statusFilter!=="All"&&<> &nbsp;·&nbsp; <span style={{color:STATUS_FILTERS.find(s=>s.id===statusFilter)?.color}}>{statusFilter} only</span></>}
            {cls!=="All"&&<> &nbsp;·&nbsp; Class {cls}</>}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:4,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:860}}>
          <thead>
            <tr>
              {["S.No","Student","Class","Total Fee","Paid","Balance","Progress","Status","Actions"].map(h=><TH key={h}>{h}</TH>)}
            </tr>
          </thead>
          <tbody>
            {list.length===0&&(
              <tr><td colSpan={9} style={{textAlign:"center",padding:40,color:W.fa,fontSize:13,fontFamily:"Segoe UI,sans-serif"}}>
                No students match the current filter.{" "}
                <button onClick={()=>{setCls("All");setStatusFilter("All");setQ("");}}
                  style={{background:"none",border:"none",color:W.ac,cursor:"pointer",fontSize:13,textDecoration:"underline"}}>Clear filters</button>
              </td></tr>
            )}
            {list.map((s,i)=>{
              const f=fi(s.id);
              const pct=f.total>0?Math.round(f.paid/f.total*100):0;
              const status=statusOf(s.id);
              return (
                <tr key={s.id} style={{background:i%2===1?W.ta:W.sf}}
                  onMouseEnter={e=>e.currentTarget.style.background=W.rowHov}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===1?W.ta:W.sf}>
                  <TD style={{fontWeight:700,color:W.ac}}>{s.roll}</TD>
                  <TD>
                    <div style={{fontWeight:600,color:W.tx}}>{s.name}</div>
                    <div style={{fontSize:11,color:W.fa}}>{s.dad}</div>
                  </TD>
                  <TD><Tag t="blue">{s.cls}</Tag></TD>
                  <TD style={{whiteSpace:"nowrap"}}>Rs.{f.total.toLocaleString()}</TD>
                  <TD style={{color:W.ok,fontWeight:600,whiteSpace:"nowrap"}}>Rs.{f.paid.toLocaleString()}</TD>
                  <TD style={{color:f.bal>0?W.er:W.ok,fontWeight:600,whiteSpace:"nowrap"}}>Rs.{f.bal.toLocaleString()}</TD>
                  <TD>
                    <div style={{background:W.bd,borderRadius:2,height:8,width:90}}>
                      <div style={{background:pct===100?W.ok:pct>0?"#ca8a04":W.er,height:"100%",borderRadius:2,width:pct+"%"}}/>
                    </div>
                    <div style={{fontSize:11,color:W.fa,marginTop:2}}>{pct}%</div>
                  </TD>
                  <TD>
                    <Tag t={status==="Cleared"?"green":"red"}>{status}</Tag>
                  </TD>
                  <TD>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {!isArchived&&<WB style={{padding:"3px 7px",fontSize:11}} onClick={()=>{setSel(s);setNf(f.total);setMod("fee");}}>Set Fee</WB>}
                      {!isArchived&&<WB v="p" style={{padding:"3px 7px",fontSize:11}} onClick={()=>{setSel(s);setPf({amt:"",dt:new Date().toISOString().split("T")[0],mo:MONTHS[new Date().getMonth()],by:"Cash"});setMod("pay");}}>+Pay</WB>}
                      <WB style={{padding:"3px 7px",fontSize:11}} onClick={()=>{setSel(s);setMod("hist");}}>History</WB>
                      <WB style={{padding:"3px 7px",fontSize:11}} onClick={()=>printReceipt(s)}>🖨️</WB>
                    </div>
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:5,fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{list.length} record(s) shown · Click summary tiles to quick-filter</div>

      {/* Set Fee Modal */}
      {mod==="fee"&&sel&&(
        <Modal title={"Set Fee — "+sel.name+" ("+sel.cls+")"} icon="💳" onClose={()=>setMod(null)}>
          <p style={{fontSize:13,color:W.mu,margin:"0 0 10px",fontFamily:"Segoe UI,sans-serif"}}>Current: <b>Rs.{fi(sel.id).total.toLocaleString()}</b></p>
          <Fld label="New Total Fee (Rs)"><WI type="number" value={nf} onChange={e=>setNf(e.target.value)} placeholder="Enter amount"/></Fld>
          <p style={{fontSize:12,color:W.mu,margin:"12px 0 6px",fontFamily:"Segoe UI,sans-serif"}}>Quick-set for ALL students in Class {sel.cls}:</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {[1000,1500,2000,2500,3000,3500,4000].map(amt=>(
              <WB key={amt} style={{fontSize:12}} onClick={()=>setAllFee(sel.cls,amt)}>All→Rs.{amt}</WB>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,borderTop:"1px solid "+W.bd,paddingTop:12}}>
            <WB onClick={()=>setMod(null)}>Cancel</WB>
            <WB v="p" onClick={saveFee}>Save Fee</WB>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {mod==="pay"&&sel&&(
        <Modal title={"Record Payment — "+sel.name} icon="💰" onClose={()=>setMod(null)}>
          {(()=>{const f=fi(sel.id);return(
            <div style={{background:W.acl,border:"1px solid "+W.bd,borderRadius:4,padding:"10px 14px",marginBottom:14,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[["Total",f.total,W.ac],["Paid",f.paid,W.ok],["Balance",f.bal,W.er]].map(([l,v,c])=>(
                <div key={l}>
                  <div style={{fontSize:11,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>{l}</div>
                  <div style={{fontWeight:700,color:c,fontSize:14,fontFamily:"Segoe UI,sans-serif"}}>Rs.{v.toLocaleString()}</div>
                </div>
              ))}
            </div>
          );})()}
          <Row>
            <Fld label="Amount (Rs)" half><WI type="number" value={pf.amt} onChange={e=>setPf(f=>({...f,amt:e.target.value}))} placeholder="Enter amount"/></Fld>
            <Fld label="Date" half><WI type="date" value={pf.dt} onChange={e=>setPf(f=>({...f,dt:e.target.value}))}/></Fld>
          </Row>
          <Row>
            <Fld label="For Month" half><WS value={pf.mo} onChange={e=>setPf(f=>({...f,mo:e.target.value}))}>{MONTHS.map(m=><option key={m}>{m}</option>)}</WS></Fld>
            <Fld label="Method" half><WS value={pf.by} onChange={e=>setPf(f=>({...f,by:e.target.value}))}><option>Cash</option><option>Online</option><option>Cheque</option><option>Bank Transfer</option></WS></Fld>
          </Row>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:14,borderTop:"1px solid "+W.bd,paddingTop:12}}>
            <WB onClick={()=>setMod(null)}>Cancel</WB>
            <WB v="s" onClick={savePay}>✓ Record Payment</WB>
          </div>
        </Modal>
      )}

      {/* Payment History Modal */}
      {mod==="hist"&&sel&&(
        <Modal title={"Payment History — "+sel.name} icon="📋" onClose={()=>setMod(null)}>
          {(()=>{
            const f=fi(sel.id);
            return f.pay.length===0?(
              <div style={{textAlign:"center",padding:"28px 0",color:W.fa,fontSize:13,fontFamily:"Segoe UI,sans-serif"}}>No payment records</div>
            ):(
              <div>
                <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"Segoe UI,sans-serif",fontSize:13}}>
                  <thead><tr>{["Month","Date","Amount","Method"].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
                  <tbody>
                    {f.pay.map((p,i)=>(
                      <tr key={i} style={{background:i%2===1?W.ta:W.sf}}>
                        <TD style={{fontWeight:600}}>{p.mo}</TD>
                        <TD style={{color:W.mu}}>{p.dt}</TD>
                        <TD style={{color:W.ok,fontWeight:600}}>Rs.{Number(p.amt).toLocaleString()}</TD>
                        <TD style={{color:W.mu}}>{p.by}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{marginTop:8,display:"flex",justifyContent:"space-between",fontSize:13,padding:"7px 12px",background:W.th,borderRadius:3,fontFamily:"Segoe UI,sans-serif"}}>
                  <span style={{color:W.mu}}>Total Paid</span>
                  <span style={{fontWeight:700,color:W.ok}}>Rs.{f.paid.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}><WB onClick={()=>setMod(null)}>Close</WB></div>
        </Modal>
      )}
    </div>
  );
}

// ─── Result Record ────────────────────────────────────────────────────────────
const ALL_SUBS = ["English","Urdu","Math","Science","Social Studies","Computer","Physics","Chemistry","Biology","Art","Drawing"];

function AddExamModal({classes,subjects,onSave,onClose,existing}){
  const [name,setName]     = useState(existing?.name||"");
  const [maxM,setMaxM]     = useState(existing?.maxMarks||100);
  const [minP,setMinP]     = useState(existing?.minPass||40);
  const [selCls,setSelCls] = useState(classes[0]||"");
  const [newSub,setNewSub] = useState("");
  const [applyMsg,setApplyMsg] = useState("");
  const [examSubs,setExamSubs] = useState(()=>{
    if(existing?.subjects) return {...existing.subjects};
    const init={};
    classes.forEach(c=>{init[c]=[...(subjects[c]||["English","Math"])];});
    return init;
  });
  const curSubs = examSubs[selCls]||[];

  function addSub(){
    const n=newSub.trim();
    if(!n)return;
    setExamSubs(p=>({...p,[selCls]:[...(p[selCls]||[]),n].filter((x,i,a)=>a.indexOf(x)===i)}));
    setNewSub("");
    setApplyMsg("");
  }
  function rmSub(i){
    setExamSubs(p=>({...p,[selCls]:(p[selCls]||[]).filter((_,j)=>j!==i)}));
    setApplyMsg("");
  }
  function applyToAll(){
    const base=examSubs[selCls]||[];
    const n={};
    classes.forEach(c=>{n[c]=[...base];});
    setExamSubs(n);
    setApplyMsg("✓ Applied to all "+classes.length+" classes");
    setTimeout(()=>setApplyMsg(""),2500);
  }
  function save(){
    if(!name.trim()){alert("Enter an exam name.");return;}
    if(!maxM||isNaN(maxM)||Number(maxM)<1){alert("Enter valid max marks.");return;}
    if(isNaN(minP)||Number(minP)<0){alert("Enter valid minimum pass marks.");return;}
    const finalSubs={};
    classes.forEach(c=>{finalSubs[c]=[...(examSubs[c]||[])];});
    onSave({id:existing?.id||("ex_"+Date.now()),name:name.trim(),maxMarks:Number(maxM),minPass:Number(minP),allClasses:false,subjects:finalSubs});
  }

  return (
    <Modal title={existing?"Edit Exam":"Add New Exam / Test"} icon="📝" onClose={onClose} w={700}>
      <Row>
        <Fld label="Exam Name (e.g. Test 1, Half Yearly, Annual)" half><WI value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Half Yearly Exam"/></Fld>
        <Fld label="Max Marks per Subject" half><WI type="number" value={maxM} onChange={e=>setMaxM(e.target.value)} placeholder="e.g. 100"/></Fld>
      </Row>
      <Row>
        <Fld label="Minimum Pass Marks per Subject" half><WI type="number" value={minP} onChange={e=>setMinP(e.target.value)} placeholder="e.g. 40"/></Fld>
      </Row>

      {/* Per-class subject editor */}
      <div style={{background:W.rb,border:"1px solid "+W.acl,borderRadius:6,padding:14,marginTop:4}}>

        {/* Class tabs */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:W.mu,fontFamily:"Segoe UI,sans-serif",fontWeight:600,marginBottom:6,textTransform:"uppercase",letterSpacing:0.4}}>Select Class to Edit Subjects</div>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
            {classes.map(c=>(
              <button key={c} onClick={()=>{setSelCls(c);setApplyMsg("");}}
                style={{padding:"4px 10px",borderRadius:3,border:"1px solid "+(selCls===c?W.ac:W.bd),background:selCls===c?W.ac:"#fff",color:selCls===c?"#fff":W.mu,fontSize:12,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",fontWeight:selCls===c?600:400}}>
                {c}
                <span style={{fontSize:10,opacity:0.7,marginLeft:4}}>({(examSubs[c]||[]).length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Header row for current class */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6}}>
          <div style={{fontSize:13,fontWeight:700,color:W.ac,fontFamily:"Segoe UI,sans-serif"}}>
            Subjects for <span style={{background:W.ac,color:"#fff",borderRadius:3,padding:"1px 8px",fontSize:12}}>{selCls}</span>
            <span style={{fontSize:11,color:W.fa,fontWeight:400,marginLeft:8}}>{curSubs.length} subject(s)</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {applyMsg&&<span style={{fontSize:12,color:W.ok,fontFamily:"Segoe UI,sans-serif",fontWeight:600}}>{applyMsg}</span>}
            <button onClick={applyToAll}
              style={{background:W.ok,border:"1px solid #0a5c0a",color:"#fff",borderRadius:4,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",display:"inline-flex",alignItems:"center",gap:5}}>
              📋 Apply to All Classes
            </button>
          </div>
        </div>

        {/* Subject list */}
        <div style={{border:"1px solid "+W.bd,borderRadius:4,marginBottom:8,maxHeight:150,overflowY:"auto",background:W.sf}}>
          {curSubs.length===0&&<div style={{padding:16,textAlign:"center",color:W.fa,fontSize:12,fontFamily:"Segoe UI,sans-serif"}}>No subjects for {selCls} — add below or click a quick-add tag</div>}
          {curSubs.map((sub,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",padding:"6px 10px",background:i%2===1?W.ta:W.sf,borderBottom:i<curSubs.length-1?"1px solid #ebebeb":"none"}}>
              <span style={{flex:1,fontSize:13,fontFamily:"Segoe UI,sans-serif",color:W.tx}}>{sub}</span>
              <button onClick={()=>rmSub(i)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:14,color:W.er,padding:"0 4px",lineHeight:1}}>✕</button>
            </div>
          ))}
        </div>

        {/* Add input */}
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          <WI value={newSub} onChange={e=>setNewSub(e.target.value)} placeholder={"Type subject name for "+selCls+"…"} onKeyDown={e=>e.key==="Enter"&&addSub()} style={{flex:1}}/>
          <WB v="p" style={{padding:"5px 12px"}} onClick={addSub}>+ Add</WB>
        </div>

        {/* Quick-add chips */}
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {ALL_SUBS.map(s=>!curSubs.includes(s)&&(
            <button key={s} onClick={()=>{setExamSubs(p=>({...p,[selCls]:[...(p[selCls]||[]),s]}));setApplyMsg("");}}
              style={{background:W.acl,border:"1px solid "+W.acl,borderRadius:3,padding:"2px 8px",fontSize:11,color:W.ac,cursor:"pointer",fontFamily:"Segoe UI,sans-serif"}}>+{s}</button>
          ))}
        </div>

        {/* Tip */}
        <div style={{marginTop:10,fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>
          💡 Switch between class tabs to set different subjects per class. Use <b>Apply to All Classes</b> to copy the current class's subjects to every class at once.
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:14,borderTop:"1px solid "+W.bd,paddingTop:12}}>
        <WB onClick={onClose}>Cancel</WB>
        <WB v="p" onClick={save}>✓ {existing?"Save Changes":"Add Exam"}</WB>
      </div>
    </Modal>
  );
}

function ResultRecord({students,classes,subjects,school,sess,schoolAddr,logo,logoAlign,watermark,schoolEmail,schoolPhone,schoolWebsite,sessMarks,setSessMarks,isArchived}){
  const [cls,setCls]         = useState(classes[0]||"");
  const [view,setView]       = useState("exam");   // "exam" | "final"
  const [selExamId,setSelEx] = useState(null);
  // Use session-level marks for persistence across session switches
  const marks   = sessMarks||{};
  const setMarks = setSessMarks||(() => {});
  const [card,setCard]       = useState(null);     // {student, res, fp, fg, examName?}
  const [showAdd,setShowAdd] = useState(false);
  const [editExam,setEditExam] = useState(null);
  // Final result state
  const [finalSelExams,setFinalSelExams] = useState({}); // examId->bool
  const [finalCard,setFinalCard]         = useState(null);

  const [exams,setExams] = useState(()=>
    DEFAULT_EXAMS.map(e=>{
      const s={};
      classes.forEach(c=>{s[c]=[...(subjects[c]||["English","Math"])];});
      return{...e,subjects:{...s}};
    })
  );

  useEffect(()=>{if(!classes.includes(cls))setCls(classes[0]||"");},[classes]);
  useEffect(()=>{
    if(!selExamId&&exams.length>0)setSelEx(exams[0].id);
    // init finalSelExams with all exams selected
    setFinalSelExams(p=>{
      const n={...p};
      exams.forEach(e=>{if(!(e.id in n))n[e.id]=true;});
      return n;
    });
  },[exams]);

  const selExam = exams.find(e=>e.id===selExamId)||exams[0]||null;
  const clsStu  = useMemo(()=>students.filter(s=>s.cls===cls),[students,cls]);
  const subs    = selExam?.subjects?.[cls]||[];
  const gc      = g=>({A:W.ok,"A+":W.ok,B:W.ac,C:W.wn,D:W.wn,F:W.er}[g]||W.tx);

  const mk    = (id,eid,sub)=>marks[id+"_"+eid+"_"+sub]??0;
  const setMk = (id,eid,sub,v)=>{
    const ex=exams.find(e=>e.id===eid);
    setMarks(p=>({...p,[id+"_"+eid+"_"+sub]:Math.min(Number(v)||0,ex?.maxMarks||100)}));
  };
  const rowTot = (id,eid)=>{const ex=exams.find(e=>e.id===eid);return(ex?.subjects?.[cls]||[]).reduce((t,sub)=>t+mk(id,eid,sub),0);};
  const rowMax = eid=>{const ex=exams.find(e=>e.id===eid);return(ex?.subjects?.[cls]||[]).length*(ex?.maxMarks||100);};

  // Build per-exam result for a student
  const buildExamResult = (student,ex)=>{
    const s=ex.subjects?.[cls]||[];
    const sm=s.map(sub=>({sub,obt:mk(student.id,ex.id,sub),max:ex.maxMarks||100,pass:ex.minPass||40}));
    const tot=sm.reduce((a,m)=>a+m.obt,0),mx=sm.reduce((a,m)=>a+m.max,0);
    const pct=mx>0?Math.round(tot/mx*100):0;
    return{eid:ex.id,name:ex.name,sm,tot,mx,pct,g:gradeOf(pct),minPass:ex.minPass,passed:sm.every(m=>m.obt>=m.pass)};
  };

  // Build final result (across selected exams) for a student
  const buildFinalResult = (student)=>{
    const selExList = exams.filter(e=>finalSelExams[e.id]);
    const res = selExList.map(ex=>buildExamResult(student,ex)).filter(r=>r.sm.length>0);
    // Aggregate by subject across exams
    const allSubs = [...new Set(res.flatMap(r=>r.sm.map(m=>m.sub)))];
    const subAgg = allSubs.map(sub=>{
      const entries = res.flatMap(r=>r.sm.filter(m=>m.sub===sub)).map(m=>m.obt);
      const totObt  = entries.reduce((a,v)=>a+v,0);
      const totMax  = res.reduce((a,r)=>{const m=r.sm.find(m=>m.sub===sub);return a+(m?m.max:0);},0);
      const pct     = totMax>0?Math.round(totObt/totMax*100):0;
      return{sub,totObt,totMax,pct,g:gradeOf(pct)};
    });
    const grandObt = subAgg.reduce((a,s)=>a+s.totObt,0);
    const grandMax = subAgg.reduce((a,s)=>a+s.totMax,0);
    const fp = grandMax>0?Math.round(grandObt/grandMax*100):0;
    const fg = gradeOf(fp);
    return{student,res,subAgg,grandObt,grandMax,fp,fg,selExamNames:selExList.map(e=>e.name)};
  };

  function saveExam(data){
    setExams(p=>{const i=p.findIndex(e=>e.id===data.id);if(i>=0){const n=[...p];n[i]=data;return n;}return[...p,data];});
    setSelEx(data.id); setShowAdd(false); setEditExam(null);
  }
  function deleteExam(id){
    if(!window.confirm("Delete this exam? All marks will be lost."))return;
    setExams(p=>p.filter(e=>e.id!==id));
    if(selExamId===id)setSelEx(exams.find(e=>e.id!==id)?.id||null);
  }

  // ── Print single-exam card ───────────────────────────────────────────────
  function printExamCard(cardData){
    const{student,res,fp,fg}=cardData;
    const pass=fg!=="F";
    const today=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});

    let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Result Card</title><style>${RESULT_CSS}</style></head><body>`;
    html+=buildPrintHeader(logo,null,null,logoAlign,school,schoolAddr,sess,"Result Card &bull; "+(res[0]?.name||""),{email:schoolEmail,phone:schoolPhone,website:schoolWebsite});
    html+=buildStudentInfoBlock(student);
    res.forEach(r=>{
      html+=`<div class="exam-hdr">${r.name} &mdash; ${r.tot}/${r.mx} <span style="font-size:11px;color:#888;font-weight:400;margin-left:8px">Min Pass: ${r.minPass}</span></div>`;
      html+=`<table><thead><tr><th>Subject</th><th>Obtained</th><th>Max</th><th>Pass Marks</th><th>%</th><th>Result</th></tr></thead><tbody>`;
      r.sm.forEach((m,ri)=>{
        const p2=m.max>0?Math.round(m.obt/m.max*100):0,sp=m.obt>=m.pass;
        html+=`<tr${ri%2===1?" style='background:#f7f8fa'":""}><td style="font-weight:600">${m.sub}</td><td style="font-weight:700;text-align:center">${m.obt}</td><td style="color:#aaa;text-align:center">${m.max}</td><td style="color:#aaa;text-align:center">${m.pass}</td><td style="text-align:center;font-weight:600;color:${sp?"#166534":"#991b1b"}">${p2}%</td><td style="text-align:center"><span class="pill ${sp?"pass-pill":"fail-pill"}">${sp?"✓ Pass":"✗ Fail"}</span></td></tr>`;
      });
      html+=`</tbody></table>`;
    });
    html+=`<div class="fin ${pass?"fin-pass":"fin-fail"}">Grand Total: ${fp}%<br><span style="font-size:13px;font-weight:400;margin-top:4px;display:block">${pass?"✓ PASS":"✗ FAIL — Needs Improvement"}</span></div>`;
    html+=`<div class="sigs">
      <div><div class="sl">Class Teacher</div></div>
      <div><div class="seal">School<br>Seal</div><div class="sl">Principal</div></div>
      <div><div class="sl">Parent / Guardian</div></div>
    </div>`;
    html+=`<div class="footer"><span>Generated: ${today}</span><span>${school}</span></div>`;
    html+=`</body></html>`;
    const _wmHtml = buildWatermarkHTML(watermark);
    if(_wmHtml) html = html.replace(/<\/body>/i, _wmHtml+"</body>");
    printHTML(html, "ExamCard_"+student.name+"_"+student.cls);
  }

  // ── Print final consolidated result card ─────────────────────────────────
  function printFinalCard(fd){
    const{student,res,subAgg,grandObt,grandMax,fp,fg,selExamNames}=fd;
    const pass=fg!=="F";
    const today=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});

    const examBreakRows = res.map((r,ri)=>{
      const cells = subAgg.map(sa=>{
        const m=r.sm.find(x=>x.sub===sa.sub);
        if(!m)return`<td style="text-align:center;color:#ccc">—</td>`;
        const sp=m.obt>=m.pass;
        return`<td style="text-align:center;font-weight:600;color:${sp?"#166534":"#991b1b"}">${m.obt}/${m.max}</td>`;
      }).join("");
      return`<tr${ri%2===1?" style='background:#f7f8fa'":""}><td style="font-weight:600;color:#0067c0">${r.name}</td>${cells}<td style="text-align:center;font-weight:700">${r.tot}/${r.mx}</td><td style="text-align:center;font-weight:700;color:${r.pct>=50?"#166534":"#991b1b"}">${r.pct}%</td></tr>`;
    }).join("");
    const subHeaders = subAgg.map(sa=>`<th style="text-align:center;font-size:11px">${sa.sub}</th>`).join("");
    const subTotals  = subAgg.map(sa=>`<td style="text-align:center;font-weight:700;color:${sa.pct>=50?"#166534":"#991b1b"}">${sa.totObt}/${sa.totMax}<br><span style="font-size:10px">${sa.pct}%</span></td>`).join("");
    const examBadges = selExamNames.map(function(n){return"<span style='background:#dbeafe;color:#1d4ed8;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600;margin:0 3px;display:inline-block'>"+n+"</span>";}).join("");

    let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Final Result Card</title><style>${RESULT_CSS}
.grand-row td{background:#dbeafe;font-weight:700;border-top:2px solid #0067c0}
.exam-sub-hdr th{background:#e8f0fb;color:#0067c0;font-size:11px}
</style></head><body>`;
    html+=buildPrintHeader(logo,null,null,logoAlign,school,schoolAddr,sess,"Final Result Card",{email:schoolEmail,phone:schoolPhone,website:schoolWebsite});
    html+=buildStudentInfoBlock(student);
    html+=`<div style="margin-bottom:10px">${examBadges}</div>`;
    html+=`<div class="exam-hdr">Exam-wise Subject Breakdown</div>`;
    html+=`<table><thead><tr class="exam-sub-hdr"><th>Exam</th>${subHeaders}<th style="text-align:center">Total</th><th style="text-align:center">%</th></tr></thead><tbody>${examBreakRows}<tr class="grand-row"><td>GRAND TOTAL</td>${subTotals}<td style="text-align:center">${grandObt}/${grandMax}</td><td style="text-align:center;font-size:13px">${fp}%</td></tr></tbody></table>`;
    html+=`<div class="fin ${pass?"fin-pass":"fin-fail"}">Grand Total: ${grandObt}/${grandMax} = ${fp}%<br><span style="font-size:14px;font-weight:400;display:block;margin-top:4px">${pass?"✓ PASS":"✗ FAIL — Needs Improvement"}</span></div>`;
    html+=`<div class="sigs">
      <div><div class="sl">Class Teacher</div></div>
      <div><div class="seal">School<br>Seal</div><div class="sl">Principal</div></div>
      <div><div class="sl">Parent / Guardian</div></div>
    </div>`;
    html+=`<div class="footer"><span>Generated: ${today}</span><span>Page 1</span><span>${school}</span></div>`;
    html+=`</body></html>`;
    const _wmHtml = buildWatermarkHTML(watermark);
    if(_wmHtml) html = html.replace(/<\/body>/i, _wmHtml+"</body>");
    printHTML(html, "FinalResult_"+student.name+"_"+student.cls);
  }

  // ── Print all students final result ─────────────────────────────────────
  function printAllFinal(){
    if(clsStu.length===0){alert("No students in this class.");return;}
    const selExList=exams.filter(e=>finalSelExams[e.id]);
    if(selExList.length===0){alert("Select at least one exam.");return;}
    const allSubs=[...new Set(selExList.flatMap(e=>e.subjects?.[cls]||[]))];
    const today=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
    const examBadges=selExList.map(function(e){return"<span style='background:#dbeafe;color:#1d4ed8;border-radius:20px;padding:2px 9px;font-size:10px;font-weight:600;margin:0 2px;display:inline-block'>"+e.name+"</span>";}).join("");
    const CSS=`*{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}
body{padding:20px;color:#1a1a1a}
table{width:100%;border-collapse:collapse;font-size:10px}
th{background:#1a56a0;color:#fff;padding:7px 7px;text-align:center;font-weight:600}
th.l{text-align:left}
td{padding:5px 7px;border-bottom:1px solid #e8e8e8;text-align:center}
td.l{text-align:left}
tr:nth-child(even) td{background:#f7f8fa}
.footer{margin-top:12px;display:flex;justify-content:space-between;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:6px}
@media print{body{padding:6px}@page{margin:0.8cm;size:A4 landscape}}`;

    const subHeaders=allSubs.map(s=>`<th>${s}</th>`).join("");
    const rows=clsStu.map((s,i)=>{
      const fd=buildFinalResult(s);
      const pass=fd.fp>=50;
      const subCells=allSubs.map(sub=>{
        const sa=fd.subAgg.find(x=>x.sub===sub);
        if(!sa)return`<td style="color:#ccc">—</td>`;
        return`<td style="font-weight:600">${sa.totObt}/${sa.totMax}</td>`;
      }).join("");
      const resultPill=`<span style="border-radius:20px;font-size:10px;padding:2px 8px;font-weight:500;background:${pass?"#dcfce7":"#fee2e2"};color:${pass?"#166534":"#991b1b"}">${pass?"✓ Pass":"✗ Fail"}</span>`;
      return`<tr${i%2===1?" style='background:#f7f8fa'":""}><td>${i+1}</td><td class="l" style="font-weight:600">${s.name}</td><td>${s.roll}</td>${subCells}<td style="font-weight:700">${fd.grandObt}/${fd.grandMax}</td><td style="font-weight:700;color:${pass?"#166534":"#991b1b"}">${fd.fp}%</td><td>${resultPill}</td></tr>`;
    }).join("");

    let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Class Result</title><style>${CSS}</style></head><body>`;
    html+=buildPrintHeader(logo,null,null,logoAlign,school,schoolAddr,sess,"Class Result Sheet &bull; "+cls,{email:schoolEmail,phone:schoolPhone,website:schoolWebsite});
    html+=`<div style="margin-bottom:10px">${examBadges}</div>`;
    html+=`<table><thead><tr><th>#</th><th class="l">Student Name</th><th>S.No</th>${subHeaders}<th>Total</th><th>%</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table>`;
    html+=`<div class="footer"><span>Generated: ${today}</span><span>Class: ${cls} &nbsp;|&nbsp; Session: ${sess} &nbsp;|&nbsp; Students: ${clsStu.length}</span><span>${school}</span></div>`;
    html+=`</body></html>`;
    const _wmHtml = buildWatermarkHTML(watermark);
    if(_wmHtml) html = html.replace(/<\/body>/i, _wmHtml+"</body>");
    printHTML(html, "ClassResult_"+cls+"_"+sess);
  }

  return (
    <div style={{padding:20}}>

      {/* Class selector */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:12,color:W.mu,marginBottom:5,fontFamily:"Segoe UI,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:0.4}}>Select Class</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {classes.map(c=>(
            <button key={c} onClick={()=>setCls(c)}
              style={{padding:"4px 12px",borderRadius:3,border:"1px solid "+(cls===c?W.ac:W.bd),background:cls===c?W.ac:"transparent",color:cls===c?"#fff":W.mu,fontSize:13,cursor:"pointer",fontFamily:"Segoe UI,sans-serif"}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* View toggle: Exam Result | Final Result */}
      <div style={{display:"flex",gap:0,marginBottom:14,border:"1px solid "+W.bd,borderRadius:6,overflow:"hidden",width:"fit-content"}}>
        {[{id:"exam",label:"📝 Exam / Test Result"},{id:"final",label:"🏆 Final Result"}].map(v=>(
          <button key={v.id} onClick={()=>setView(v.id)}
            style={{padding:"8px 20px",border:"none",cursor:"pointer",fontSize:13,fontFamily:"Segoe UI,sans-serif",fontWeight:view===v.id?700:400,background:view===v.id?W.ac:"transparent",color:view===v.id?"#fff":W.mu,borderRight:v.id==="exam"?"1px solid "+W.bd:"none",transition:"all 0.15s"}}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── EXAM RESULT VIEW ── */}
      {view==="exam"&&(<>
        {/* Exam tabs row */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:W.mu,marginBottom:5,fontFamily:"Segoe UI,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:0.4}}>Select Exam / Test</div>
            {exams.length===0
              ?<div style={{fontSize:13,color:W.fa}}>No exams yet — click ➕ Add Exam</div>
              :<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {exams.map(ex=>(
                  <div key={ex.id} style={{display:"inline-flex",alignItems:"center",border:"1px solid "+(selExam?.id===ex.id?W.ac:W.bd),borderRadius:4,overflow:"hidden",marginBottom:2}}>
                    <button onClick={()=>setSelEx(ex.id)}
                      style={{padding:"5px 12px",background:selExam?.id===ex.id?W.acl:"transparent",color:selExam?.id===ex.id?W.ac:W.mu,border:"none",cursor:"pointer",fontSize:13,fontFamily:"Segoe UI,sans-serif",fontWeight:selExam?.id===ex.id?600:400}}>
                      {ex.name}<span style={{fontSize:10,opacity:0.6,marginLeft:3}}>/{ex.maxMarks}</span>
                    </button>
                    <button title="Edit" onClick={()=>{setEditExam(ex);setShowAdd(true);}} style={{background:"transparent",border:"none",borderLeft:"1px solid "+W.bd,cursor:"pointer",padding:"5px 6px",color:W.mu,fontSize:11}}>✏️</button>
                    <button title="Delete" onClick={()=>deleteExam(ex.id)} style={{background:"transparent",border:"none",borderLeft:"1px solid "+W.bd,cursor:"pointer",padding:"5px 6px",color:W.er,fontSize:11}}>🗑</button>
                  </div>
                ))}
              </div>
            }
          </div>
          <WB v="p" style={{marginTop:18}} onClick={()=>{setEditExam(null);setShowAdd(true);}}>➕ Add Exam</WB>
        </div>

        {/* Exam info bar */}
        {selExam&&(
          <div style={{background:W.acl,border:"1px solid "+W.bd,borderLeft:"3px solid "+W.ac,padding:"6px 12px",marginBottom:10,borderRadius:3,fontSize:13,color:W.ac,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
            <b>{cls} &nbsp;|&nbsp; {selExam.name}</b>
            <span style={{fontWeight:400,color:W.mu}}>Max: {selExam.maxMarks} &nbsp;|&nbsp; Pass: {selExam.minPass} &nbsp;|&nbsp; {clsStu.length} students &nbsp;|&nbsp; Subjects: {subs.join(", ")||"None"}</span>
          </div>
        )}

        {/* Marks entry table */}
        {!selExam
          ?<div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:4,padding:40,textAlign:"center",color:W.fa,fontSize:13}}>Add an exam to get started.</div>
          :clsStu.length===0
            ?<div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:4,padding:40,textAlign:"center",color:W.fa,fontSize:13}}>No students in Class {cls}</div>
            :<div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:4,overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
                <thead>
                  <tr>
                    <TH>Student</TH>
                    {subs.map(sub=>(
                      <th key={sub} style={{padding:"7px 8px",textAlign:"center",fontSize:12,color:W.mu,borderBottom:"1px solid "+W.bd,fontWeight:600,background:W.th,fontFamily:"Segoe UI,sans-serif",minWidth:64}}>{sub}</th>
                    ))}
                    <TH>Total</TH><TH>%</TH><TH>Card</TH>
                  </tr>
                </thead>
                <tbody>
                  {clsStu.map((s,i)=>{
                    const tot=rowTot(s.id,selExam.id),max=rowMax(selExam.id);
                    const pct=max>0?Math.round(tot/max*100):0,g=gradeOf(pct);
                    const passed=subs.length>0&&subs.every(sub=>mk(s.id,selExam.id,sub)>=(selExam.minPass||0));
                    const r=buildExamResult(s,selExam);
                    return(
                      <tr key={s.id} style={{background:i%2===1?W.ta:W.sf}}
                        onMouseEnter={e=>e.currentTarget.style.background=W.rowHov}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===1?W.ta:W.sf}>
                        <TD><div style={{fontWeight:600,color:W.tx}}>{s.name}</div><div style={{fontSize:11,color:W.fa}}>S.No: {s.roll}</div></TD>
                        {subs.map(sub=>(
                          <td key={sub} style={{padding:"5px 5px",textAlign:"center",borderBottom:"1px solid "+W.bd}}>
                            <input type="number" min="0" max={selExam.maxMarks} value={mk(s.id,selExam.id,sub)||""}
                              onChange={e=>setMk(s.id,selExam.id,sub,e.target.value)} placeholder="0"
                              style={{width:52,textAlign:"center",background:W.sf,border:"1px solid "+W.bd,borderRadius:3,padding:"4px 2px",fontSize:13,color:W.tx,outline:"none",fontFamily:"Segoe UI,sans-serif"}}/>
                          </td>
                        ))}
                        <TD style={{fontWeight:700,textAlign:"center"}}>{tot}/{max}</TD>
                        <TD style={{fontWeight:700,textAlign:"center",color:pct>=(selExam.minPass/(selExam.maxMarks||100)*100)?W.ok:W.er}}>{pct}%</TD>
                        <TD>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                            <span style={{background:gc(g)+"22",color:gc(g),padding:"1px 8px",borderRadius:3,fontSize:12,fontWeight:700}}>{g}</span>
                            <Tag t={passed?"green":"red"}>{passed?"Pass":"Fail"}</Tag>
                            <WB v="p" style={{padding:"2px 8px",fontSize:11}} onClick={()=>{setCard({student:s,res:[r],fp:pct,fg:g});}}> 📄 Preview</WB>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        }
      </>)}

      {/* ── FINAL RESULT VIEW ── */}
      {view==="final"&&(<>
        <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:6,padding:14,marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:W.tx,marginBottom:10,fontFamily:"Segoe UI,sans-serif"}}>Select Exams to Include in Final Result</div>
          {exams.length===0
            ?<div style={{fontSize:13,color:W.fa}}>No exams created yet. Go to Exam/Test Result tab and add exams first.</div>
            :<>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                {exams.map(ex=>{
                  const sel=!!finalSelExams[ex.id];
                  return(
                    <div key={ex.id} onClick={()=>setFinalSelExams(p=>({...p,[ex.id]:!sel}))}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",borderRadius:5,border:"2px solid "+(sel?W.ac:W.bd),background:sel?W.acl:W.sf,cursor:"pointer",transition:"all 0.15s"}}>
                      <div style={{width:18,height:18,borderRadius:4,border:"2px solid "+(sel?W.ac:W.bd),background:sel?W.ac:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {sel&&<span style={{color:"#fff",fontSize:12,fontWeight:700,lineHeight:1}}>✓</span>}
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:sel?W.ac:W.tx,fontFamily:"Segoe UI,sans-serif"}}>{ex.name}</div>
                        <div style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>Max {ex.maxMarks} &nbsp;·&nbsp; Pass {ex.minPass}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <WB style={{fontSize:12,padding:"4px 10px"}} onClick={()=>setFinalSelExams(p=>{const n={};exams.forEach(e=>n[e.id]=true);return n;})}>✓ Select All</WB>
                <WB style={{fontSize:12,padding:"4px 10px"}} onClick={()=>setFinalSelExams(p=>{const n={};exams.forEach(e=>n[e.id]=false);return n;})}>✗ Deselect All</WB>
                <span style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{Object.values(finalSelExams).filter(Boolean).length} of {exams.length} exams selected</span>
                <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                  <WB v="s" style={{padding:"5px 14px"}} onClick={printAllFinal}>🖨️ Print Class Result Sheet</WB>
                </div>
              </div>
            </>
          }
        </div>

        {/* Final result table */}
        {clsStu.length===0
          ?<div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:4,padding:40,textAlign:"center",color:W.fa,fontSize:13}}>No students in Class {cls}</div>
          :<div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:4,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
              <thead>
                <tr>
                  <TH>Student</TH>
                  {exams.filter(e=>finalSelExams[e.id]).map(e=>(
                    <th key={e.id} style={{padding:"7px 8px",textAlign:"center",fontSize:11,color:W.mu,borderBottom:"1px solid "+W.bd,fontWeight:600,background:W.th,fontFamily:"Segoe UI,sans-serif",minWidth:80}}>
                      {e.name}<div style={{fontSize:10,fontWeight:400,opacity:0.7}}>{e.maxMarks} marks</div>
                    </th>
                  ))}
                  <TH>Grand Total</TH><TH>%</TH><TH>Final Card</TH>
                </tr>
              </thead>
              <tbody>
                {clsStu.map((s,i)=>{
                  const fd=buildFinalResult(s);
                  const selExList=exams.filter(e=>finalSelExams[e.id]);
                  return(
                    <tr key={s.id} style={{background:i%2===1?W.ta:W.sf}}
                      onMouseEnter={e=>e.currentTarget.style.background=W.rowHov}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===1?W.ta:W.sf}>
                      <TD><div style={{fontWeight:600,color:W.tx}}>{s.name}</div><div style={{fontSize:11,color:W.fa}}>S.No: {s.roll}</div></TD>
                      {selExList.map(ex=>{
                        const r=fd.res.find(r=>r.eid===ex.id);
                        if(!r) return <TD key={ex.id} style={{textAlign:"center",color:W.fa}}>—</TD>;
                        return(
                          <td key={ex.id} style={{padding:"6px 8px",textAlign:"center",borderBottom:"1px solid "+W.bd}}>
                            <div style={{fontWeight:700,color:W.tx,fontSize:13}}>{r.tot}/{r.mx}</div>
                          </td>
                        );
                      })}
                      <TD style={{fontWeight:700,textAlign:"center"}}>{fd.grandObt}/{fd.grandMax}</TD>
                      <TD style={{fontWeight:700,textAlign:"center",color:fd.fp>=50?W.ok:W.er}}>{fd.fp}%</TD>
                      <TD style={{textAlign:"center"}}>
                        <Tag t={fd.fg==="F"?"red":"green"}>{fd.fg==="F"?"Fail":"Pass"}</Tag>
                      </TD>
                      <TD>
                        <WB v="p" style={{padding:"3px 10px",fontSize:11}} onClick={()=>setFinalCard(fd)}>📄 Preview</WB>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      </>)}

      {/* Exam Result Card Preview Modal */}
      {card&&(
        <Modal title={"Result — "+card.student.name} icon="📋" onClose={()=>setCard(null)} w={680}>
          <div style={{background:W.ta,border:"1px solid "+W.bd,borderRadius:4,padding:14,maxHeight:"60vh",overflowY:"auto"}}>
            <div style={{textAlign:"center",borderBottom:"2px solid "+W.ac,paddingBottom:10,marginBottom:12}}>
              <div style={{fontSize:16,fontWeight:700,color:W.ac}}>{school}</div>
              {schoolAddr&&<div style={{fontSize:11,color:W.mu,marginTop:2}}>{schoolAddr}</div>}
              <div style={{fontSize:12,color:W.mu,marginTop:2}}>Result Card &bull; {card.res[0]?.name} &bull; Session {sess}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,background:W.acl,border:"1px solid "+W.bd,borderRadius:4,padding:10,marginBottom:10,fontSize:12}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                {card.student.photo?<img src={card.student.photo} alt="" style={{width:40,height:50,objectFit:"cover",borderRadius:3,border:"1px solid "+W.bd,flexShrink:0}}/>:<div style={{width:40,height:50,background:W.th,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>👤</div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,flex:1}}>
                  {[["Student",card.student.name],["Father",card.student.dad],["Class",card.student.cls],["S.No",card.student.roll]].map(([l,v])=>(<div key={l}><span style={{color:W.mu}}>{l}: </span><b>{v}</b></div>))}
                </div>
              </div>
            </div>
            {card.res.map(r=>(
              <div key={r.eid} style={{marginBottom:10}}>
                <div style={{background:W.acl,borderLeft:"3px solid "+W.ac,padding:"5px 10px",fontSize:13,fontWeight:600,color:W.ac,marginBottom:5}}>
                  {r.name} — {r.tot}/{r.mx}
                  <span style={{marginLeft:8,fontSize:11,fontWeight:400,color:W.mu}}>Pass: {r.minPass}</span>
                </div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr style={{background:W.th}}>{["Subject","Obtained","Max","Pass","Result"].map(h=><th key={h} style={{padding:"4px 8px",textAlign:"left",fontWeight:600,color:W.mu,borderBottom:"1px solid "+W.bd}}>{h}</th>)}</tr></thead>
                  <tbody>{r.sm.map(m=>{const sp=m.obt>=m.pass;return(
                    <tr key={m.sub}>
                      <td style={{padding:"3px 8px"}}>{m.sub}</td>
                      <td style={{padding:"3px 8px",fontWeight:700}}>{m.obt}</td>
                      <td style={{padding:"3px 8px",color:W.fa}}>{m.max}</td>
                      <td style={{padding:"3px 8px",color:W.fa}}>{m.pass}</td>
                      <td style={{padding:"3px 8px",fontWeight:600,color:sp?W.ok:W.er}}>{sp?"Pass":"Fail"}</td>
                    </tr>);})}</tbody>
                </table>
              </div>
            ))}
            <div style={{background:card.fg==="F"?W.erb:W.okb,border:"1px solid "+(card.fg==="F"?W.er:W.ok),borderRadius:4,padding:"10px 14px",textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:card.fg==="F"?W.er:W.ok}}>{card.student&&card.res&&card.res[0]?card.res[0].tot+"/"+card.res[0].mx:""} — {card.fp}%</div>
              <div style={{fontSize:12,color:W.mu,marginTop:2}}>{card.fg==="F"?"✗ FAIL":"✓ PASS"}</div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
            <WB onClick={()=>setCard(null)}>Close</WB>
            <WB v="p" onClick={()=>printExamCard(card)}>🖨️ Print Card</WB>
          </div>
        </Modal>
      )}

      {/* Final Result Card Preview Modal */}
      {finalCard&&(
        <Modal title={"Final Result — "+finalCard.student.name} icon="🏆" onClose={()=>setFinalCard(null)} w={720}>
          <div style={{background:W.ta,border:"1px solid "+W.bd,borderRadius:4,padding:14,maxHeight:"62vh",overflowY:"auto"}}>
            <div style={{textAlign:"center",borderBottom:"2px solid "+W.ac,paddingBottom:10,marginBottom:12}}>
              <div style={{fontSize:16,fontWeight:700,color:W.ac}}>{school}</div>
              {schoolAddr&&<div style={{fontSize:11,color:W.mu,marginTop:2}}>{schoolAddr}</div>}
              <div style={{fontSize:12,color:W.mu,marginTop:2}}>Final Result Card &bull; Session {sess}</div>
              <div style={{marginTop:4,display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap"}}>
                {finalCard.selExamNames.map(n=><span key={n} style={{background:W.acl,color:W.ac,borderRadius:3,padding:"1px 7px",fontSize:11}}>{n}</span>)}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,background:W.acl,border:"1px solid "+W.bd,borderRadius:4,padding:10,marginBottom:12,fontSize:12}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                {finalCard.student.photo?<img src={finalCard.student.photo} alt="" style={{width:40,height:50,objectFit:"cover",borderRadius:3,border:"1px solid "+W.bd,flexShrink:0}}/>:<div style={{width:40,height:50,background:W.th,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>👤</div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,flex:1}}>
                  {[["Student",finalCard.student.name],["Father",finalCard.student.dad],["Class",finalCard.student.cls],["S.No",finalCard.student.roll]].map(([l,v])=>(<div key={l}><span style={{color:W.mu}}>{l}: </span><b>{v}</b></div>))}
                </div>
              </div>
            </div>
            {/* Per-exam summary */}
            {finalCard.res.map(r=>(
              <div key={r.eid} style={{marginBottom:8,background:W.sf,border:"1px solid "+W.bd,borderRadius:4,overflow:"hidden"}}>
                <div style={{background:W.acl,borderLeft:"3px solid "+W.ac,padding:"5px 10px",fontSize:12,fontWeight:600,color:W.ac,display:"flex",justifyContent:"space-between"}}>
                  <span>{r.name}</span>
                  <span>{r.tot}/{r.mx}</span>
                </div>
              </div>
            ))}
            {/* Subject totals */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:W.tx,marginBottom:6,fontFamily:"Segoe UI,sans-serif"}}>Subject-wise Aggregate</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead><tr style={{background:W.th}}>{["Subject","Obtained","Max","%"].map(h=><th key={h} style={{padding:"4px 8px",textAlign:"left",fontWeight:600,color:W.mu,borderBottom:"1px solid "+W.bd}}>{h}</th>)}</tr></thead>
                <tbody>{finalCard.subAgg.map(sa=>(
                  <tr key={sa.sub} style={{background:W.sf}}>
                    <td style={{padding:"4px 8px",fontWeight:600}}>{sa.sub}</td>
                    <td style={{padding:"4px 8px",fontWeight:700}}>{sa.totObt}</td>
                    <td style={{padding:"4px 8px",color:W.fa}}>{sa.totMax}</td>
                    <td style={{padding:"4px 8px",color:sa.pct>=50?W.ok:W.er,fontWeight:600}}>{sa.pct}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{background:finalCard.fg==="F"?W.erb:W.okb,border:"1px solid "+(finalCard.fg==="F"?W.er:W.ok),borderRadius:4,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:700,color:finalCard.fg==="F"?W.er:W.ok}}>Grand Total: {finalCard.grandObt}/{finalCard.grandMax} = {finalCard.fp}%</div>
              <div style={{fontSize:12,color:W.mu,marginTop:3}}>{finalCard.fg==="F"?"✗ FAIL — Needs Improvement":"✓ PASS"}</div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
            <WB onClick={()=>setFinalCard(null)}>Close</WB>
            <WB v="p" onClick={()=>printFinalCard(finalCard)}>🖨️ Print Final Card</WB>
          </div>
        </Modal>
      )}

      {showAdd&&<AddExamModal classes={classes} subjects={subjects} existing={editExam} onSave={saveExam} onClose={()=>{setShowAdd(false);setEditExam(null);}}/>}
    </div>
  );
}

// ─── Backup & Restore Tab ────────────────────────────────────────────────────
function BackupRestoreTab({dlBg,dlBd,dlTx,dlMu,dlFa,dlAc,dlRw,iSt,isDark,onBackup,onRestore,backupHistory}){
  var [mode,setMode]           = useState("main");
  var [progress,setProgress]   = useState(0);
  var [progressMsg,setProgressMsg] = useState("");
  var [successMeta,setSuccessMeta] = useState(null);
  var [errorMsg,setErrorMsg]   = useState("");
  var [restoreFile,setRestoreFile] = useState(null);
  var [note,setNote]           = useState("");
  var [showConfirm,setShowConfirm] = useState(false);

  function runBackup(){
    setMode("backing"); setProgress(10); setProgressMsg("Gathering data...");
    setTimeout(function(){ setProgress(40); setProgressMsg("Serialising data..."); },300);
    setTimeout(function(){ setProgress(70); setProgressMsg("Packaging assets..."); },700);
    setTimeout(function(){
      setProgress(90); setProgressMsg("Creating download...");
      setTimeout(function(){
        try{
          var entry = onBackup(note.trim()||undefined);
          setProgress(100); setProgressMsg("Backup complete!");
          setNote("");
          setSuccessMeta({type:"backup",fname:entry&&entry.fname,size:entry&&entry.size,ts:entry&&entry.ts});
          setMode("success");
        }catch(e){ setMode("error"); setErrorMsg(e.message||"Backup failed."); }
      },400);
    },1200);
  }

  function runRestore(){
    if(!restoreFile){alert("Please select a .bak file first.");return;}
    setShowConfirm(false);
    setMode("restoring"); setProgress(0); setProgressMsg("Starting restore...");
    onRestore(
      restoreFile,
      function(pct,msg){ setProgress(pct); setProgressMsg(msg); },
      function(meta){ setMode("success"); setSuccessMeta({type:"restore",fromVersion:meta&&meta.version,school:meta&&meta.school,ts:meta&&meta.createdAt,note:meta&&meta.note}); },
      function(err){ setMode("error"); setErrorMsg(err); }
    );
  }

  var isBack  = mode==="backing";
  var isOk    = mode==="success";
  var isErr   = mode==="error";
  var isBusy  = mode==="backing"||mode==="restoring";
  var sbMeta  = successMeta||{};

  return (
    <div style={{padding:"8px 0"}}>

      {/* ── BUSY (progress) ── */}
      {isBusy&&(
        <div>
          <div style={{fontSize:22,fontWeight:600,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>
            {isBack?"Creating Backup...":"Restoring Data..."}
          </div>
          <div style={{height:1,background:dlBd,marginBottom:20}}/>
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{fontSize:48,marginBottom:16}}>{isBack?"📦":"⚙️"}</div>
            <div style={{fontSize:14,color:dlTx,fontWeight:600,fontFamily:"Segoe UI,sans-serif",marginBottom:20}}>{progressMsg}</div>
            <div style={{background:dlBd,borderRadius:8,height:12,margin:"0 auto",width:"80%",overflow:"hidden",marginBottom:8}}>
              <div style={{background:dlAc,height:"100%",borderRadius:8,width:progress+"%",transition:"width 0.4s ease"}}/>
            </div>
            <div style={{fontSize:13,color:dlAc,fontWeight:700,fontFamily:"Segoe UI,sans-serif"}}>{progress}%</div>
            {!isBack&&progress<100&&(
              <div style={{marginTop:16,background:"#fef9c3",border:"1px solid #fde047",borderRadius:6,padding:"8px 14px",fontSize:12,color:"#92400e",fontFamily:"Segoe UI,sans-serif",maxWidth:320,margin:"16px auto 0"}}>
                Do not close the app during restore. A safety snapshot has been created.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {isOk&&(
        <div>
          <div style={{fontSize:22,fontWeight:600,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>
            {sbMeta.type==="backup"?"Backup Successful":"Restore Complete"}
          </div>
          <div style={{height:1,background:dlBd,marginBottom:20}}/>
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:52,marginBottom:10}}>{"✅"}</div>
            <div style={{fontSize:16,fontWeight:700,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:8}}>
              {sbMeta.type==="backup"?"Backup file downloaded!":"Data restored successfully!"}
            </div>
            <div style={{fontSize:13,color:dlMu,fontFamily:"Segoe UI,sans-serif",lineHeight:1.8,marginBottom:20}}>
              {sbMeta.type==="backup"&&sbMeta.fname&&<div>{"📁"} File: <b>{sbMeta.fname}</b></div>}
              {sbMeta.type==="backup"&&sbMeta.size&&<div>{"📦"} Size: <b>~{sbMeta.size} KB</b></div>}
              {sbMeta.type!=="backup"&&sbMeta.fromVersion&&<div>{"🔖"} Backup version: <b>{sbMeta.fromVersion}</b></div>}
              {sbMeta.type!=="backup"&&sbMeta.school&&<div>{"🏫"} School: <b>{sbMeta.school}</b></div>}
              {sbMeta.ts&&<div>{"🕐"} <b>{new Date(sbMeta.ts).toLocaleString()}</b></div>}
              {sbMeta.note&&<div>{"📝"} Note: <b>{sbMeta.note}</b></div>}
            </div>
            <button onClick={function(){setMode("main");setSuccessMeta(null);}}
              style={{padding:"10px 28px",borderRadius:6,border:"none",background:dlAc,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Segoe UI,sans-serif"}}>
              Back to Backup and Restore
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {isErr&&(
        <div>
          <div style={{fontSize:22,fontWeight:600,color:"#991b1b",fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>Operation Failed</div>
          <div style={{height:1,background:dlBd,marginBottom:20}}/>
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:52,marginBottom:10}}>{"❌"}</div>
            <div style={{fontSize:15,fontWeight:700,color:"#991b1b",fontFamily:"Segoe UI,sans-serif",marginBottom:10}}>Error</div>
            <div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:6,padding:"12px 16px",fontSize:13,color:"#7f1d1d",fontFamily:"Segoe UI,sans-serif",marginBottom:20,textAlign:"left",maxWidth:360,margin:"0 auto 20px"}}>
              {errorMsg}
            </div>
            <div style={{fontSize:12,color:dlMu,fontFamily:"Segoe UI,sans-serif",marginBottom:20}}>
              If this was a restore, your previous data was automatically rolled back.
            </div>
            <button onClick={function(){setMode("main");}}
              style={{padding:"10px 28px",borderRadius:6,border:"none",background:dlAc,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Segoe UI,sans-serif"}}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      {mode==="main"&&(
        <div>
          <div style={{fontSize:22,fontWeight:600,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>Backup and Restore</div>
          <div style={{height:1,background:dlBd,marginBottom:16}}/>

          {/* BACKUP */}
          <div style={{background:isDark?"#1a2233":"#f0f6ff",border:"1px solid "+dlAc+"44",borderRadius:10,padding:"16px 18px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <span style={{fontSize:24}}>{"📦"}</span>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:dlAc,fontFamily:"Segoe UI,sans-serif"}}>Create Backup</div>
                <div style={{fontSize:12,color:dlMu,fontFamily:"Segoe UI,sans-serif",marginTop:1}}>
                  Exports all data as a single .bak file — students, fees, results, attendance, staff, sessions.
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {["Students","Fees","Results","Attendance","Staff","Logo","Sessions","Settings"].map(function(item){
                return <span key={item} style={{background:dlAc+"18",color:dlAc,borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:500,fontFamily:"Segoe UI,sans-serif"}}>{"✓"} {item}</span>;
              })}
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:dlMu,marginBottom:4,fontFamily:"Segoe UI,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:0.4}}>Backup Note (optional)</div>
              <input value={note} onChange={function(e){setNote(e.target.value);}} placeholder="e.g. Before session promotion..."
                style={{...iSt,fontSize:12}}/>
            </div>
            <button onClick={runBackup}
              style={{width:"100%",padding:"11px",borderRadius:7,border:"none",background:dlAc,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Segoe UI,sans-serif"}}>
              {"💾"} Download Backup Now
            </button>
            <div style={{fontSize:10,color:dlFa,marginTop:6,fontFamily:"Segoe UI,sans-serif",textAlign:"center"}}>
              Saves as SchoolERP_Name_YYYY-MM-DD.bak
            </div>
          </div>

          {/* RESTORE */}
          <div style={{background:isDark?"#1e1a1a":"#fff8f0",border:"1px solid #f9731644",borderRadius:10,padding:"16px 18px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <span style={{fontSize:24}}>{"🔄"}</span>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:"#c2410c",fontFamily:"Segoe UI,sans-serif"}}>Restore from Backup</div>
                <div style={{fontSize:12,color:dlMu,fontFamily:"Segoe UI,sans-serif",marginTop:1}}>Select a .bak file to restore. Current data will be replaced.</div>
              </div>
            </div>
            <div style={{background:isDark?"#2a1f00":"#fffbeb",border:"1px solid #fde68a",borderRadius:6,padding:"10px 12px",marginBottom:12,fontSize:12,color:"#92400e",fontFamily:"Segoe UI,sans-serif"}}>
              <div style={{fontWeight:700,marginBottom:5}}>Automatic Safety Steps before restore:</div>
              <div>{"✓"} Safety snapshot created automatically</div>
              <div>{"✓"} Backup version validated before restore</div>
              <div>{"✓"} Auto rollback if restore fails</div>
            </div>
            <label style={{display:"block",background:dlRw,border:"2px dashed "+dlBd,borderRadius:6,padding:"14px",cursor:"pointer",textAlign:"center",marginBottom:10}}>
              {restoreFile?(
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:dlTx,fontFamily:"Segoe UI,sans-serif"}}>{"📁"} {restoreFile.name}</div>
                  <div style={{fontSize:11,color:dlMu,marginTop:3,fontFamily:"Segoe UI,sans-serif"}}>
                    ~{Math.round(restoreFile.size/1024)} KB. Click to change.
                  </div>
                </div>
              ):(
                <div>
                  <div style={{fontSize:22,marginBottom:4}}>{"📂"}</div>
                  <div style={{fontSize:13,color:dlMu,fontFamily:"Segoe UI,sans-serif"}}>Click to select a .bak backup file</div>
                </div>
              )}
              <input type="file" accept=".bak,.json" style={{display:"none"}} onChange={function(e){setRestoreFile(e.target.files[0]||null);}}/>
            </label>
            <button onClick={function(){if(!restoreFile){alert("Please select a .bak file.");return;}setShowConfirm(true);}}
              style={{width:"100%",padding:"11px",borderRadius:7,border:"none",background:"#c2410c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",opacity:restoreFile?1:0.6}}>
              {"🔄"} Restore Selected Backup
            </button>
          </div>

          {/* Confirm modal */}
          {showConfirm&&restoreFile&&(
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:3500,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{background:dlBg,borderRadius:10,width:"min(400px,92vw)",border:"1px solid "+dlBd,boxShadow:"0 24px 48px rgba(0,0,0,0.4)",overflow:"hidden"}}>
                <div style={{background:"#7f1d1d",padding:"14px 18px",display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>{"⚠️"}</span>
                  <span style={{fontSize:14,fontWeight:700,color:"#fff",fontFamily:"Segoe UI,sans-serif"}}>Confirm Restore</span>
                </div>
                <div style={{padding:"18px 20px"}}>
                  <div style={{fontSize:14,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:10,lineHeight:1.6}}>
                    Restoring from: <b style={{color:"#c2410c"}}>{restoreFile.name}</b>
                  </div>
                  <div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:6,padding:"10px 12px",fontSize:12,color:"#7f1d1d",fontFamily:"Segoe UI,sans-serif",marginBottom:16}}>
                    This will replace ALL current data. A safety backup is created automatically first.
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={function(){setShowConfirm(false);}} style={{flex:1,padding:"9px",borderRadius:6,border:"1px solid "+dlBd,background:"transparent",color:dlMu,fontSize:13,cursor:"pointer",fontFamily:"Segoe UI,sans-serif"}}>Cancel</button>
                    <button onClick={runRestore} style={{flex:1,padding:"9px",borderRadius:6,border:"none",background:"#c2410c",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Segoe UI,sans-serif"}}>Yes, Restore</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Backup History */}
          {backupHistory&&backupHistory.length>0&&(
            <div>
              <div style={{fontSize:13,fontWeight:700,color:dlTx,marginBottom:8,fontFamily:"Segoe UI,sans-serif"}}>
                {"📋"} Recent History ({backupHistory.length})
              </div>
              <div style={{border:"1px solid "+dlBd,borderRadius:8,overflow:"hidden"}}>
                {backupHistory.slice(0,8).map(function(h,i){
                  return (
                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:i%2===0?(isDark?"#1c1c1c":"#fafafa"):(isDark?"#1a1a1a":"#fff"),borderBottom:i<Math.min(backupHistory.length,8)-1?"1px solid "+dlBd:"none"}}>
                      <span style={{fontSize:18,flexShrink:0}}>{h.type==="restore"?"🔄":"💾"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:dlTx,fontFamily:"Segoe UI,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.fname||"Restore"}</div>
                        <div style={{fontSize:11,color:dlMu,fontFamily:"Segoe UI,sans-serif"}}>
                          {new Date(h.ts).toLocaleString()} · {h.students||0} students
                          {h.note&&(" · "+h.note)}
                        </div>
                      </div>
                      <span style={{flexShrink:0,background:h.type==="restore"?"#fef9c3":"#dcfce7",color:h.type==="restore"?"#854d0e":"#166534",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>
                        {h.type==="restore"?"Restored":"Backup"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Feedback System ─────────────────────────────────────────────────────────
function FeedbackForm({isDark,dlBg,dlBd,dlTx,dlMu,dlFa,dlAc,dlRw,iSt,inline,onClose}){
  const [rating,setRating]   = useState(0);
  const [hover,setHover]     = useState(0);
  const [type,setType]       = useState("general"); // general | bug | feature
  const [text,setText]       = useState("");
  const [email,setEmail]     = useState("");
  const [sent,setSent]       = useState(false);
  const [sending,setSending] = useState(false);
  const [err,setErr]         = useState("");

  const TYPES = [
    {id:"general", icon:"😊", label:"General Feedback"},
    {id:"bug",     icon:"🐛", label:"Bug Report"},
    {id:"feature", icon:"💡", label:"Feature Suggestion"},
  ];

  const STAR_LABELS = ["","Poor","Fair","Good","Very Good","Excellent"];

  async function submit(){
    if(rating===0){setErr("Please select a star rating.");return;}
    if(!text.trim()){setErr("Please write your feedback.");return;}
    setErr(""); setSending(true);
    try{
      // Store feedback - in production this would POST to a licensing server
      // For now: store locally + attempt to POST to a public endpoint
      const payload = {
        rating, type, text: text.trim(), email: email.trim(),
        app:"SchoolSMS-Windows",
        version:"1.0",
        ts: new Date().toISOString(),
        school: localStorage.getItem("sms_school")||"Unknown",
      };
      // Save locally
      const prev = JSON.parse(localStorage.getItem("sms_feedback_history")||"[]");
      prev.push(payload);
      localStorage.setItem("sms_feedback_history", JSON.stringify(prev.slice(-20)));
      // Attempt online submission (graceful fail)
      try{
        await fetch("https://formspree.io/f/feedback-placeholder",{
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify(payload), signal:AbortSignal.timeout(5000)
        });
      }catch(_){}
      setSent(true);
    }catch(e){
      setErr("Something went wrong. Please try again.");
    }
    setSending(false);
  }

  if(sent) return(
    <div style={{textAlign:"center",padding:inline?"32px 0":"48px 24px"}}>
      <div style={{fontSize:52,marginBottom:12}}>🎉</div>
      <div style={{fontSize:20,fontWeight:700,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:8}}>Thank you!</div>
      <div style={{fontSize:14,color:dlMu,fontFamily:"Segoe UI,sans-serif",marginBottom:20,lineHeight:1.6}}>Your feedback has been saved.<br/>We read every response and use it to improve the app.</div>
      <div style={{display:"flex",justifyContent:"center",gap:10}}>
        <button onClick={()=>{setSent(false);setRating(0);setText("");setType("general");setEmail("");}}
          style={{padding:"8px 20px",borderRadius:6,border:"1px solid "+dlBd,background:"transparent",color:dlMu,fontSize:13,cursor:"pointer",fontFamily:"Segoe UI,sans-serif"}}>
          Submit Another
        </button>
        {onClose&&<button onClick={onClose}
          style={{padding:"8px 20px",borderRadius:6,border:"none",background:dlAc,color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",fontWeight:600}}>
          Done
        </button>}
      </div>
    </div>
  );

  return(
    <div>
      {/* Stars */}
      <div style={{marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:12,fontWeight:600,color:dlMu,marginBottom:8,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>
          How would you rate the app?
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:4}}>
          {[1,2,3,4,5].map(n=>(
            <span key={n}
              onClick={()=>setRating(n)}
              onMouseEnter={()=>setHover(n)}
              onMouseLeave={()=>setHover(0)}
              style={{fontSize:36,cursor:"pointer",transition:"transform 0.1s",display:"inline-block",transform:(hover||rating)>=n?"scale(1.15)":"scale(1)",filter:(hover||rating)>=n?"none":"grayscale(1) opacity(0.4)"}}>
              ⭐
            </span>
          ))}
        </div>
        {(hover||rating)>0&&(
          <div style={{fontSize:13,color:dlAc,fontWeight:600,fontFamily:"Segoe UI,sans-serif"}}>
            {STAR_LABELS[hover||rating]}
          </div>
        )}
      </div>

      {/* Feedback type */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:dlMu,marginBottom:6,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>Type</div>
        <div style={{display:"flex",gap:6}}>
          {TYPES.map(t=>(
            <button key={t.id} onClick={()=>setType(t.id)}
              style={{flex:1,padding:"7px 8px",borderRadius:6,border:"2px solid "+(type===t.id?dlAc:dlBd),background:type===t.id?dlAc+"18":"transparent",color:type===t.id?dlAc:dlMu,fontSize:12,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",fontWeight:type===t.id?600:400,textAlign:"center"}}>
              <div>{t.icon}</div>
              <div style={{fontSize:10,marginTop:2}}>{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Text */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:600,color:dlMu,marginBottom:5,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>
          {type==="bug"?"Describe the bug":"Your feedback"}
        </div>
        <textarea
          value={text} onChange={e=>setText(e.target.value)}
          placeholder={type==="bug"?"Describe what happened, steps to reproduce, expected vs actual behavior…":type==="feature"?"Describe the feature you'd like to see…":"What do you like or what can we improve?"}
          rows={4}
          style={{...iSt,resize:"vertical",lineHeight:1.6,fontFamily:"Segoe UI,sans-serif"}}/>
      </div>

      {/* Email */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:dlMu,marginBottom:5,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>
          Email (optional — for follow-up)
        </div>
        <input value={email} onChange={e=>setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{...iSt}}/>
      </div>

      {err&&<div style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:5,padding:"8px 12px",fontSize:12,color:"#991b1b",marginBottom:10,fontFamily:"Segoe UI,sans-serif"}}>{err}</div>}

      <button onClick={submit} disabled={sending}
        style={{width:"100%",padding:"10px",borderRadius:7,border:"none",background:sending?"#888":dlAc,color:"#fff",fontSize:14,fontWeight:700,cursor:sending?"wait":"pointer",fontFamily:"Segoe UI,sans-serif",transition:"background 0.2s"}}>
        {sending?"Sending…":"🚀 Submit Feedback"}
      </button>

      <div style={{marginTop:8,fontSize:10,color:dlFa,textAlign:"center",fontFamily:"Segoe UI,sans-serif"}}>
        Your feedback is saved locally and helps us improve the app.
      </div>
    </div>
  );
}

function FeedbackPopup({onClose,isDark}){
  const dlBg  = isDark?"#1e1e1e":"#ffffff";
  const dlBd  = isDark?"#333":"#e0e0e0";
  const dlTx  = isDark?"#e8e8e8":"#1a1a1a";
  const dlMu  = isDark?"#aaa":"#555";
  const dlFa  = isDark?"#666":"#999";
  const dlAc  = isDark?"#4da6ff":"#0067c0";
  const dlRw  = isDark?"#2a2a2a":"#f8f8f8";
  const iSt   = {background:isDark?"#2a2a2a":"#fff",border:"1px solid "+dlBd,borderRadius:6,padding:"8px 12px",fontSize:13,color:dlTx,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"Segoe UI,sans-serif"};
  const [dismissed,setDismissed] = useState(false);

  if(dismissed) return null;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:dlBg,borderRadius:14,width:"min(460px,95vw)",maxHeight:"92vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 32px 64px rgba(0,0,0,0.4)",border:"1px solid "+dlBd}}>

        {/* Header */}
        <div style={{padding:"20px 24px 0",textAlign:"center",position:"relative"}}>
          <button onClick={()=>{setDismissed(true);onClose();}}
            style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",cursor:"pointer",color:dlMu,fontSize:20,lineHeight:1}}>✕</button>
          <div style={{fontSize:44,marginBottom:8}}>💬</div>
          <div style={{fontSize:20,fontWeight:700,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:4}}>Enjoying the ERP?</div>
          <div style={{fontSize:13,color:dlMu,fontFamily:"Segoe UI,sans-serif",lineHeight:1.6,marginBottom:16}}>
            We'd love to hear your thoughts!<br/>
            Your feedback helps us build a better product.
          </div>
          <div style={{height:1,background:dlBd,marginBottom:0}}/>
        </div>

        {/* Body */}
        <div style={{padding:"16px 24px 20px",overflowY:"auto",flex:1}}>
          <FeedbackForm
            isDark={isDark} dlBg={dlBg} dlBd={dlBd} dlTx={dlTx} dlMu={dlMu}
            dlFa={dlFa} dlAc={dlAc} dlRw={dlRw} iSt={iSt}
            inline={false} onClose={onClose}/>
        </div>

        {/* Footer */}
        <div style={{padding:"0 24px 16px",textAlign:"center"}}>
          <button onClick={()=>{setDismissed(true);onClose();}}
            style={{background:"transparent",border:"none",cursor:"pointer",fontSize:12,color:dlFa,fontFamily:"Segoe UI,sans-serif",textDecoration:"underline"}}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Staff / Employee Module ─────────────────────────────────────────────────
const STAFF_ROLES = [
  {id:"teaching",   label:"Teaching Staff",     icon:"🎓", color:"#0067c0", desc:"Teachers — access classes, attendance, results"},
  {id:"office",     label:"Office Executive",   icon:"🗂️", color:"#107c10", desc:"Fees, admissions, receipts, student data"},
  {id:"reception",  label:"Reception Staff",    icon:"📞", color:"#7a4419", desc:"Search & view students, answer inquiries"},
];

const DESIGNATIONS = ["Principal","Vice Principal","Head Teacher","Senior Teacher","Teacher","Assistant Teacher","Lab Assistant","Librarian","Accountant","Admission Counselor","Office Assistant","Receptionist","Peon","Security Guard","Other"];

// ─── Archived Session Read-Only Banner ────────────────────────────────────────
function ArchivedBanner({sess}){
  return(
    <div style={{background:"#fef9c3",borderBottom:"2px solid #f59e0b",padding:"8px 20px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <span style={{fontSize:18}}>🔒</span>
      <div style={{flex:1}}>
        <span style={{fontSize:13,fontWeight:700,color:"#92400e",fontFamily:"Segoe UI,sans-serif"}}>Read-Only Mode — Archived Session ({sess})</span>
        <span style={{fontSize:12,color:"#7c5a1e",fontFamily:"Segoe UI,sans-serif",marginLeft:10}}>
          You can view and print records, but cannot add, edit, or delete data in a past session.
        </span>
      </div>
      <span style={{fontSize:12,color:"#92400e",fontFamily:"Segoe UI,sans-serif",fontWeight:600,background:"#fde68a",padding:"3px 10px",borderRadius:20}}>
        📖 View Only
      </span>
    </div>
  );
}

const emptyStaff = () => ({
  name:"", photo:"", mobile:"", email:"", address:"",
  joiningDate:"", designation:"", role:"teaching",
  qualification:"", salary:"", status:"active",
  assignedClasses:[],
});

function StaffModule({staff,setStaff,staffAccounts,setStaffAccounts,classes,school}){
  const [view,setView]         = useState("list");    // list | add | edit | accounts
  const [filterRole,setFilterRole] = useState("All");
  const [filterStatus,setFilterStatus] = useState("All");
  const [q,setQ]               = useState("");
  const [form,setForm]         = useState(emptyStaff());
  const [editId,setEditId]     = useState(null);
  const [selStaff,setSelStaff] = useState(null);      // for account management
  const [accForm,setAccForm]   = useState({username:"",password:"",active:true});
  const [showAccModal,setShowAccModal] = useState(false);
  const [showDelConfirm,setShowDelConfirm] = useState(null);

  const filtered = staff.filter(s=>{
    if(filterRole!=="All" && s.role!==filterRole) return false;
    if(filterStatus!=="All" && s.status!==filterStatus) return false;
    if(q && !s.name.toLowerCase().includes(q.toLowerCase()) && !s.designation.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const roleOf = id => STAFF_ROLES.find(r=>r.id===id)||STAFF_ROLES[0];

  function saveStaff(){
    if(!form.name.trim()){alert("Staff name is required.");return;}
    if(!form.designation){alert("Please select a designation.");return;}
    if(editId){
      setStaff(p=>p.map(s=>s.id===editId?{...s,...form}:s));
    } else {
      setStaff(p=>[...p,{...form,id:Date.now()}]);
    }
    setForm(emptyStaff()); setEditId(null); setView("list");
  }

  function delStaff(id){
    setStaff(p=>p.filter(s=>s.id!==id));
    setStaffAccounts(p=>p.filter(a=>a.staffId!==id));
  }

  function saveAccount(){
    if(!accForm.username.trim()){alert("Username required.");return;}
    if(!accForm.password.trim()){alert("Password required.");return;}
    if(staffAccounts.find(a=>a.username===accForm.username && a.staffId!==selStaff.id)){
      alert("Username already taken.");return;
    }
    const existing = staffAccounts.find(a=>a.staffId===selStaff.id);
    if(existing){
      setStaffAccounts(p=>p.map(a=>a.staffId===selStaff.id?{...a,...accForm}:a));
    } else {
      setStaffAccounts(p=>[...p,{...accForm,staffId:selStaff.id,staffName:selStaff.name,role:selStaff.role,id:Date.now()}]);
    }
    setShowAccModal(false);
  }

  function genUsername(name){
    return (name||"").toLowerCase().replace(/\s+/g,".")+Math.floor(Math.random()*100);
  }
  function genPassword(){
    const chars="ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
  }

  function printStaffList(){
    var today = new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
    var rows = filtered.map(function(s){
      var role = roleOf(s.role);
      var acc  = staffAccounts.find(function(a){return a.staffId===s.id;});
      return "<tr>"
        +"<td style='padding:7px 10px;border-bottom:1px solid #ebebeb;font-weight:600'>"+s.name+"</td>"
        +"<td style='padding:7px 10px;border-bottom:1px solid #ebebeb'>"+s.designation+"</td>"
        +"<td style='padding:7px 10px;border-bottom:1px solid #ebebeb'><span style='background:"+role.bg+";color:"+role.col+";padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600'>"+role.label+"</span></td>"
        +"<td style='padding:7px 10px;border-bottom:1px solid #ebebeb'>"+(s.phone||"—")+"</td>"
        +"<td style='padding:7px 10px;border-bottom:1px solid #ebebeb'>"+(s.email||"—")+"</td>"
        +"<td style='padding:7px 10px;border-bottom:1px solid #ebebeb'>"+(s.qual||"—")+"</td>"
        +"<td style='padding:7px 10px;border-bottom:1px solid #ebebeb'><span style='background:"+(s.status==="active"?"#dcfce7":"#fee2e2")+";color:"+(s.status==="active"?"#166534":"#991b1b")+";padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600'>"+(s.status==="active"?"Active":"Inactive")+"</span></td>"
        +"<td style='padding:7px 10px;border-bottom:1px solid #ebebeb'>"+(acc?"<span style='color:#0067c0;font-weight:600'>&#10003; Active</span>":"<span style='color:#aaa'>No Account</span>")+"</td>"
        +"</tr>";
    }).join("");
    var html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Staff List</title>"
      +"<style>*{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}"
      +"body{padding:24px;color:#1a1a1a}"
      +"table{width:100%;border-collapse:collapse;font-size:12px}"
      +"th{background:#1a56a0;color:#fff;padding:8px 10px;text-align:left;font-weight:600}"
      +"tr:nth-child(even) td{background:#f7f8fa}"
      +".footer{margin-top:10px;display:flex;justify-content:space-between;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:6px}"
      +"@media print{body{padding:0}@page{margin:1cm}}"
      +"</style></head><body>"
      +"<div style='border-bottom:2px solid #1e3a8a;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end'>"
      +"<div><div style='font-size:20px;font-weight:700;color:#1e3a8a'>"+school+"</div>"
      +"<div style='font-size:13px;color:#64748b;margin-top:2px'>Staff Directory</div></div>"
      +"<div style='text-align:right;font-size:11px;color:#64748b'>Total: "+filtered.length+" staff<br/>Printed: "+today+"</div>"
      +"</div>"
      +"<table><tr>"
      +"<th>Name</th><th>Designation</th><th>Role</th><th>Phone</th><th>Email</th><th>Qualification</th><th>Status</th><th>Login</th>"
      +"</tr>"+rows+"</table>"
      +"<div class='footer'><span>"+school+" — Staff List</span><span>"+today+"</span></div>"
      +"</body></html>";
    printHTML(html, "StaffList_"+school);
  }

  function printStaffCard(s){
    var role = roleOf(s.role);
    var today = new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
    var initials = s.name.split(" ").map(function(w){return w[0]||"";}).join("").slice(0,2).toUpperCase();
    var avatarColors = ["#0067c0","#7e3ff2","#107c10","#c42b1c","#7a4419"];
    var avatarBg = avatarColors[s.name.charCodeAt(0)%avatarColors.length];
    var avatarHtml = s.photo
      ? "<img src='"+s.photo+"' style='width:88px;height:100px;object-fit:cover;border-radius:8px;border:3px solid #e2e8f0;'/>"
      : "<div style='width:88px;height:100px;border-radius:8px;background:"+avatarBg+";display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;letter-spacing:1px'>"+initials+"</div>";

    var row = function(label,val){
      return val ? "<tr><td style='padding:6px 10px;color:#64748b;font-weight:600;font-size:12px;width:140px;border-bottom:1px solid #f1f5f9'>"+label+"</td><td style='padding:6px 10px;font-size:13px;border-bottom:1px solid #f1f5f9'>"+val+"</td></tr>" : "";
    };
    var html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Staff Card — "+s.name+"</title>"
      +"<style>*{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}"
      +"body{max-width:600px;margin:0 auto;padding:28px;color:#1a1a1a}"
      +"-webkit-print-color-adjust:exact;print-color-adjust:exact"
      +"@media print{body{padding:0}@page{margin:1cm}}"
      +"</style></head><body>"
      +"<div style='border-bottom:2px solid #1e3a8a;padding-bottom:12px;margin-bottom:20px'>"
      +"<div style='font-size:18px;font-weight:700;color:#1e3a8a'>"+school+"</div>"
      +"<div style='font-size:11px;color:#94a3b8;margin-top:2px'>Staff Identity Card</div>"
      +"</div>"
      +"<div style='display:flex;gap:18px;align-items:flex-start;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid "+role.col+";border-radius:8px;padding:16px;margin-bottom:18px'>"
      +avatarHtml
      +"<div style='flex:1'>"
      +"<div style='font-size:20px;font-weight:700;color:#1e3a8a;margin-bottom:4px'>"+s.name+"</div>"
      +"<div style='font-size:13px;color:#475569;margin-bottom:8px'>"+s.designation+"</div>"
      +"<span style='background:"+role.bg+";color:"+role.col+";padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700'>"+role.label+"</span>"
      +(s.status==="active"
        ? "<span style='margin-left:6px;background:#dcfce7;color:#166534;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700'>Active</span>"
        : "<span style='margin-left:6px;background:#fee2e2;color:#991b1b;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700'>Inactive</span>")
      +"</div></div>"
      +"<table style='width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden'>"
      +row("Employee ID","EMP-"+String(s.id).slice(-6))
      +row("Designation",s.designation)
      +row("Qualification",s.qual)
      +row("Experience",s.exp?(s.exp+" years"):null)
      +row("Date of Join",s.doj)
      +row("Phone",s.phone)
      +row("Email",s.email)
      +row("Address",s.addr)
      +row("Subjects",s.subjects&&s.subjects.length>0?s.subjects.join(", "):null)
      +row("Classes",s.classes&&s.classes.length>0?s.classes.join(", "):null)
      +"</table>"
      +"<div style='display:flex;justify-content:space-between;margin-top:32px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px'>"
      +"<span>"+school+"</span><span>Printed: "+today+"</span>"
      +"</div>"
      +"</body></html>";
    printHTML(html, "StaffCard_"+s.name);
  }

  const VIEWS=[{id:"list",icon:"👥",label:"All Staff"},{id:"add",icon:"➕",label:"Add Staff"},{id:"accounts",icon:"🔐",label:"Login Accounts"}];

  // ── STAFF FORM ──
  if(view==="add"||view==="edit") return (
    <div style={{padding:20,maxWidth:800}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <WB onClick={()=>{setView("list");setForm(emptyStaff());setEditId(null);}}>← Back</WB>
        <span style={{fontSize:18,fontWeight:700,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>{editId?"Edit Staff Member":"Add New Staff Member"}</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {/* Photo upload */}
        <div style={{gridColumn:"1/-1",display:"flex",gap:16,alignItems:"flex-start",background:W.acl,border:"1px solid "+W.bd,borderRadius:6,padding:14}}>
          <div style={{flexShrink:0}}>
            {form.photo
              ?<img src={form.photo} alt="Photo" style={{width:70,height:84,objectFit:"cover",borderRadius:6,border:"2px solid "+W.ac}}/>
              :<div style={{width:70,height:84,borderRadius:6,background:W.th,border:"2px dashed "+W.bd,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>👤</div>
            }
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,color:W.tx,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>Staff Photo</div>
            <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",background:W.ac,border:"none",borderRadius:5,cursor:"pointer",fontSize:12,color:"#fff",fontFamily:"Segoe UI,sans-serif"}}>
              📷 {form.photo?"Change":"Upload"} Photo
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                const f=e.target.files[0];if(!f)return;
                if(f.size>100*1024){alert("Photo must be under 100 KB");return;}
                const r=new FileReader(); r.onload=ev=>setForm(p=>({...p,photo:ev.target.result})); r.readAsDataURL(f);
              }}/>
            </label>
            {form.photo&&<button onClick={()=>setForm(p=>({...p,photo:""}))} style={{marginLeft:8,background:"transparent",border:"1px solid "+W.er,borderRadius:4,padding:"4px 10px",fontSize:11,color:W.er,cursor:"pointer"}}>✕ Remove</button>}
            <div style={{fontSize:10,color:W.fa,marginTop:4,fontFamily:"Segoe UI,sans-serif"}}>JPG/PNG · Max 100 KB</div>
          </div>
        </div>

        {/* Role selector */}
        <div style={{gridColumn:"1/-1"}}>
          <div style={{fontSize:12,color:W.mu,marginBottom:6,fontFamily:"Segoe UI,sans-serif",fontWeight:600,textTransform:"uppercase",letterSpacing:0.4}}>Staff Role</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {STAFF_ROLES.map(r=>(
              <div key={r.id} onClick={()=>setForm(p=>({...p,role:r.id}))}
                style={{flex:"1 1 180px",padding:"10px 14px",border:"2px solid "+(form.role===r.id?r.color:W.bd),borderRadius:6,cursor:"pointer",background:form.role===r.id?r.color+"18":W.sf,transition:"all 0.12s"}}>
                <div style={{fontSize:16,marginBottom:3}}>{r.icon}</div>
                <div style={{fontSize:13,fontWeight:700,color:form.role===r.id?r.color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>{r.label}</div>
                <div style={{fontSize:11,color:W.mu,fontFamily:"Segoe UI,sans-serif",marginTop:2}}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fields */}
        {[{k:"name",l:"Full Name",req:true},{k:"mobile",l:"Mobile Number"},{k:"email",l:"Email Address"},{k:"qualification",l:"Qualification"},{k:"address",l:"Address"},{k:"salary",l:"Salary (optional)"}].map(f=>(
          <div key={f.k}>
            <label style={{display:"block",fontSize:12,color:W.mu,marginBottom:3,fontFamily:"Segoe UI,sans-serif"}}>{f.l}{f.req&&<span style={{color:W.er}}> *</span>}</label>
            <WI value={form[f.k]||""} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.l}/>
          </div>
        ))}

        {/* Designation */}
        <div>
          <label style={{display:"block",fontSize:12,color:W.mu,marginBottom:3,fontFamily:"Segoe UI,sans-serif"}}>Designation <span style={{color:W.er}}>*</span></label>
          <WS value={form.designation} onChange={e=>setForm(p=>({...p,designation:e.target.value}))}>
            <option value="">-- Select Designation --</option>
            {DESIGNATIONS.map(d=><option key={d}>{d}</option>)}
          </WS>
        </div>

        {/* Joining date */}
        <div>
          <label style={{display:"block",fontSize:12,color:W.mu,marginBottom:3,fontFamily:"Segoe UI,sans-serif"}}>Joining Date</label>
          <WI type="date" value={form.joiningDate||""} onChange={e=>setForm(p=>({...p,joiningDate:e.target.value}))}/>
        </div>

        {/* Status */}
        <div>
          <label style={{display:"block",fontSize:12,color:W.mu,marginBottom:3,fontFamily:"Segoe UI,sans-serif"}}>Status</label>
          <WS value={form.status||"active"} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </WS>
        </div>

        {/* Assigned classes (teaching only) */}
        {form.role==="teaching"&&(
          <div style={{gridColumn:"1/-1"}}>
            <label style={{display:"block",fontSize:12,color:W.mu,marginBottom:6,fontFamily:"Segoe UI,sans-serif"}}>Assigned Classes</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {classes.map(c=>{
                const sel=(form.assignedClasses||[]).includes(c);
                return <button key={c} onClick={()=>setForm(p=>({...p,assignedClasses:sel?(p.assignedClasses||[]).filter(x=>x!==c):[...(p.assignedClasses||[]),c]}))}
                  style={{padding:"4px 12px",borderRadius:4,border:"1px solid "+(sel?W.ac:W.bd),background:sel?W.acl:"transparent",color:sel?W.ac:W.mu,fontSize:12,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",fontWeight:sel?600:400}}>
                  {c}
                </button>;
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{display:"flex",gap:8,marginTop:18,borderTop:"1px solid "+W.bd,paddingTop:14}}>
        <WB onClick={()=>{setView("list");setForm(emptyStaff());setEditId(null);}}>Cancel</WB>
        <WB v="p" onClick={saveStaff}>{editId?"Save Changes":"Add Staff Member"}</WB>
      </div>
    </div>
  );

  // ── ACCOUNTS VIEW ──
  if(view==="accounts") return (
    <div style={{padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <WB onClick={()=>setView("list")}>← Back</WB>
        <span style={{fontSize:18,fontWeight:700,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>Staff Login Accounts</span>
        <span style={{fontSize:12,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{staffAccounts.length} accounts created</span>
      </div>

      <div style={{background:W.acl,border:"1px solid "+W.bd,borderRadius:6,padding:"10px 14px",marginBottom:14,fontSize:12,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>
        💡 Create login accounts for staff members. Each account has a username, password and role-based access. Teachers see only their assigned classes.
      </div>

      <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:6,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr>
            {["Staff Name","Role","Username","Status","Actions"].map(h=><TH key={h}>{h}</TH>)}
          </tr></thead>
          <tbody>
            {staff.length===0&&<tr><td colSpan={5} style={{padding:30,textAlign:"center",color:W.fa,fontSize:13}}>No staff added yet. Add staff members first.</td></tr>}
            {staff.map((s,i)=>{
              const acc=staffAccounts.find(a=>a.staffId===s.id);
              const role=roleOf(s.role);
              return(
                <tr key={s.id} style={{background:i%2===1?W.ta:W.sf}}>
                  <TD>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {s.photo?<img src={s.photo} alt="" style={{width:28,height:28,borderRadius:"50%",objectFit:"cover",border:"1px solid "+W.bd}}/>:<div style={{width:28,height:28,borderRadius:"50%",background:role.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{role.icon}</div>}
                      <span style={{fontWeight:600,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>{s.name}</span>
                    </div>
                  </TD>
                  <TD><span style={{background:role.color+"22",color:role.color,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{role.label}</span></TD>
                  <TD style={{fontFamily:"Consolas,monospace",fontSize:12}}>{acc?acc.username:<span style={{color:W.fa,fontStyle:"italic"}}>No account</span>}</TD>
                  <TD>{acc?<Tag t={acc.active?"green":"red"}>{acc.active?"Active":"Inactive"}</Tag>:<Tag t="gray">—</Tag>}</TD>
                  <TD>
                    <div style={{display:"flex",gap:5}}>
                      <WB style={{fontSize:11,padding:"3px 8px"}} onClick={()=>{
                        setSelStaff(s);
                        const existing=staffAccounts.find(a=>a.staffId===s.id);
                        setAccForm(existing?{username:existing.username,password:existing.password,active:existing.active}:{username:genUsername(s.name),password:genPassword(),active:true});
                        setShowAccModal(true);
                      }}>{acc?"✏️ Edit":"➕ Create"} Account</WB>
                      {acc&&<WB style={{fontSize:11,padding:"3px 8px"}} onClick={()=>setStaffAccounts(p=>p.map(a=>a.staffId===s.id?{...a,active:!a.active}:a))}>{acc.active?"🔒 Deactivate":"🔓 Activate"}</WB>}
                    </div>
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Account modal */}
      {showAccModal&&selStaff&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:8,width:"min(420px,92vw)",overflow:"hidden",boxShadow:"0 24px 48px rgba(0,0,0,0.3)"}}>
            <div style={{background:W.modHdr,borderBottom:"1px solid "+W.bd,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:13,fontWeight:600,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>🔐 {staffAccounts.find(a=>a.staffId===selStaff.id)?"Edit":"Create"} Login — {selStaff.name}</span>
              <button onClick={()=>setShowAccModal(false)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18,color:W.mu}}>✕</button>
            </div>
            <div style={{padding:20}}>
              <div style={{background:roleOf(selStaff.role).color+"18",border:"1px solid "+roleOf(selStaff.role).color+"44",borderRadius:5,padding:"8px 12px",marginBottom:14,fontSize:12,color:roleOf(selStaff.role).color,fontFamily:"Segoe UI,sans-serif"}}>
                {roleOf(selStaff.role).icon} {roleOf(selStaff.role).label} — {roleOf(selStaff.role).desc}
              </div>
              <div style={{marginBottom:10}}>
                <label style={{display:"block",fontSize:12,color:W.mu,marginBottom:3,fontFamily:"Segoe UI,sans-serif"}}>Username</label>
                <div style={{display:"flex",gap:6}}>
                  <WI value={accForm.username} onChange={e=>setAccForm(p=>({...p,username:e.target.value}))} placeholder="username"/>
                  <WB style={{fontSize:11,padding:"4px 8px",flexShrink:0}} onClick={()=>setAccForm(p=>({...p,username:genUsername(selStaff.name)}))}>↺ Auto</WB>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{display:"block",fontSize:12,color:W.mu,marginBottom:3,fontFamily:"Segoe UI,sans-serif"}}>Password</label>
                <div style={{display:"flex",gap:6}}>
                  <WI value={accForm.password} onChange={e=>setAccForm(p=>({...p,password:e.target.value}))} placeholder="password" type="text"/>
                  <WB style={{fontSize:11,padding:"4px 8px",flexShrink:0}} onClick={()=>setAccForm(p=>({...p,password:genPassword()}))}>↺ Generate</WB>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>
                  <input type="checkbox" checked={accForm.active} onChange={e=>setAccForm(p=>({...p,active:e.target.checked}))} style={{width:16,height:16,accentColor:W.ac}}/>
                  Account Active (can log in)
                </label>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid "+W.bd,paddingTop:12}}>
                <WB onClick={()=>setShowAccModal(false)}>Cancel</WB>
                <WB v="p" onClick={saveAccount}>✓ Save Account</WB>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── STAFF LIST VIEW (default) ──
  const counts={total:staff.length};
  STAFF_ROLES.forEach(r=>{ counts[r.id]=staff.filter(s=>s.role===r.id).length; });
  counts.active=staff.filter(s=>s.status==="active").length;
  counts.inactive=staff.filter(s=>s.status!=="active").length;

  return (
    <div style={{padding:20}}>
      {/* Summary tiles */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16}}>
        {[
          {l:"Total Staff",v:counts.total,c:W.ac,icon:"👥"},
          {l:"Teaching",v:counts.teaching||0,c:"#0067c0",icon:"🎓"},
          {l:"Office Exec",v:counts.office||0,c:W.ok,icon:"🗂️"},
          {l:"Reception",v:counts.reception||0,c:W.wn,icon:"📞"},
          {l:"Active",v:counts.active,c:W.ok,icon:"✅"},
          {l:"Inactive",v:counts.inactive,c:W.er,icon:"❌"},
        ].map(s=>(
          <div key={s.l} style={{background:W.sf,border:"1px solid "+W.bd,borderLeft:"3px solid "+s.c,borderRadius:5,padding:"10px 14px"}}>
            <div style={{fontSize:16}}>{s.icon}</div>
            <div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:"Segoe UI,sans-serif"}}>{s.v}</div>
            <div style={{fontSize:11,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",fontSize:13,color:W.fa}}>🔍</span>
          <WI placeholder="Search staff…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:26,width:180}}/>
        </div>
        <WS value={filterRole} onChange={e=>setFilterRole(e.target.value)} style={{width:160}}>
          <option value="All">All Roles</option>
          {STAFF_ROLES.map(r=><option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
        </WS>
        <WS value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:130}}>
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </WS>
        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          <WB onClick={()=>setView("accounts")} style={{fontSize:12,padding:"5px 12px",background:W.wnb,border:"1px solid "+W.wn,color:W.wn}}>🔐 Login Accounts</WB>
          <WB onClick={printStaffList} style={{fontSize:12,padding:"5px 12px"}}>🖨️ Print List</WB>
          <WB v="p" onClick={()=>{setForm(emptyStaff());setEditId(null);setView("add");}}>➕ Add Staff</WB>
        </div>
      </div>

      {/* Staff grid */}
      {filtered.length===0?(
        <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:6,padding:60,textAlign:"center",color:W.fa,fontSize:14,fontFamily:"Segoe UI,sans-serif"}}>
          {staff.length===0?"No staff added yet. Click ➕ Add Staff to get started.":"No staff match the current filter."}
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
          {filtered.map(s=>{
            const role=roleOf(s.role);
            const acc=staffAccounts.find(a=>a.staffId===s.id);
            return(
              <div key={s.id} style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                {/* Card header */}
                <div style={{background:role.color+"18",borderBottom:"1px solid "+W.bd,padding:"12px 14px",display:"flex",gap:12,alignItems:"center"}}>
                  {s.photo
                    ?<img src={s.photo} alt="" style={{width:52,height:64,objectFit:"cover",borderRadius:6,border:"2px solid "+role.color+"66",flexShrink:0}}/>
                    :<div style={{width:52,height:64,borderRadius:6,background:role.color+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{role.icon}</div>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:W.tx,fontFamily:"Segoe UI,sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                    <div style={{fontSize:12,color:role.color,fontWeight:600,fontFamily:"Segoe UI,sans-serif",marginTop:2}}>{s.designation||"—"}</div>
                    <div style={{marginTop:4,display:"flex",gap:5,flexWrap:"wrap"}}>
                      <span style={{background:role.color+"22",color:role.color,padding:"1px 8px",borderRadius:20,fontSize:10,fontWeight:600}}>{role.icon} {role.label}</span>
                      <span style={{background:s.status==="active"?W.okb:W.erb,color:s.status==="active"?W.ok:W.er,padding:"1px 8px",borderRadius:20,fontSize:10,fontWeight:600}}>{s.status==="active"?"● Active":"○ Inactive"}</span>
                    </div>
                  </div>
                </div>
                {/* Card body */}
                <div style={{padding:"10px 14px"}}>
                  {s.mobile&&<div style={{fontSize:12,color:W.mu,fontFamily:"Segoe UI,sans-serif",marginBottom:3}}>📱 {s.mobile}</div>}
                  {s.email&&<div style={{fontSize:12,color:W.mu,fontFamily:"Segoe UI,sans-serif",marginBottom:3}}>✉️ {s.email}</div>}
                  {s.joiningDate&&<div style={{fontSize:12,color:W.fa,fontFamily:"Segoe UI,sans-serif",marginBottom:3}}>📅 Joined: {s.joiningDate}</div>}
                  {s.role==="teaching"&&s.assignedClasses?.length>0&&(
                    <div style={{marginTop:5,display:"flex",gap:4,flexWrap:"wrap"}}>
                      {s.assignedClasses.map(c=><span key={c} style={{background:W.acl,color:W.ac,padding:"1px 7px",borderRadius:3,fontSize:10,fontWeight:600}}>{c}</span>)}
                    </div>
                  )}
                  {acc&&(
                    <div style={{marginTop:6,background:W.th,borderRadius:4,padding:"4px 8px",fontSize:11,color:W.mu,fontFamily:"Consolas,monospace"}}>
                      👤 {acc.username} &nbsp;·&nbsp; <span style={{color:acc.active?W.ok:W.er}}>{acc.active?"Active":"Inactive"}</span>
                    </div>
                  )}
                </div>
                {/* Card actions */}
                <div style={{borderTop:"1px solid "+W.bd,padding:"8px 14px",display:"flex",gap:6}}>
                  <WB style={{fontSize:11,padding:"3px 8px",flex:1,justifyContent:"center"}} onClick={()=>{setForm({...s,assignedClasses:s.assignedClasses||[]});setEditId(s.id);setView("edit");}}>✏️ Edit</WB>
                  <WB style={{fontSize:11,padding:"3px 8px"}} onClick={()=>{setSelStaff(s);const ex=staffAccounts.find(a=>a.staffId===s.id);setAccForm(ex?{username:ex.username,password:ex.password,active:ex.active}:{username:genUsername(s.name),password:genPassword(),active:true});setShowAccModal(true);}}>🔐 Account</WB>
                  <WB style={{fontSize:11,padding:"3px 8px",background:"#f0f4ff",border:"1px solid "+W.acl,color:W.ac}} onClick={()=>printStaffCard(s)}>🖨️</WB>
                  <WB v="e" style={{fontSize:11,padding:"3px 8px"}} onClick={()=>{if(window.confirm("Delete "+s.name+"?"))delStaff(s.id);}}>🗑</WB>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{marginTop:8,fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{filtered.length} of {staff.length} staff shown</div>

      {/* Account modal (also accessible from list) */}
      {showAccModal&&selStaff&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:8,width:"min(420px,92vw)",overflow:"hidden",boxShadow:"0 24px 48px rgba(0,0,0,0.3)"}}>
            <div style={{background:W.modHdr,borderBottom:"1px solid "+W.bd,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:13,fontWeight:600,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>🔐 Login Account — {selStaff.name}</span>
              <button onClick={()=>setShowAccModal(false)} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:18,color:W.mu}}>✕</button>
            </div>
            <div style={{padding:20}}>
              <div style={{background:roleOf(selStaff.role).color+"18",border:"1px solid "+roleOf(selStaff.role).color+"44",borderRadius:5,padding:"8px 12px",marginBottom:14,fontSize:12,color:roleOf(selStaff.role).color,fontFamily:"Segoe UI,sans-serif"}}>
                {roleOf(selStaff.role).icon} {roleOf(selStaff.role).label}
              </div>
              <div style={{marginBottom:10}}>
                <label style={{display:"block",fontSize:12,color:W.mu,marginBottom:3,fontFamily:"Segoe UI,sans-serif"}}>Username</label>
                <div style={{display:"flex",gap:6}}>
                  <WI value={accForm.username} onChange={e=>setAccForm(p=>({...p,username:e.target.value}))} placeholder="username"/>
                  <WB style={{fontSize:11,padding:"4px 8px",flexShrink:0}} onClick={()=>setAccForm(p=>({...p,username:genUsername(selStaff.name)}))}>↺</WB>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{display:"block",fontSize:12,color:W.mu,marginBottom:3,fontFamily:"Segoe UI,sans-serif"}}>Password</label>
                <div style={{display:"flex",gap:6}}>
                  <WI value={accForm.password} onChange={e=>setAccForm(p=>({...p,password:e.target.value}))} placeholder="password"/>
                  <WB style={{fontSize:11,padding:"4px 8px",flexShrink:0}} onClick={()=>setAccForm(p=>({...p,password:genPassword()}))}>↺</WB>
                </div>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:W.tx,fontFamily:"Segoe UI,sans-serif",marginBottom:14}}>
                <input type="checkbox" checked={accForm.active} onChange={e=>setAccForm(p=>({...p,active:e.target.checked}))} style={{width:16,height:16,accentColor:W.ac}}/>
                Account Active
              </label>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid "+W.bd,paddingTop:12}}>
                <WB onClick={()=>setShowAccModal(false)}>Cancel</WB>
                <WB v="p" onClick={saveAccount}>✓ Save</WB>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Attendance Module ───────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  {id:"P", label:"Present",  color:"#107c10", bg:"#dff6dd", short:"P"},
  {id:"A", label:"Absent",   color:"#c42b1c", bg:"#fde7e4", short:"A"},
  {id:"L", label:"Late",     color:"#7a4419", bg:"#fff4ce", short:"L"},
  {id:"H", label:"Holiday",  color:"#7e3ff2", bg:"#ede7fd", short:"H"},
];

function Attendance({students,classes,school,sess,schoolAddr,logo,logoAlign,watermark,schoolEmail,schoolPhone,schoolWebsite,attendance,setAttendance,isArchived}){
  const today = new Date().toISOString().split("T")[0];
  const [view,setView]         = useState("daily");    // daily | history | report | monthly
  const [cls,setCls]           = useState(classes[0]||"");
  const [selDate,setSelDate]   = useState(today);
  const [histMonth,setHistMonth] = useState(today.slice(0,7)); // YYYY-MM
  const [reportMonth,setReportMonth] = useState(today.slice(0,7));

  useEffect(()=>{if(!classes.includes(cls))setCls(classes[0]||"");},[classes]);

  const attKey = (date,c) => date+"_"+c;

  // Get attendance for a day+class
  const getDayAtt = (date,c) => attendance[attKey(date,c)]||{};

  // Set one student's status
  const markOne = (date,c,sid,status) => {
    const key = attKey(date,c);
    setAttendance(p=>({...p,[key]:{...(p[key]||{}), [sid]:status}}));
  };

  // Mark all students for a day+class
  const markAll = (date,c,status) => {
    const sids = students.filter(s=>s.cls===c).map(s=>s.id);
    const key = attKey(date,c);
    const obj = {};
    sids.forEach(id=>{ obj[id]=status; });
    setAttendance(p=>({...p,[key]:obj}));
  };

  // Summary for a student in a month
  const monthSummary = (sid,month,c) => {
    const counts = {P:0,A:0,L:0,H:0,total:0};
    Object.keys(attendance).forEach(key=>{
      const [d,kc] = key.split(/_(.+)/);
      if(kc===c && d.startsWith(month)){
        const st = attendance[key][sid];
        if(st){ counts[st]=(counts[st]||0)+1; counts.total++; }
      }
    });
    return counts;
  };

  // Get all dates in a month that have attendance data for a class
  const datesInMonth = (month,c) => {
    const keys = Object.keys(attendance).filter(k=>{
      const [d,kc]=k.split(/_(.+)/); return kc===c && d.startsWith(month);
    });
    return [...new Set(keys.map(k=>k.split(/_(.+)/)[0]))].sort();
  };

  const clsStu = students.filter(s=>s.cls===cls);
  const dayAtt = getDayAtt(selDate,cls);
  const histDates = datesInMonth(histMonth,cls);
  const reportDates = datesInMonth(reportMonth,cls);

  const StatusPill = ({status,onClick,size=12})=>{
    const s = STATUS_OPTIONS.find(x=>x.id===status)||{color:W.fa,bg:W.th,short:"—"};
    return <span onClick={onClick}
      style={{background:s.bg,color:s.color,padding:"2px 8px",borderRadius:20,fontSize:size,fontWeight:700,cursor:onClick?"pointer":"default",display:"inline-block",minWidth:28,textAlign:"center",border:"1px solid "+s.color+"44"}}>
      {s.short}
    </span>;
  };

  const cycleStatus = (current) => {
    const opts=["P","A","L","H"];
    const idx=opts.indexOf(current);
    return opts[(idx+1)%opts.length];
  };

  // ── Print monthly report ──
  function printMonthlyReport(){
    const mStu = students.filter(s=>s.cls===cls);
    if(mStu.length===0){alert("No students in this class.");return;}
    const dates = datesInMonth(reportMonth,cls);
    if(dates.length===0){alert("No attendance data for this month.");return;}
    const [yr,mo] = reportMonth.split("-");
    const monthName = new Date(yr,mo-1,1).toLocaleString("en-IN",{month:"long",year:"numeric"});

    const thDates = dates.map(d=>`<th style="text-align:center;min-width:28px;font-size:10px">${d.slice(8)}</th>`).join("");
    const rows = mStu.map((s,i)=>{
      const sum = monthSummary(s.id,reportMonth,cls);
      const dayCells = dates.map(d=>{
        const dayAtt2 = getDayAtt(d,cls);
        const st = dayAtt2[s.id]||"";
        const colors={P:"#dcfce7",A:"#fee2e2",L:"#fef9c3",H:"#ede7fd","":`#f9f9f9`};
        const tc={P:"#166534",A:"#991b1b",L:"#854d0e",H:"#5b21b6","":`#bbb`};
        return`<td style="text-align:center;background:${colors[st]};color:${tc[st]};font-weight:700;font-size:10px;padding:3px">${st||"—"}</td>`;
      }).join("");
      return`<tr style="background:${i%2===0?"#fff":"#f7f8fa"}">
        <td style="font-weight:600;padding:4px 8px">${i+1}</td>
        <td style="font-weight:600;padding:4px 8px;white-space:nowrap">${s.name}</td>
        ${dayCells}
        <td style="text-align:center;font-weight:700;color:#166534;background:#dcfce7">${sum.P}</td>
        <td style="text-align:center;font-weight:700;color:#991b1b;background:#fee2e2">${sum.A}</td>
        <td style="text-align:center;font-weight:700;color:#854d0e;background:#fef9c3">${sum.L}</td>
        <td style="text-align:center;font-weight:700;color:#5b21b6;background:#ede7fd">${sum.H}</td>
        <td style="text-align:center;font-weight:700">${sum.total}</td>
      </tr>`;
    }).join("");

    let html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Attendance Report</title><style>
*{font-family:'Segoe UI',Arial,sans-serif;box-sizing:border-box;margin:0;padding:0}
body{padding:20px;color:#1a1a1a}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#1a56a0;color:#fff;padding:6px 8px;text-align:left;font-weight:600}
td{padding:4px 6px;border:1px solid #e0e0e0}
.footer{margin-top:12px;display:flex;justify-content:space-between;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:6px}
@media print{body{padding:4px}@page{size:A4 landscape;margin:0.8cm}}
</style></head><body>`;
    html+=buildPrintHeader(logo,null,null,logoAlign,school,schoolAddr,sess,"Attendance Report &bull; "+cls+" &bull; "+monthName,{email:schoolEmail,phone:schoolPhone,website:schoolWebsite});
    html+=`<table><thead><tr>
      <th>#</th><th>Student Name</th>${thDates}
      <th style="background:#166534">P</th>
      <th style="background:#991b1b">A</th>
      <th style="background:#854d0e">L</th>
      <th style="background:#5b21b6">H</th>
      <th>Total</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
    html+=`<div class="footer"><span>Generated: ${new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</span><span>Class: ${cls} &nbsp;|&nbsp; ${monthName}</span><span>${school}</span></div>`;
    html+=`</body></html>`;
    const _wm=buildWatermarkHTML(watermark);
    if(_wm) html=html.replace(/<\/body>/i,_wm+"</body>");
    printHTML(html,"Attendance_"+cls+"_"+reportMonth);
  }

  const VIEWS=[{id:"daily",icon:"📋",label:"Daily"},{id:"history",icon:"📆",label:"History"},{id:"report",icon:"📊",label:"Report"},{id:"monthly",icon:"🗓️",label:"Monthly Summary"}];

  return (
    <div style={{padding:20}}>
      {isArchived&&<ArchivedBanner sess={sess}/>}
      {/* View toggle */}
      <div style={{display:"flex",gap:0,marginBottom:16,border:"1px solid "+W.bd,borderRadius:6,overflow:"hidden",width:"fit-content"}}>
        {VIEWS.map((v,i)=>(
          <button key={v.id} onClick={()=>setView(v.id)}
            style={{padding:"8px 18px",border:"none",borderRight:i<VIEWS.length-1?"1px solid "+W.bd:"none",cursor:"pointer",fontSize:13,fontFamily:"Segoe UI,sans-serif",fontWeight:view===v.id?700:400,background:view===v.id?W.ac:"transparent",color:view===v.id?"#fff":W.mu,transition:"all 0.15s"}}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Class selector row */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <span style={{fontSize:13,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>Class:</span>
        <WS value={cls} onChange={e=>setCls(e.target.value)} style={{width:110}}>
          {classes.map(c=><option key={c}>{c}</option>)}
        </WS>
        {view==="daily"&&(
          <>
            <span style={{fontSize:13,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>Date:</span>
            <WI type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} style={{width:150}}/>
            <div style={{marginLeft:"auto",display:"flex",gap:6}}>
              {!isArchived&&<WB style={{fontSize:12,padding:"4px 10px"}} onClick={()=>markAll(selDate,cls,"P")}>✓ All Present</WB>}
              {!isArchived&&<WB style={{fontSize:12,padding:"4px 10px"}} onClick={()=>markAll(selDate,cls,"A")}>✗ All Absent</WB>}
              {!isArchived&&<WB style={{fontSize:12,padding:"4px 10px"}} onClick={()=>markAll(selDate,cls,"H")}>🏖 Holiday</WB>}
            </div>
          </>
        )}
        {view==="history"&&(
          <>
            <span style={{fontSize:13,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>Month:</span>
            <WI type="month" value={histMonth} onChange={e=>setHistMonth(e.target.value)} style={{width:150}}/>
          </>
        )}
        {(view==="report"||view==="monthly")&&(
          <>
            <span style={{fontSize:13,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>Month:</span>
            <WI type="month" value={reportMonth} onChange={e=>setReportMonth(e.target.value)} style={{width:150}}/>
            <div style={{marginLeft:"auto"}}>
              <WB v="p" style={{fontSize:12,padding:"5px 14px"}} onClick={printMonthlyReport}>📄 Export PDF</WB>
            </div>
          </>
        )}
      </div>

      {/* ── DAILY ATTENDANCE ── */}
      {view==="daily"&&(
        <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:6,overflow:"hidden"}}>
          {/* Stats bar */}
          {clsStu.length>0&&(()=>{
            const counts={P:0,A:0,L:0,H:0,unmarked:0};
            clsStu.forEach(s=>{ const st=dayAtt[s.id]; if(st) counts[st]++; else counts.unmarked++; });
            return(
              <div style={{display:"flex",gap:0,borderBottom:"1px solid "+W.bd}}>
                {[
                  {l:"Present",v:counts.P,c:W.ok,bg:W.okb},
                  {l:"Absent",v:counts.A,c:W.er,bg:W.erb},
                  {l:"Late",v:counts.L,c:W.wn,bg:W.wnb},
                  {l:"Holiday",v:counts.H,c:W.pu,bg:W.pub},
                  {l:"Unmarked",v:counts.unmarked,c:W.mu,bg:W.th},
                ].map(s=>(
                  <div key={s.l} style={{flex:1,padding:"10px 8px",textAlign:"center",background:s.bg,borderRight:"1px solid "+W.bd}}>
                    <div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:"Segoe UI,sans-serif"}}>{s.v}</div>
                    <div style={{fontSize:11,color:s.c,fontFamily:"Segoe UI,sans-serif"}}>{s.l}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>
                <TH>S.No</TH>
                <TH>Student Name</TH>
                <TH>Status</TH>
                <TH>Mark</TH>
              </tr>
            </thead>
            <tbody>
              {clsStu.length===0&&(
                <tr><td colSpan={4} style={{padding:40,textAlign:"center",color:W.fa,fontSize:13,fontFamily:"Segoe UI,sans-serif"}}>No students in Class {cls}</td></tr>
              )}
              {clsStu.map((s,i)=>{
                const st = dayAtt[s.id]||"";
                return(
                  <tr key={s.id} style={{background:i%2===1?W.ta:W.sf}}
                    onMouseEnter={e=>e.currentTarget.style.background=W.rowHov}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===1?W.ta:W.sf}>
                    <TD style={{fontWeight:700,color:W.ac}}>{s.roll}</TD>
                    <TD>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {s.photo?<img src={s.photo} alt="" style={{width:28,height:34,objectFit:"cover",borderRadius:3,border:"1px solid "+W.bd}}/>:<div style={{width:28,height:34,borderRadius:3,background:W.acl,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:W.ac,flexShrink:0}}>{(s.name||"?")[0]}</div>}
                        <div>
                          <div style={{fontWeight:600,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>{s.name}</div>
                          <div style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{s.dad}</div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      {st?<StatusPill status={st}/>:<span style={{fontSize:12,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>—</span>}
                    </TD>
                    <TD>
                      <div style={{display:"flex",gap:5}}>
                        {STATUS_OPTIONS.map(opt=>(
                          <button key={opt.id} onClick={()=>!isArchived&&markOne(selDate,cls,s.id,opt.id)}
                            style={{width:32,height:28,borderRadius:20,border:"2px solid "+(st===opt.id?opt.color:W.bd),background:st===opt.id?opt.bg:"transparent",color:st===opt.id?opt.color:W.mu,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.12s"}}>
                            {opt.short}
                          </button>
                        ))}
                      </div>
                    </TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── HISTORY VIEW ── */}
      {view==="history"&&(
        <div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:6,overflow:"auto"}}>
          {histDates.length===0
            ?<div style={{padding:40,textAlign:"center",color:W.fa,fontSize:13,fontFamily:"Segoe UI,sans-serif"}}>No attendance recorded for {histMonth} in Class {cls}</div>
            :<table style={{width:"100%",borderCollapse:"collapse",minWidth:400}}>
              <thead>
                <tr>
                  <TH>Student</TH>
                  {histDates.map(d=><th key={d} style={{padding:"6px 4px",textAlign:"center",fontSize:11,color:W.mu,borderBottom:"1px solid "+W.bd,background:W.th,fontFamily:"Segoe UI,sans-serif",minWidth:32}}>{d.slice(8)}<br/><span style={{fontSize:9,color:W.fa}}>{new Date(d+"T00:00").toLocaleDateString("en",{weekday:"short"})}</span></th>)}
                  <TH>P</TH><TH>A</TH><TH>L</TH><TH>%</TH>
                </tr>
              </thead>
              <tbody>
                {clsStu.map((s,i)=>{
                  const sum=monthSummary(s.id,histMonth,cls);
                  const pct=sum.total>0?Math.round((sum.P/sum.total)*100):0;
                  return(
                    <tr key={s.id} style={{background:i%2===1?W.ta:W.sf}}>
                      <TD style={{fontWeight:600,whiteSpace:"nowrap"}}>{s.name}</TD>
                      {histDates.map(d=>{
                        const st=getDayAtt(d,cls)[s.id]||"";
                        return <td key={d} style={{padding:"4px 3px",textAlign:"center",borderBottom:"1px solid "+W.bd}}>
                          {st?<StatusPill status={st} size={10}/>:<span style={{fontSize:10,color:W.fa}}>—</span>}
                        </td>;
                      })}
                      <TD style={{textAlign:"center",fontWeight:700,color:W.ok}}>{sum.P}</TD>
                      <TD style={{textAlign:"center",fontWeight:700,color:W.er}}>{sum.A}</TD>
                      <TD style={{textAlign:"center",fontWeight:700,color:W.wn}}>{sum.L}</TD>
                      <TD style={{textAlign:"center",fontWeight:700,color:pct>=75?W.ok:pct>=50?W.wn:W.er}}>{pct}%</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          }
        </div>
      )}

      {/* ── REPORT VIEW ── */}
      {view==="report"&&(
        <div>
          {reportDates.length===0
            ?<div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:6,padding:40,textAlign:"center",color:W.fa,fontSize:13}}>No attendance data for this month in Class {cls}</div>
            :<div style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:6,overflow:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
                <thead>
                  <tr>
                    <TH>S.No</TH>
                    <TH>Student Name</TH>
                    <TH>Present</TH>
                    <TH>Absent</TH>
                    <TH>Late</TH>
                    <TH>Holiday</TH>
                    <TH>Total Days</TH>
                    <TH>Attendance %</TH>
                  </tr>
                </thead>
                <tbody>
                  {clsStu.map((s,i)=>{
                    const sum=monthSummary(s.id,reportMonth,cls);
                    const pct=sum.total>0?Math.round((sum.P/sum.total)*100):0;
                    const barColor=pct>=75?W.ok:pct>=50?W.wn:W.er;
                    return(
                      <tr key={s.id} style={{background:i%2===1?W.ta:W.sf}}>
                        <TD style={{fontWeight:700,color:W.ac}}>{s.roll}</TD>
                        <TD style={{fontWeight:600}}>{s.name}</TD>
                        <TD><Tag t="green">{sum.P}</Tag></TD>
                        <TD><Tag t="red">{sum.A}</Tag></TD>
                        <TD><Tag t="yellow">{sum.L}</Tag></TD>
                        <TD><Tag t="purple">{sum.H}</Tag></TD>
                        <TD style={{textAlign:"center",fontWeight:600}}>{sum.total}</TD>
                        <TD>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{background:W.bd,borderRadius:3,height:8,width:70,flexShrink:0}}>
                              <div style={{background:barColor,height:"100%",borderRadius:3,width:Math.min(pct,100)+"%"}}/>
                            </div>
                            <span style={{fontSize:12,fontWeight:700,color:barColor,minWidth:32}}>{pct}%</span>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          }
        </div>
      )}

      {/* ── MONTHLY SUMMARY ── */}
      {view==="monthly"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
          {clsStu.length===0
            ?<div style={{gridColumn:"1/-1",background:W.sf,border:"1px solid "+W.bd,borderRadius:6,padding:40,textAlign:"center",color:W.fa,fontSize:13}}>No students in Class {cls}</div>
            :clsStu.map(s=>{
              const sum=monthSummary(s.id,reportMonth,cls);
              const pct=sum.total>0?Math.round((sum.P/sum.total)*100):0;
              const pColor=pct>=75?W.ok:pct>=50?W.wn:W.er;
              return(
                <div key={s.id} style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:8,padding:"14px 16px",borderTop:"3px solid "+pColor}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    {s.photo?<img src={s.photo} alt="" style={{width:36,height:44,objectFit:"cover",borderRadius:4,border:"1px solid "+W.bd,flexShrink:0}}/>:<div style={{width:36,height:44,borderRadius:4,background:W.acl,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:W.ac,flexShrink:0}}>{(s.name||"?")[0]}</div>}
                    <div>
                      <div style={{fontWeight:700,color:W.tx,fontSize:13,fontFamily:"Segoe UI,sans-serif"}}>{s.name}</div>
                      <div style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>S.No: {s.roll}</div>
                    </div>
                  </div>
                  {/* Pie-like stat row */}
                  <div style={{display:"flex",gap:6,marginBottom:10}}>
                    {[{l:"P",v:sum.P,c:W.ok,bg:W.okb},{l:"A",v:sum.A,c:W.er,bg:W.erb},{l:"L",v:sum.L,c:W.wn,bg:W.wnb},{l:"H",v:sum.H,c:W.pu,bg:W.pub}].map(x=>(
                      <div key={x.l} style={{flex:1,background:x.bg,borderRadius:5,padding:"5px 4px",textAlign:"center"}}>
                        <div style={{fontSize:16,fontWeight:700,color:x.c,fontFamily:"Segoe UI,sans-serif"}}>{x.v}</div>
                        <div style={{fontSize:10,color:x.c,fontFamily:"Segoe UI,sans-serif"}}>{x.l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div style={{background:W.bd,borderRadius:4,height:10,marginBottom:4}}>
                    <div style={{background:pColor,height:"100%",borderRadius:4,width:Math.min(pct,100)+"%",transition:"width 0.3s"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontFamily:"Segoe UI,sans-serif"}}>
                    <span style={{color:W.mu}}>Attendance</span>
                    <span style={{fontWeight:700,color:pColor}}>{pct}% {pct>=75?"✓":pct>=50?"⚠":"✗"}</span>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      <div style={{marginTop:8,fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>
        {view==="daily"&&`${clsStu.length} students · ${selDate} · Click P/A/L/H buttons to mark · Click status pill to cycle`}
        {view==="history"&&`Showing ${histDates.length} days with data for ${histMonth}`}
        {(view==="report"||view==="monthly")&&`${clsStu.length} students · ${reportMonth} · Attendance % = Present ÷ Total marked days`}
      </div>
    </div>
  );
}

// ─── Session Manager Tab (standalone so it can use useState hooks) ────────────
function SessionManagerTab({
  dlBg,dlSb,dlBd,dlTx,dlMu,dlFa,dlHv,dlAc,dlRw,iSt,isDark,
  allSessions,currentSessId,sess,students,
  promoNewSess,setPromoNewSess,nextSession,
  onSwitchSession,onDeleteSession,onPromote,onAddBlankSession
}){
  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newType,    setNewType]    = useState("blank"); // "blank"|"promote"|"copy"
  const [copyFrom,   setCopyFrom]   = useState(allSessions[0]?.id||"");
  const [promoName,  setPromoName]  = useState("");

  // Sort sessions: oldest first, current highlighted
  const sorted = [...allSessions].sort((a,b)=>a.name.localeCompare(b.name));
  const prevSess = sorted.filter(s=>s.name<sess);
  const currSess = sorted.filter(s=>s.name===sess);
  const nextSess = sorted.filter(s=>s.name>sess);

  function prevSession(s){
    const p=s.split("-"); if(p.length===2){const y=parseInt(p[0]); if(!isNaN(y)) return (y-1)+"-"+String(y).slice(-2);} return s+" (prev)";
  }

  function handleCreate(){
    const name = newName.trim() || (newType==="promote"?(promoName||nextSession(sess)):"");
    if(!name){alert("Enter a session name.");return;}
    if(allSessions.find(s=>s.name===name)){alert("Session \""+name+"\" already exists.");return;}
    if(newType==="blank"){
      onAddBlankSession(name);
      setShowCreate(false); setNewName("");
    } else if(newType==="copy"){
      const src = allSessions.find(s=>s.id===copyFrom);
      if(!src){alert("Select a source session.");return;}
      onAddBlankSession(name, src);
      setShowCreate(false); setNewName("");
    } else if(newType==="promote"){
      const ns=(newName.trim()||promoName||nextSession(sess)).trim();
      if(!ns){alert("Enter the new session name.");return;}
      if(allSessions.find(s=>s.name===ns)){alert("Session \""+ns+"\" already exists.");return;}
      // Set name first, then open promotion wizard after brief delay for state to settle
      setPromoNewSess(ns);
      setShowCreate(false);
      setTimeout(()=>{ onPromote(); }, 50);
    }
  }

  const btnBase = {border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",fontWeight:600};

  function SessionCard({s, group}){
    const isCurrent = s.id===currentSessId;
    const fee = Object.values(s.fees||{}).reduce((tot,f)=>{const p=(f.pay||[]).reduce((a,x)=>a+Number(x.amt),0);return{total:tot.total+f.total,paid:tot.paid+p};},{total:0,paid:0});
    const tagColor = group==="prev"?"#888":group==="current"?dlAc:"#107c10";
    const tagLabel = group==="prev"?"Past":group==="current"?"Current":"Future";
    const tagBg    = group==="prev"?(isDark?"#2a2a2a":"#f0f0f0"):group==="current"?(isDark?"#1a3550":"#e8f0fb"):(isDark?"#1a3a1a":"#e6f4ea");

    return(
      <div style={{border:"2px solid "+(isCurrent?dlAc:dlBd),borderRadius:10,padding:"14px 16px",marginBottom:10,background:isCurrent?(isDark?"#1e2d3a":"#f4f8ff"):dlRw,transition:"all 0.15s"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{fontSize:18,fontWeight:700,color:isCurrent?dlAc:dlTx,fontFamily:"Segoe UI,sans-serif"}}>{s.name}</span>
              <span style={{background:tagBg,color:tagColor,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>{tagLabel}</span>
              {isCurrent&&<span style={{background:dlAc,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8,fontFamily:"Segoe UI,sans-serif"}}>● ACTIVE</span>}
            </div>
            {/* Stats row */}
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              {[
                {icon:"👨‍🎓",label:"Students",val:s.students.length},
                {icon:"♂",label:"Boys",val:s.students.filter(x=>x.sex==="M").length},
                {icon:"♀",label:"Girls",val:s.students.filter(x=>x.sex==="F").length},
                {icon:"💰",label:"Collected",val:"Rs."+(fee.paid).toLocaleString()},
                {icon:"📋",label:"Due",val:"Rs."+(fee.total-fee.paid).toLocaleString()},
              ].map(item=>(
                <div key={item.label} style={{textAlign:"center",minWidth:52}}>
                  <div style={{fontSize:14,fontWeight:700,color:dlTx,fontFamily:"Segoe UI,sans-serif"}}>{item.val}</div>
                  <div style={{fontSize:10,color:dlMu,fontFamily:"Segoe UI,sans-serif"}}>{item.icon} {item.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Actions */}
          <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"flex-start",flexWrap:"wrap"}}>
            {isCurrent?(
              <span style={{fontSize:12,color:dlMu,fontFamily:"Segoe UI,sans-serif",padding:"6px 0"}}>Currently viewing</span>
            ):(
              <button onClick={()=>onSwitchSession(s.id)}
                style={{...btnBase,background:dlAc,color:"#fff",padding:"7px 16px"}}>
                Open →
              </button>
            )}
            {!isCurrent&&allSessions.length>1&&(
              <button onClick={()=>{if(window.confirm("Delete session \""+s.name+"\"?\nAll its data ("+s.students.length+" students, fees, marks) will be permanently removed."))onDeleteSession(s.id);}}
                style={{...btnBase,background:"transparent",border:"1px solid "+dlBd,color:dlFa,padding:"6px 12px"}}>
                🗑 Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <div style={{fontSize:22,fontWeight:600,color:dlTx,fontFamily:"Segoe UI,sans-serif"}}>Sessions</div>
          <div style={{fontSize:12,color:dlMu,fontFamily:"Segoe UI,sans-serif",marginTop:2}}>{allSessions.length} total · Switch or manage all academic sessions</div>
        </div>
        <button onClick={()=>{setShowCreate(true);setNewName("");setNewType("blank");setPromoName(nextSession(sess));}}
          style={{...btnBase,background:dlAc,color:"#fff",padding:"9px 18px",fontSize:13,display:"flex",alignItems:"center",gap:6}}>
          ＋ New Session
        </button>
      </div>
      <div style={{height:1,background:dlBd,marginBottom:16}}/>

      {/* Future sessions */}
      {nextSess.length>0&&(
        <div style={{marginBottom:4}}>
          <div style={{fontSize:11,fontWeight:700,color:"#107c10",marginBottom:8,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.6}}>▲ Upcoming Sessions</div>
          {nextSess.map(s=><SessionCard key={s.id} s={s} group="next"/>)}
        </div>
      )}

      {/* Current session */}
      {currSess.length>0&&(
        <div style={{marginBottom:4}}>
          <div style={{fontSize:11,fontWeight:700,color:dlAc,marginBottom:8,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.6}}>● Current Session</div>
          {currSess.map(s=><SessionCard key={s.id} s={s} group="current"/>)}
        </div>
      )}

      {/* Past sessions */}
      {prevSess.length>0&&(
        <div style={{marginBottom:4}}>
          <div style={{fontSize:11,fontWeight:700,color:dlMu,marginBottom:8,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.6}}>▼ Previous Sessions</div>
          {[...prevSess].reverse().map(s=><SessionCard key={s.id} s={s} group="prev"/>)}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreate&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:dlBg,border:"1px solid "+dlBd,borderRadius:12,width:"min(500px,92vw)",overflow:"hidden",boxShadow:"0 24px 48px rgba(0,0,0,0.4)"}}>
            {/* Modal header */}
            <div style={{background:isDark?"#1a1a1a":"#f5f5f5",borderBottom:"1px solid "+dlBd,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:15,fontWeight:700,color:dlTx,fontFamily:"Segoe UI,sans-serif"}}>➕ Create New Session</span>
              <button onClick={()=>setShowCreate(false)} style={{background:"transparent",border:"none",cursor:"pointer",color:dlMu,fontSize:18}}>✕</button>
            </div>
            <div style={{padding:"20px"}}>

              {/* Session name */}
              <div style={{marginBottom:16}}>
                <label style={{display:"block",fontSize:12,fontWeight:600,color:dlMu,marginBottom:6,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.4}}>Session Name</label>
                <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. 2025-26, 2027-28…"
                  style={{...iSt,fontSize:15,fontWeight:600,textAlign:"center"}}
                  onKeyDown={e=>e.key==="Enter"&&handleCreate()}/>
                {/* Quick-fill suggestions */}
                <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                  {[prevSession(sess),nextSession(sess),nextSession(nextSession(sess))].filter(n=>!allSessions.find(s=>s.name===n)).map(n=>(
                    <button key={n} onClick={()=>setNewName(n)}
                      style={{...btnBase,background:dlAc+"18",border:"1px solid "+dlAc+"44",color:dlAc,padding:"3px 10px",fontSize:11,fontWeight:600}}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session type */}
              <div style={{marginBottom:18}}>
                <label style={{display:"block",fontSize:12,fontWeight:600,color:dlMu,marginBottom:8,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.4}}>Session Type</label>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    {id:"blank",   icon:"📄", title:"Blank Session",         sub:"Start fresh — add students manually or via CSV import"},
                    {id:"promote", icon:"🎓", title:"Promote from Current",  sub:"Auto-promote "+students.length+" students to next class, review before confirm"},
                    {id:"copy",    icon:"📋", title:"Copy from Session",      sub:"Duplicate all students & data from an existing session"},
                  ].map(t=>(
                    <div key={t.id} onClick={()=>setNewType(t.id)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:8,border:"2px solid "+(newType===t.id?dlAc:dlBd),cursor:"pointer",background:newType===t.id?(isDark?"#1a2d40":"#f0f6ff"):dlRw,transition:"all 0.12s"}}>
                      <span style={{fontSize:22,flexShrink:0}}>{t.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:newType===t.id?dlAc:dlTx,fontFamily:"Segoe UI,sans-serif"}}>{t.title}</div>
                        <div style={{fontSize:11,color:dlMu,fontFamily:"Segoe UI,sans-serif",marginTop:2}}>{t.sub}</div>
                      </div>
                      <div style={{width:18,height:18,borderRadius:9,border:"2px solid "+(newType===t.id?dlAc:dlBd),background:newType===t.id?dlAc:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {newType===t.id&&<div style={{width:8,height:8,borderRadius:4,background:"#fff"}}/>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy-from selector */}
              {newType==="copy"&&(
                <div style={{marginBottom:14,padding:"10px 14px",background:isDark?"#1a1a1a":"#f8f8f8",border:"1px solid "+dlBd,borderRadius:6}}>
                  <label style={{fontSize:12,fontWeight:600,color:dlMu,fontFamily:"Segoe UI,sans-serif"}}>Copy data from:</label>
                  <select value={copyFrom} onChange={e=>setCopyFrom(e.target.value)}
                    style={{...iSt,marginTop:6}}>
                    {allSessions.map(s=><option key={s.id} value={s.id}>{s.name} ({s.students.length} students)</option>)}
                  </select>
                </div>
              )}

              {/* Promote info */}
              {newType==="promote"&&(
                <div style={{marginBottom:14,padding:"10px 14px",background:isDark?"#1a3a1a":"#e6f4ea",border:"1px solid #4caf5044",borderRadius:6,fontSize:12,color:dlMu,fontFamily:"Segoe UI,sans-serif"}}>
                  ✓ Session name above will be the new session name<br/>
                  ✓ All {students.length} current students promoted one class up<br/>
                  ✓ Fees reset · Marks reset · You review before confirming
                </div>
              )}

              {/* Buttons */}
              <div style={{display:"flex",gap:8,justifyContent:"flex-end",borderTop:"1px solid "+dlBd,paddingTop:14}}>
                <button onClick={()=>setShowCreate(false)}
                  style={{...btnBase,background:"transparent",border:"1px solid "+dlBd,color:dlMu}}>Cancel</button>
                <button onClick={handleCreate}
                  style={{...btnBase,background:dlAc,color:"#fff",padding:"8px 20px",fontSize:13}}>
                  {newType==="promote"?"🎓 Promote & Create":"➕ Create Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Sub-components (must be outside SettingsDialog) ────────────────
function SettingRow({label,sub,children,divider,dlBd,dlTx,dlMu}){
  return(
    <div style={{padding:"14px 0",borderBottom:divider!==false?"1px solid "+dlBd:"none"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:20}}>
        <div style={{flex:1}}>
          <div style={{fontSize:14,color:dlTx,fontFamily:"Segoe UI,sans-serif"}}>{label}</div>
          {sub&&<div style={{fontSize:12,color:dlMu,fontFamily:"Segoe UI,sans-serif",marginTop:3,lineHeight:1.4}}>{sub}</div>}
        </div>
        <div style={{flexShrink:0}}>{children}</div>
      </div>
    </div>
  );
}

// ─── Settings Dialog Component ────────────────────────────────────────────────
function SettingsDialog({W,theme,setTheme,sf,setSf,sfLogo,setSfLogo,
  sfLogoAlign,setSfLogoAlign,sfWm,setSfWm,
  promoNewSess,setPromoNewSess,nextSession,sess,students,onPromote,onClose,onSave,onDeleteAll,
  allSessions,currentSessId,onSwitchSession,onDeleteSession,onAddBlankSession,
  onBackup,onRestore,backupHistory}){
  const [tab,setTab] = useState("general");

  const isDark = theme==="dark";
  const dlBg   = isDark?"#1e1e1e":"#ffffff";
  const dlSb   = isDark?"#161616":"#f5f5f5";
  const dlBd   = isDark?"#333333":"#e0e0e0";
  const dlTx   = isDark?"#e8e8e8":"#1a1a1a";
  const dlMu   = isDark?"#aaaaaa":"#555555";
  const dlFa   = isDark?"#666666":"#999999";
  const dlHv   = isDark?"#2a2a2a":"#ebebeb";
  const dlAc   = isDark?"#4da6ff":"#0067c0";
  const dlRw   = isDark?"#2a2a2a":"#f8f8f8";
  const iSt    = {background:isDark?"#2a2a2a":"#ffffff",border:"1px solid "+dlBd,borderRadius:6,padding:"8px 12px",fontSize:13,color:dlTx,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"Segoe UI,sans-serif"};
  const SR     = (props) => <SettingRow {...props} dlBd={dlBd} dlTx={dlTx} dlMu={dlMu}/>;

  const NAV_ITEMS = [
    {id:"general",    icon:"⚙️",  label:"General"},
    {id:"appearance", icon:"🎨",  label:"Appearance"},
    {id:"branding",   icon:"💧",  label:"Watermark"},
    {id:"session",    icon:"🎓",  label:"Sessions"},
    {id:"feedback",   icon:"💬",  label:"Feedback"},
    {id:"backup",     icon:"💾",  label:"Backup & Restore"},
    {id:"danger",     icon:"⚠️",  label:"Danger Zone"},
  ];

  let content = null;

  if(tab==="general"){
    var g_fb = sf.facebook||"";
    var g_ig = sf.instagram||"";
    var g_yt = sf.youtube||"";
    content = (
      <div>
        <div style={{fontSize:22,fontWeight:600,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>General</div>
        <div style={{height:1,background:dlBd,marginBottom:14}}/>

        {/* Section 1: School Branding */}
        <div style={{background:isDark?"#1a2233":"#f4f8ff",border:"1px solid "+dlBd,borderRadius:8,padding:"14px 16px",marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:dlAc,marginBottom:10,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>School Branding</div>
          <div style={{display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap"}}>
            <div style={{width:90,height:90,border:"2px dashed "+dlBd,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",flexShrink:0,overflow:"hidden"}}>
              {sfLogo
                ? <img src={sfLogo} alt="Logo" style={{maxHeight:84,maxWidth:84,objectFit:"contain"}}/>
                : <span style={{fontSize:10,color:dlFa,textAlign:"center",fontFamily:"Segoe UI,sans-serif"}}>No logo</span>
              }
            </div>
            <div style={{flex:1,minWidth:160}}>
              <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",background:dlAc+"22",border:"1px solid "+dlAc,borderRadius:6,cursor:"pointer",fontSize:12,color:dlAc,fontFamily:"Segoe UI,sans-serif",fontWeight:600,marginBottom:8}}>
                Upload Logo
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" style={{display:"none"}} onChange={function(ev){
                  var fl=ev.target.files[0]; if(!fl) return;
                  if(fl.size>512000){alert("Logo must be under 500 KB.");return;}
                  var rd=new FileReader();
                  rd.onload=function(re){setSfLogo(re.target.result);};
                  rd.readAsDataURL(fl);
                }}/>
              </label>
              {sfLogo&&(
                <button onClick={function(){setSfLogo("");}} style={{background:"transparent",border:"1px solid "+dlBd,borderRadius:4,padding:"3px 10px",fontSize:11,color:"#c42b1c",cursor:"pointer",display:"block",marginBottom:8,fontFamily:"Segoe UI,sans-serif"}}>
                  Remove Logo
                </button>
              )}
              <div style={{fontSize:11,color:dlMu,marginBottom:5,fontFamily:"Segoe UI,sans-serif"}}>Alignment:</div>
              <div style={{display:"flex",border:"1px solid "+dlBd,borderRadius:5,overflow:"hidden",width:"fit-content"}}>
                <button onClick={function(){setSfLogoAlign("left");}}
                  style={{padding:"5px 12px",border:"none",borderRight:"1px solid "+dlBd,cursor:"pointer",fontSize:11,fontFamily:"Segoe UI,sans-serif",fontWeight:sfLogoAlign==="left"?700:400,background:sfLogoAlign==="left"?dlAc:"transparent",color:sfLogoAlign==="left"?"#fff":dlMu}}>
                  Split
                </button>
                <button onClick={function(){setSfLogoAlign("center");}}
                  style={{padding:"5px 12px",border:"none",cursor:"pointer",fontSize:11,fontFamily:"Segoe UI,sans-serif",fontWeight:sfLogoAlign==="center"?700:400,background:sfLogoAlign==="center"?dlAc:"transparent",color:sfLogoAlign==="center"?"#fff":dlMu}}>
                  Center
                </button>
              </div>
              <div style={{fontSize:10,color:dlFa,marginTop:5,fontFamily:"Segoe UI,sans-serif"}}>PNG, JPEG, SVG, max 500KB</div>
            </div>
          </div>
        </div>

        {/* Section 2: Basic Information */}
        <div style={{background:isDark?"#1e1e1e":"#fafafa",border:"1px solid "+dlBd,borderRadius:8,padding:"14px 16px",marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:dlAc,marginBottom:10,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>Basic Information</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <div style={{fontSize:11,color:dlMu,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>School Name</div>
              <input value={sf.name} onChange={function(ev){setSf(function(p){return Object.assign({},p,{name:ev.target.value});});}}
                placeholder="Full school name" style={{...iSt}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:dlMu,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>Academic Session</div>
              <input value={sf.sess} onChange={function(ev){setSf(function(p){return Object.assign({},p,{sess:ev.target.value});});}}
                placeholder="e.g. 2026-27" style={{...iSt}}/>
            </div>
          </div>
        </div>

        {/* Section 3: Contact Details */}
        <div style={{background:isDark?"#1e1e1e":"#fafafa",border:"1px solid "+dlBd,borderRadius:8,padding:"14px 16px",marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:dlAc,marginBottom:10,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>Contact Details</div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,color:dlMu,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>School Address</div>
            <input value={sf.addr} onChange={function(ev){setSf(function(p){return Object.assign({},p,{addr:ev.target.value});});}}
              placeholder="Street, City, State, PIN" style={{...iSt}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <div style={{fontSize:11,color:dlMu,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>Email</div>
              <input value={sf.email||""} onChange={function(ev){setSf(function(p){return Object.assign({},p,{email:ev.target.value});});}}
                placeholder="school@example.com" style={{...iSt}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:dlMu,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>Contact Number</div>
              <input value={sf.phone||""} onChange={function(ev){setSf(function(p){return Object.assign({},p,{phone:ev.target.value});});}}
                placeholder="+91 XXXXX XXXXX" style={{...iSt}}/>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,color:dlMu,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>Website</div>
            <input value={sf.website||""} onChange={function(ev){setSf(function(p){return Object.assign({},p,{website:ev.target.value});});}}
              placeholder="https://www.school.edu.in" style={{...iSt}}/>
          </div>
        </div>

        {/* Section 4: Social Media */}
        <div style={{background:isDark?"#1e1e1e":"#fafafa",border:"1px solid "+dlBd,borderRadius:8,padding:"14px 16px"}}>
          <div style={{fontSize:12,fontWeight:700,color:dlAc,marginBottom:10,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>Social Media <span style={{fontSize:10,fontWeight:400,color:dlFa,textTransform:"none"}}>(optional)</span></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div>
              <div style={{fontSize:11,color:dlMu,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>Facebook</div>
              <input value={g_fb} onChange={function(ev){setSf(function(p){return Object.assign({},p,{facebook:ev.target.value});});}}
                placeholder="https://facebook.com/page" style={{...iSt,fontSize:11}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:dlMu,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>Instagram</div>
              <input value={g_ig} onChange={function(ev){setSf(function(p){return Object.assign({},p,{instagram:ev.target.value});});}}
                placeholder="@schoolname" style={{...iSt,fontSize:11}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:dlMu,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>YouTube</div>
              <input value={g_yt} onChange={function(ev){setSf(function(p){return Object.assign({},p,{youtube:ev.target.value});});}}
                placeholder="https://youtube.com/@school" style={{...iSt,fontSize:11}}/>
            </div>
          </div>
        </div>
      </div>
    );

  } else if(tab==="appearance"){
    content = (
      <div>
        <div style={{fontSize:22,fontWeight:600,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>Appearance</div>
        <div style={{height:1,background:dlBd,marginBottom:4}}/>
        <SR label="Theme" sub="Choose light or dark interface">
          <select value={theme} onChange={e=>setTheme(e.target.value)}
            style={{...iSt,width:"auto",minWidth:130,padding:"6px 10px",cursor:"pointer"}}>
            <option value="light">☀️ Light</option>
            <option value="dark">🌙 Dark</option>
          </select>
        </SR>
        <SR label="Preview" divider={false}>
          <div style={{display:"flex",gap:10}}>
            {[{id:"light",icon:"☀️",label:"Light"},{id:"dark",icon:"🌙",label:"Dark"}].map(t=>(
              <div key={t.id} onClick={()=>setTheme(t.id)}
                style={{padding:"10px 18px",borderRadius:8,border:"2px solid "+(theme===t.id?dlAc:dlBd),cursor:"pointer",background:theme===t.id?dlAc+"22":dlRw,display:"flex",alignItems:"center",gap:8,transition:"all 0.15s"}}>
                <span style={{fontSize:18}}>{t.icon}</span>
                <span style={{fontSize:13,fontWeight:theme===t.id?700:400,color:theme===t.id?dlAc:dlTx,fontFamily:"Segoe UI,sans-serif"}}>{t.label}</span>
                {theme===t.id&&<span style={{color:dlAc,fontSize:14}}>✓</span>}
              </div>
            ))}
          </div>
        </SR>
      </div>
    );
  } else if(tab==="branding"){
    const wmInt2 = sfWm.intensity||"light";
    const intOp2 = {light:0.10,medium:0.20,strong:0.30};
    const prevOp2 = intOp2[wmInt2]||0.10;
    const actTyp2 = sfWm.activeType||"text";
    content = (
      <div>
        <div style={{fontSize:22,fontWeight:600,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>Watermark</div>
        <div style={{fontSize:12,color:dlMu,marginBottom:14,fontFamily:"Segoe UI,sans-serif"}}>Set a diagonal text or image watermark on all printed documents.</div>
        <div style={{height:1,background:dlBd,marginBottom:14}}/>

        {/* ── SECTION B: Document Watermark ── */}
        <div style={{background:isDark?"#1e1e1e":"#f8f8f8",border:"1px solid "+dlBd,borderRadius:8,padding:"16px 18px"}}>
          <div style={{fontSize:13,fontWeight:700,color:dlTx,marginBottom:4,fontFamily:"Segoe UI,sans-serif"}}>{"💧"} Section B — Document Watermark</div>
          <div style={{fontSize:12,color:dlMu,marginBottom:14,fontFamily:"Segoe UI,sans-serif"}}>Text: always -45° diagonal. Image: 0° centered, 50% page width. No rotation or size controls.</div>

          {/* Type toggle */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:dlMu,marginBottom:6,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.4}}>Watermark Type</div>
            <div style={{display:"flex",gap:0,border:"1px solid "+dlBd,borderRadius:6,overflow:"hidden",width:"fit-content"}}>
              {[{id:"text",label:"Text"},{id:"image",label:"Image"}].map(t=>(
                <button key={t.id} onClick={()=>setSfWm(p=>({...p,activeType:t.id}))}
                  style={{padding:"8px 20px",border:"none",borderRight:t.id==="text"?"1px solid "+dlBd:"none",cursor:"pointer",fontSize:13,fontFamily:"Segoe UI,sans-serif",fontWeight:600,background:actTyp2===t.id?dlAc:"transparent",color:actTyp2===t.id?"#fff":dlMu,transition:"all 0.15s"}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {/* Controls */}
            <div style={{flex:"1 1 200px"}}>
              {actTyp2==="text"&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:600,color:dlMu,marginBottom:5,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.4}}>Watermark Text</div>
                  <input value={sfWm.text||""} onChange={e=>setSfWm(p=>({...p,text:e.target.value}))}
                    placeholder="e.g. CONFIDENTIAL" style={{...iSt}}/>
                  <div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>
                    {["CONFIDENTIAL","COPY","ORIGINAL","DRAFT","VOID","SCHOOL COPY"].map(s=>(
                      <button key={s} onClick={()=>setSfWm(p=>({...p,text:s}))}
                        style={{padding:"3px 9px",borderRadius:20,border:"1px solid "+dlBd,background:sfWm.text===s?dlAc+"22":"transparent",color:sfWm.text===s?dlAc:dlMu,fontSize:10,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",fontWeight:sfWm.text===s?700:400}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {actTyp2==="image"&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:600,color:dlMu,marginBottom:5,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.4}}>Watermark Image</div>
                  <label style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",background:dlAc+"22",border:"1px dashed "+dlAc,borderRadius:6,cursor:"pointer",fontSize:12,color:dlAc,fontFamily:"Segoe UI,sans-serif",fontWeight:600,width:"fit-content"}}>
                    {"📁"} {sfWm.image?"Change Image":"Upload Image"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                      const f=e.target.files[0]; if(!f) return;
                      const r=new FileReader(); r.onload=ev=>setSfWm(p=>({...p,image:ev.target.result})); r.readAsDataURL(f);
                    }}/>
                  </label>
                  {sfWm.image&&<button onClick={()=>setSfWm(p=>({...p,image:""}))} style={{background:"transparent",border:"1px solid "+dlBd,borderRadius:4,padding:"4px 10px",fontSize:11,color:"#c42b1c",cursor:"pointer",marginTop:6,display:"block",fontFamily:"Segoe UI,sans-serif"}}>{"✕"} Remove</button>}
                  <div style={{fontSize:10,color:dlFa,marginTop:4,fontFamily:"Segoe UI,sans-serif"}}>Transparent PNG recommended. Centered 0deg, 50% page width.</div>
                </div>
              )}

              {/* Intensity */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:600,color:dlMu,marginBottom:6,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.4}}>Intensity / Opacity</div>
                <div style={{display:"flex",gap:6}}>
                  {[{id:"light",label:"Light",pct:"10%"},{id:"medium",label:"Medium",pct:"20%"},{id:"strong",label:"Strong",pct:"30%"}].map(inv=>(
                    <button key={inv.id} onClick={()=>setSfWm(p=>({...p,intensity:inv.id}))}
                      style={{flex:1,padding:"8px 6px",borderRadius:6,border:"2px solid "+(wmInt2===inv.id?dlAc:dlBd),background:wmInt2===inv.id?dlAc+"18":"transparent",color:wmInt2===inv.id?dlAc:dlMu,fontSize:12,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",fontWeight:wmInt2===inv.id?700:400,textAlign:"center"}}>
                      <div style={{fontWeight:700}}>{inv.label}</div>
                      <div style={{fontSize:10,opacity:0.7}}>{inv.pct}</div>
                    </button>
                  ))}
                </div>
              </div>

              {(sfWm.text||sfWm.image)&&(
                <button onClick={()=>setSfWm({activeType:"text",text:"",image:"",intensity:"light"})}
                  style={{background:"transparent",border:"1px solid "+dlBd,borderRadius:5,padding:"5px 12px",fontSize:11,color:"#c42b1c",cursor:"pointer",fontFamily:"Segoe UI,sans-serif",marginTop:4}}>
                  {"✕"} Clear Watermark
                </button>
              )}
            </div>

            {/* A4 preview — ratio 1:1.414 */}
            <div style={{flex:"0 0 148px"}}>
              <div style={{fontSize:11,fontWeight:600,color:dlMu,marginBottom:6,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.4}}>Live Preview</div>
              <div style={{width:148,height:210,border:"2px solid "+dlBd,borderRadius:4,background:"#fff",position:"relative",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}>
                <div style={{position:"absolute",top:8,left:8,right:8,height:2,background:"#0067c0",opacity:0.4}}/>
                {[28,44,58,72,86,100,114,128,142,156,170,184].map(y=>(
                  <div key={y} style={{position:"absolute",left:8,right:8,top:y,height:1,background:"#e8e8e8"}}/>
                ))}
                {actTyp2==="text"&&sfWm.text&&(
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%) rotate(-45deg)",opacity:prevOp2,pointerEvents:"none",fontWeight:900,fontSize:14,color:"#000",whiteSpace:"nowrap",textTransform:"uppercase",fontFamily:"Arial,sans-serif",letterSpacing:0}}>
                    {sfWm.text}
                  </div>
                )}
                {actTyp2==="image"&&sfWm.image&&(
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",opacity:prevOp2,pointerEvents:"none",width:"50%"}}>
                    <img src={sfWm.image} style={{width:"100%",height:"auto",objectFit:"contain",display:"block"}} alt=""/>
                  </div>
                )}
                {!(sfWm.text||sfWm.image)&&(
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:9,color:"#ccc",textAlign:"center",fontFamily:"Segoe UI,sans-serif"}}>No watermark</div>
                )}
                <div style={{position:"absolute",bottom:3,right:4,fontSize:7,color:"#ccc"}}>A4 preview</div>
              </div>
              <div style={{marginTop:4,fontSize:9,color:dlFa,fontFamily:"Segoe UI,sans-serif",textAlign:"center"}}>
                {actTyp2==="text"?"Text: -45deg diagonal":"Image: 0deg centered, 50% width"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  } else if(tab==="session"){
    content = (
      <SessionManagerTab
        dlBg={dlBg} dlSb={dlSb} dlBd={dlBd} dlTx={dlTx} dlMu={dlMu} dlFa={dlFa}
        dlHv={dlHv} dlAc={dlAc} dlRw={dlRw} iSt={iSt} isDark={isDark}
        allSessions={allSessions} currentSessId={currentSessId}
        sess={sess} students={students}
        promoNewSess={promoNewSess} setPromoNewSess={setPromoNewSess}
        nextSession={nextSession}
        onSwitchSession={onSwitchSession}
        onDeleteSession={onDeleteSession}
        onPromote={onPromote}
        onAddBlankSession={onAddBlankSession}
      />
    );
  } else if(tab==="feedback"){
    content = (
      <div>
        <div style={{fontSize:22,fontWeight:600,color:dlTx,fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>Feedback & Rating</div>
        <div style={{height:1,background:dlBd,marginBottom:16}}/>
        <FeedbackForm isDark={isDark} dlBg={dlBg} dlBd={dlBd} dlTx={dlTx} dlMu={dlMu} dlFa={dlFa} dlAc={dlAc} dlRw={dlRw} iSt={iSt} inline={true} onClose={null}/>
      </div>
    );

  } else if(tab==="backup"){
    content = (
      <BackupRestoreTab
        dlBg={dlBg} dlBd={dlBd} dlTx={dlTx} dlMu={dlMu} dlFa={dlFa}
        dlAc={dlAc} dlRw={dlRw} iSt={iSt} isDark={isDark}
        onBackup={onBackup} onRestore={onRestore}
        backupHistory={backupHistory}
      />
    );

  } else if(tab==="danger"){
    content = (
      <div>
        <div style={{fontSize:22,fontWeight:600,color:"#c42b1c",fontFamily:"Segoe UI,sans-serif",marginBottom:2}}>Danger Zone</div>
        <div style={{height:1,background:dlBd,marginBottom:4}}/>
        <SR label="Delete All Student Records" sub="Permanently removes ALL students and their fee records from the current session. Cannot be undone." divider={false}>
          <button onClick={onDeleteAll}
            style={{background:"#c42b1c",border:"none",borderRadius:6,padding:"9px 18px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",display:"flex",alignItems:"center",gap:6}}>
            🗑 Delete All Students
          </button>
        </SR>
      </div>
    );
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:dlBg,borderRadius:12,width:"min(780px,95vw)",height:"min(580px,90vh)",display:"flex",overflow:"hidden",boxShadow:"0 32px 64px rgba(0,0,0,0.4)",border:"1px solid "+dlBd}}>

        {/* Left sidebar */}
        <div style={{width:210,background:dlSb,borderRight:"1px solid "+dlBd,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"16px 16px 8px",display:"flex",alignItems:"center",gap:10}}>
            <button onClick={onClose}
              style={{width:28,height:28,borderRadius:6,background:isDark?"#3a3a3a":"#e0e0e0",border:"none",cursor:"pointer",color:dlTx,fontSize:14,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              ✕
            </button>
            <span style={{fontSize:14,fontWeight:600,color:dlTx,fontFamily:"Segoe UI,sans-serif"}}>Settings</span>
          </div>
          <div style={{flex:1,padding:"4px 8px",overflowY:"auto"}}>
            {NAV_ITEMS.map(n=>(
              <div key={n.id} onClick={()=>setTab(n.id)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:7,cursor:"pointer",marginBottom:2,background:tab===n.id?(isDark?"#3a3a3a":"#e0e8f5"):"transparent",color:tab===n.id?dlAc:dlMu,transition:"all 0.12s",fontFamily:"Segoe UI,sans-serif",fontSize:13,fontWeight:tab===n.id?600:400}}
                onMouseEnter={e=>{if(tab!==n.id)e.currentTarget.style.background=dlHv;}}
                onMouseLeave={e=>{if(tab!==n.id)e.currentTarget.style.background="transparent";}}>
                <span style={{fontSize:15,flexShrink:0}}>{n.icon}</span>
                <span>{n.label}</span>
              </div>
            ))}
          </div>
          <div style={{padding:"12px",borderTop:"1px solid "+dlBd}}>
            <button onClick={onSave}
              style={{width:"100%",background:dlAc,border:"none",borderRadius:7,padding:"9px 0",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Segoe UI,sans-serif"}}>
              ✓ Save Changes
            </button>
          </div>
        </div>

        {/* Right content */}
        <div style={{flex:1,padding:"24px 28px",overflowY:"auto",background:dlBg}}>
          {content}
        </div>
      </div>
    </div>
  );
}

function SessionPromotion({students,classes,currentSess,newSess,onConfirm,onClose,fees}){
  // ── Helpers ──────────────────────────────────────────────────────────────
  const nextOf = cls => {
    const i = classes.indexOf(cls);
    if(i===-1||i===classes.length-1) return "__PASSOUT__"; // graduated / passed out
    return classes[i+1];
  };
  const isLastClass = cls => classes.indexOf(cls)===classes.length-1;

  // fee arrears: unpaid balance from current session
  const arrearOf = sid => {
    const f = fees?.[sid]; if(!f) return 0;
    const paid=(f.pay||[]).reduce((a,p)=>a+Number(p.amt),0);
    return Math.max(0,(f.total||0)-paid);
  };

  // ── Draft state ──────────────────────────────────────────────────────────
  // action: "promote" | "repeat" | "passout" | "remove"
  const [draft,setDraft] = useState(()=>
    students.map(s=>{
      const nxt = nextOf(s.cls);
      const last = isLastClass(s.cls);
      return {
        ...s,
        oldCls: s.cls,
        newCls: last ? s.cls : nxt,
        action: last ? "passout" : "promote",
        arrear: arrearOf(s.id),
        carryFee: arrearOf(s.id)>0, // carry forward arrear by default
      };
    })
  );

  const [filterCls,setFilterCls]   = useState("All");
  const [filterAct,setFilterAct]   = useState("All");
  const [q,setQ]                   = useState("");
  const [tab,setTab]               = useState("review"); // review | summary

  const visible = useMemo(()=>
    draft.filter(s=>
      (filterCls==="All"||s.oldCls===filterCls)&&
      (filterAct==="All"||s.action===filterAct)&&
      s.name.toLowerCase().includes(q.toLowerCase())
    )
  ,[draft,filterCls,filterAct,q]);

  // ── Actions ───────────────────────────────────────────────────────────────
  function setAction(id,action){
    setDraft(p=>p.map(s=>{
      if(s.id!==id) return s;
      const nxt=nextOf(s.cls);
      const newCls = action==="promote"?(isLastClass(s.cls)?s.cls:nxt)
                   : action==="repeat" ? s.cls
                   : action==="passout"? s.cls
                   : s.cls; // remove
      return {...s,action,newCls};
    }));
  }
  function setNewCls(id,val){
    setDraft(p=>p.map(s=>s.id===id?{...s,newCls:val}:s));
  }
  function toggleCarry(id){
    setDraft(p=>p.map(s=>s.id===id?{...s,carryFee:!s.carryFee}:s));
  }
  function bulkAction(cls,action){
    setDraft(p=>p.map(s=>{
      if(s.oldCls!==cls) return s;
      const nxt=nextOf(s.cls);
      const newCls=action==="promote"?(isLastClass(s.cls)?s.cls:nxt):s.cls;
      return {...s,action,newCls};
    }));
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const promoted   = draft.filter(s=>s.action==="promote").length;
  const repeating  = draft.filter(s=>s.action==="repeat").length;
  const passedOut  = draft.filter(s=>s.action==="passout").length;
  const removed    = draft.filter(s=>s.action==="remove").length;
  const continuing = draft.filter(s=>s.action!=="remove").length;
  const totalArrear= draft.filter(s=>s.action!=="remove").reduce((a,s)=>a+s.arrear,0);
  const carriedArrear=draft.filter(s=>s.action!=="remove"&&s.carryFee).reduce((a,s)=>a+s.arrear,0);

  // ── Confirm ───────────────────────────────────────────────────────────────
  function confirm(){
    if(continuing===0){alert("No students are set to continue. Please keep at least one student.");return;}
    // Build new student list (exclude "remove" action)
    const updated = draft
      .filter(s=>s.action!=="remove")
      .map(s=>{
        const {oldCls,newCls,action,arrear,carryFee,...rest}=s;
        // Assign new serial within their new class
        return {
          ...rest,
          cls: newCls==="__PASSOUT__"?oldCls:newCls,
          sess: newSess,
          typ: "old",
          roll: rest.roll, // re-assigned below
          arrearCarried: (carryFee&&arrear>0)?arrear:0, // carry fee flag
        };
      });
    // Re-assign serial numbers class-wise
    const classCounts={};
    updated.forEach(s=>{
      classCounts[s.cls]=(classCounts[s.cls]||0)+1;
      s.roll=String(classCounts[s.cls]);
    });
    onConfirm(updated, newSess, draft);
  }

  // ── Action badge colors ───────────────────────────────────────────────────
  const actionStyle = a=>({
    promote: {bg:W.okb,c:W.ok,label:"↑ Promote"},
    repeat:  {bg:W.wnb,c:W.wn,label:"↻ Repeat"},
    passout: {bg:W.pub,c:W.pu,label:"🎓 Pass Out"},
    remove:  {bg:W.erb,c:W.er,label:"✗ Remove"},
  }[a]||{bg:W.th,c:W.mu,label:a});

  const ACTIONS=[
    {id:"promote",label:"↑ Promote",  title:"Move to next class"},
    {id:"repeat", label:"↻ Repeat",   title:"Stay in same class"},
    {id:"passout",label:"🎓 Pass Out", title:"Graduated / final class"},
    {id:"remove", label:"✗ Remove",   title:"Not continuing"},
  ];

  return (
    <Modal title={"Promote Session: "+currentSess+" → "+newSess} icon="🎓" onClose={onClose} w={900}>

      {/* Summary tiles */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:12}}>
        {[
          {l:"Continuing",v:continuing,c:W.ac},
          {l:"↑ Promoted",v:promoted,c:W.ok},
          {l:"↻ Repeating",v:repeating,c:W.wn},
          {l:"🎓 Passed Out",v:passedOut,c:W.pu},
          {l:"✗ Removed",v:removed,c:W.er},
        ].map(x=>(
          <div key={x.l} style={{background:W.sf,border:"1px solid "+W.bd,borderLeft:"3px solid "+x.c,borderRadius:4,padding:"8px 10px"}}>
            <div style={{fontSize:18,fontWeight:700,color:x.c,fontFamily:"Segoe UI,sans-serif"}}>{x.v}</div>
            <div style={{fontSize:10,color:W.mu,fontFamily:"Segoe UI,sans-serif",marginTop:1}}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* Fee arrear warning */}
      {totalArrear>0&&(
        <div style={{background:W.wnb,border:"1px solid "+W.wn,borderRadius:5,padding:"8px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:8,fontSize:12,color:W.wn,fontFamily:"Segoe UI,sans-serif"}}>
          <span style={{fontSize:16}}>💰</span>
          <div>
            <b>Fee Arrears Detected:</b> Rs.{totalArrear.toLocaleString()} unpaid from {currentSess}.
            Rs.{carriedArrear.toLocaleString()} will be carried forward to {newSess}.
            Use ✓ Carry checkbox per student to control this.
          </div>
        </div>
      )}

      {/* Bulk quick actions per class */}
      <div style={{background:W.acl,border:"1px solid "+W.acl,borderRadius:4,padding:"8px 12px",marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:600,color:W.ac,marginBottom:6,fontFamily:"Segoe UI,sans-serif",textTransform:"uppercase",letterSpacing:0.4}}>Bulk Actions by Class</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {classes.map(c=>{
            const cnt=draft.filter(s=>s.oldCls===c).length;
            if(!cnt) return null;
            const last=isLastClass(c);
            return(
              <div key={c} style={{display:"flex",alignItems:"center",gap:4,background:W.sf,border:"1px solid "+W.bd,borderRadius:4,padding:"4px 8px"}}>
                <span style={{fontSize:12,fontWeight:600,color:W.ac,fontFamily:"Segoe UI,sans-serif"}}>{c} ({cnt})</span>
                <span style={{fontSize:10,color:W.fa}}>→</span>
                {!last&&<button onClick={()=>bulkAction(c,"promote")} style={{padding:"2px 7px",borderRadius:3,border:"1px solid "+W.ok,background:W.okb,color:W.ok,fontSize:10,cursor:"pointer",fontWeight:600}}>↑ Promote All</button>}
                <button onClick={()=>bulkAction(c,"repeat")} style={{padding:"2px 7px",borderRadius:3,border:"1px solid "+W.wn,background:W.wnb,color:W.wn,fontSize:10,cursor:"pointer",fontWeight:600}}>↻ Repeat All</button>
                {last&&<button onClick={()=>bulkAction(c,"passout")} style={{padding:"2px 7px",borderRadius:3,border:"1px solid "+W.pu,background:W.pub,color:W.pu,fontSize:10,cursor:"pointer",fontWeight:600}}>🎓 Pass Out All</button>}
                <button onClick={()=>bulkAction(c,"remove")} style={{padding:"2px 7px",borderRadius:3,border:"1px solid "+W.er,background:W.erb,color:W.er,fontSize:10,cursor:"pointer",fontWeight:600}}>✗ Remove All</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
        <WS value={filterCls} onChange={e=>setFilterCls(e.target.value)} style={{width:110,fontSize:12}}>
          <option value="All">All Classes</option>
          {classes.map(c=><option key={c}>{c}</option>)}
        </WS>
        <WS value={filterAct} onChange={e=>setFilterAct(e.target.value)} style={{width:130,fontSize:12}}>
          <option value="All">All Actions</option>
          {ACTIONS.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
        </WS>
        <div style={{position:"relative",flex:1,minWidth:160}}>
          <span style={{position:"absolute",left:7,top:"50%",transform:"translateY(-50%)",fontSize:12,color:W.fa}}>🔍</span>
          <WI placeholder="Search student…" value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:26,fontSize:12}}/>
        </div>
        <span style={{fontSize:11,color:W.fa}}>{visible.length} shown</span>
      </div>

      {/* Student table */}
      <div style={{border:"1px solid "+W.bd,borderRadius:4,overflow:"auto",maxHeight:"36vh"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:680}}>
          <thead>
            <tr style={{background:"#1a56a0"}}>
              {["Student","Current Class","Action","New Class","Fee Arrear","✓ Carry Forward","Status"].map(h=>(
                <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:11,color:"#fff",borderBottom:"1px solid "+W.bd,fontWeight:600,fontFamily:"Segoe UI,sans-serif",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length===0&&(
              <tr><td colSpan={7} style={{padding:24,textAlign:"center",color:W.fa,fontSize:13}}>No students match the filter.</td></tr>
            )}
            {visible.map((s,i)=>{
              const ast=actionStyle(s.action);
              const isRemoved=s.action==="remove";
              const isPassout=s.action==="passout";
              return(
                <tr key={s.id} style={{background:isRemoved?W.erb:i%2===1?W.ta:W.sf,opacity:isRemoved?0.6:1}}>
                  <td style={{padding:"5px 10px",borderBottom:"1px solid "+W.bd}}>
                    <div style={{fontWeight:600,fontSize:13,color:isRemoved?W.fa:W.tx,fontFamily:"Segoe UI,sans-serif"}}>{s.name}</div>
                    <div style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>S.No {s.roll} · {s.dad}</div>
                  </td>
                  <td style={{padding:"5px 10px",borderBottom:"1px solid "+W.bd}}>
                    <Tag t="blue">{s.oldCls}</Tag>
                  </td>
                  <td style={{padding:"5px 8px",borderBottom:"1px solid "+W.bd}}>
                    <WS value={s.action} onChange={e=>setAction(s.id,e.target.value)}
                      style={{fontSize:11,padding:"3px 4px",width:110,border:"1px solid "+ast.c,color:ast.c,background:ast.bg,fontWeight:600}}>
                      {ACTIONS.map(a=>{
                        if(a.id==="promote"&&isLastClass(s.oldCls)) return null;
                        return <option key={a.id} value={a.id}>{a.label}</option>;
                      })}
                    </WS>
                  </td>
                  <td style={{padding:"5px 8px",borderBottom:"1px solid "+W.bd}}>
                    {(!isRemoved&&!isPassout)?(
                      <WS value={s.newCls} onChange={e=>setNewCls(s.id,e.target.value)}
                        style={{width:85,fontSize:11,padding:"3px 4px"}}>
                        {classes.map(c=><option key={c}>{c}</option>)}
                      </WS>
                    ):(
                      <span style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{isPassout?"Graduated":"—"}</span>
                    )}
                  </td>
                  <td style={{padding:"5px 10px",borderBottom:"1px solid "+W.bd,textAlign:"right"}}>
                    {s.arrear>0
                      ?<span style={{fontWeight:700,color:W.er,fontSize:12}}>Rs.{s.arrear.toLocaleString()}</span>
                      :<span style={{color:W.ok,fontSize:12,fontWeight:600}}>✓ Paid</span>
                    }
                  </td>
                  <td style={{padding:"5px 10px",borderBottom:"1px solid "+W.bd,textAlign:"center"}}>
                    {s.arrear>0&&!isRemoved?(
                      <input type="checkbox" checked={s.carryFee} onChange={()=>toggleCarry(s.id)}
                        title={s.carryFee?"Arrear will carry to new session":"Arrear will be written off"}
                        style={{width:15,height:15,cursor:"pointer",accentColor:W.wn}}/>
                    ):<span style={{fontSize:10,color:W.fa}}>—</span>}
                  </td>
                  <td style={{padding:"5px 10px",borderBottom:"1px solid "+W.bd}}>
                    <span style={{background:ast.bg,color:ast.c,padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,fontFamily:"Segoe UI,sans-serif"}}>{ast.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info bar */}
      <div style={{marginTop:8,background:W.wnb,border:"1px solid "+W.wn,borderRadius:4,padding:"7px 12px",fontSize:12,color:W.wn,fontFamily:"Segoe UI,sans-serif"}}>
        ⚠ <b>Promote</b> = moves to next class &nbsp;·&nbsp; <b>Repeat</b> = stays in same class &nbsp;·&nbsp; <b>Pass Out</b> = graduated from last class &nbsp;·&nbsp; <b>Remove</b> = not continuing. Serial numbers auto-reassigned in new session.
      </div>

      {/* Footer */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:12,borderTop:"1px solid "+W.bd,paddingTop:12}}>
        <div style={{fontSize:12,color:W.mu,fontFamily:"Segoe UI,sans-serif",lineHeight:1.6}}>
          <div>{continuing} continuing · {removed} removed</div>
          {totalArrear>0&&<div style={{color:W.wn}}>💰 Rs.{carriedArrear.toLocaleString()} fee arrear will carry forward</div>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <WB onClick={onClose}>Cancel</WB>
          <WB v="p" onClick={confirm}>🎓 Confirm &amp; Start {newSess}</WB>
        </div>
      </div>
    </Modal>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App(){
  const [theme,setTheme]       = useState("light");
  // Auto-show feedback popup after 3+ days
  useEffect(()=>{
    const installed = localStorage.getItem("sms_install_date");
    if(!installed) localStorage.setItem("sms_install_date", Date.now());
    const days = (Date.now() - Number(localStorage.getItem("sms_install_date")||Date.now())) / 86400000;
    const lastShown = localStorage.getItem("sms_feedback_shown");
    const shownDaysAgo = lastShown ? (Date.now()-Number(lastShown))/86400000 : 999;
    if(days >= 3 && shownDaysAgo > 30){
      setTimeout(()=>setShowFeedback(true), 8000); // show after 8s
    }
  },[]);
  const [logo,setLogo]           = useState(""); // base64 data URL (artifact) / file path (Electron)
  const [logoAlign,setLogoAlign] = useState("left");  // "left" = split letterhead | "center" = stacked
  const [watermark,setWatermark] = useState({activeType:"text",text:"",image:"",intensity:"light"});
  // Mutate the module-level W so all components re-read it on each render
  Object.assign(W, THEMES[theme]);
  const [page,setPage]         = useState("dashboard");
  // ── Multi-session data store ───────────────────────────────────────────────
  const initSession = {id:"sess_1",name:"2026-27",students:S0,fees:F0,marks:{}};
  const [allSessions,setAllSessions] = useState([initSession]);
  const [currentSessId,setCurrentSessId] = useState("sess_1");

  const currentSession = allSessions.find(s=>s.id===currentSessId)||allSessions[0];
  const students  = currentSession.students;
  // A session is archived (read-only) if it is NOT the most recently created session
  // and NOT the one with the latest name (year)
  const latestSessId = allSessions.reduce((best,s)=>
    (s.name||"") > ((allSessions.find(x=>x.id===best)||allSessions[0])?.name||"") ? s.id : best
  , allSessions[0]?.id);
  const isArchived = currentSessId !== latestSessId;
  const fees      = currentSession.fees;
  const sess      = currentSession.name;

  function setStudents(fn){
    setAllSessions(prev=>prev.map(s=>s.id===currentSessId?{...s,students:typeof fn==="function"?fn(s.students):fn}:s));
  }
  function setFees(fn){
    setAllSessions(prev=>prev.map(s=>s.id===currentSessId?{...s,fees:typeof fn==="function"?fn(s.fees):fn}:s));
  }
  function setMarks(fn){
    setAllSessions(prev=>prev.map(s=>s.id===currentSessId?{...s,marks:typeof fn==="function"?fn(s.marks||{}):fn}:s));
  }

  const [school,setSchool]           = useState("Vidya Global Academy");
  const [schoolAddr,setSchoolAddr]   = useState("123 School Road, City, State");
  const [schoolEmail,setSchoolEmail] = useState("");
  const [schoolPhone,setSchoolPhone] = useState("");
  const [schoolWebsite,setSchoolWebsite] = useState("");
  const [socialLinks,setSocialLinks] = useState({facebook:"",instagram:"",youtube:""});
  const [showSet,setShowSet]         = useState(false);
  const [showFeedback,setShowFeedback] = useState(false);
  const [feedbackDone,setFeedbackDone] = useState(false);
  const [backupHistory,setBackupHistory] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem("sms_backup_history")||"[]"); }catch(e){ return []; }
  });
  const [sf,setSf]                 = useState({name:"Vidya Global Academy",sess:"2026-27",addr:"123 School Road, City, State",email:"",phone:"",website:"",facebook:"",instagram:"",youtube:""});
  const [sfLogo,setSfLogo]         = useState("");
  const [sfLogoAlign,setSfLogoAlign] = useState("left");
  const [sfWm,setSfWm]             = useState({activeType:"text",text:"",image:"",intensity:"light"});
  const [classes,setClasses]       = useState(DEFAULT_CLASSES);
  const [subjects,setSubjects]     = useState(DEFAULT_SUBJECTS);
  const [showCM,setShowCM]         = useState(false);
  const [showPromo,setShowPromo]   = useState(false);
  const [promoNewSess,setPromoNewSess] = useState("");
  const [cols,setCols]             = useState(DEFAULT_COLS.map(c=>({...c})));
  const [staff,setStaff]           = useState([]); // staff members
  const [staffAccounts,setStaffAccounts] = useState([]); // login accounts
  // attendance: { "YYYY-MM-DD_classId": { studentId: "P"|"A"|"L"|"H" } }
  const [attendance,setAttendance] = useState({});

  function handleClassSave(newCls,newSubs){
    setClasses(newCls);
    setSubjects(newSubs);
    setShowCM(false);
  }

  // ── Backup: export all app state as .bak file ──
  function doBackup(note){
    const APP_VERSION = "1.0.0";
    const ts = new Date().toISOString();
    const payload = {
      meta:{ version:APP_VERSION, createdAt:ts, school, sess, note:note||"", recordCount:{
        students: allSessions.reduce((a,s)=>a+s.students.length,0),
        staff: staff.length, sessions: allSessions.length,
      }},
      data:{ allSessions, currentSessId, classes, subjects, cols,
             staff, staffAccounts, attendance, logo, logoAlign,
             watermark, school, schoolAddr, theme,
      }
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json],{type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const fname= "SchoolERP_"+school.replace(/\s+/g,"_")+"_"+ts.slice(0,10)+".bak";
    const a = document.createElement("a");
    a.href=url; a.download=fname; a.style.display="none";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),5000);

    // Save to history
    const entry = {id:Date.now(), ts, fname, note:note||"", size:Math.round(json.length/1024),
      students:payload.meta.recordCount.students, sessions:allSessions.length, type:"manual"};
    const newHist = [entry,...backupHistory].slice(0,20);
    setBackupHistory(newHist);
    localStorage.setItem("sms_backup_history", JSON.stringify(newHist));
    return entry;
  }

  // ── Restore: import .bak file and restore all state ──
  function doRestore(file, onProgress, onDone, onError){
    const reader = new FileReader();
    reader.onload = ev => {
      try{
        onProgress&&onProgress(20,"Reading backup file…");
        const raw = JSON.parse(ev.target.result);

        // Validate structure
        onProgress&&onProgress(35,"Validating backup…");
        if(!raw.meta||!raw.data){throw new Error("Invalid backup file: missing metadata or data.");}
        if(!raw.meta.version){throw new Error("Backup file has no version info.");}

        const [major] = (raw.meta.version||"0").split(".").map(Number);
        const [curMajor] = "1.0.0".split(".").map(Number);
        if(major > curMajor){throw new Error("Backup is from a newer version ("+raw.meta.version+"). Please update the app first.");}

        // Pre-restore safety: save current state to localStorage
        onProgress&&onProgress(50,"Creating safety snapshot…");
        const safetySnap = {allSessions,currentSessId,classes,subjects,cols,staff,staffAccounts,attendance,logo,logoAlign,watermark,school,schoolAddr};
        localStorage.setItem("sms_safety_restore_snap", JSON.stringify(safetySnap));

        // Restore all state
        onProgress&&onProgress(70,"Restoring data…");
        const d = raw.data;
        if(d.allSessions)   setAllSessions(d.allSessions);
        if(d.currentSessId) setCurrentSessId(d.currentSessId);
        if(d.classes)       setClasses(d.classes);
        if(d.subjects)      setSubjects(d.subjects);
        if(d.cols)          setCols(d.cols);
        if(d.staff)         setStaff(d.staff);
        if(d.staffAccounts) setStaffAccounts(d.staffAccounts);
        if(d.attendance)    setAttendance(d.attendance);
        if(d.logo!==undefined)      setLogo(d.logo);
        if(d.logoAlign)     setLogoAlign(d.logoAlign);
        if(d.watermark)     setWatermark(d.watermark);
        if(d.school)        setSchool(d.school);
        if(d.schoolAddr)    setSchoolAddr(d.schoolAddr);
        if(d.theme)         setTheme(d.theme);

        // Log restore event
        onProgress&&onProgress(95,"Finalising…");
        const entry = {id:Date.now(), ts:new Date().toISOString(), fname:file.name,
          note:"Restore from backup", size:Math.round(ev.target.result.length/1024),
          students:d.allSessions?d.allSessions.reduce((a,s)=>a+s.students.length,0):0,
          sessions:d.allSessions?.length||0, type:"restore", fromVersion:raw.meta.version};
        const newHist = [entry,...backupHistory].slice(0,20);
        setBackupHistory(newHist);
        localStorage.setItem("sms_backup_history", JSON.stringify(newHist));
        localStorage.removeItem("sms_safety_restore_snap");

        onProgress&&onProgress(100,"Done!");
        onDone&&onDone(raw.meta);
      } catch(err){
        // Auto rollback from safety snapshot
        try{
          const snap = JSON.parse(localStorage.getItem("sms_safety_restore_snap")||"null");
          if(snap){
            if(snap.allSessions) setAllSessions(snap.allSessions);
            if(snap.classes)     setClasses(snap.classes);
            localStorage.removeItem("sms_safety_restore_snap");
          }
        }catch(_){}
        onError&&onError(err.message||"Restore failed.");
      }
    };
    reader.onerror = ()=> onError&&onError("Could not read the file.");
    reader.readAsText(file);
  }

  function nextSession(s){
    const parts=s.split("-");
    if(parts.length===2){
      const y=parseInt(parts[0]);
      if(!isNaN(y)){const y2=y+1;return y2+"-"+String(y2+1).slice(-2);}
    }
    return s+" (next)";
  }

  // On promotion confirm: archive current, create new session with promoted students
  function handlePromoConfirm(updatedStudents, newSessName, originalDraft){
    const newName = (newSessName||promoNewSess||nextSession(sess)).trim();
    if(!newName){alert("Session name is missing. Please try again.");return;}
    const newId = "sess_"+Date.now();

    // Build fee records: carry arrears forward if student opted in
    const newFees = {};
    updatedStudents.forEach(s=>{
      const arrear = s.arrearCarried||0;
      newFees[s.id] = {
        total: arrear,           // arrear becomes the opening balance
        pay: arrear>0?[{
          dt: new Date().toISOString().split("T")[0],
          amt: 0,
          mo: "Opening",
          by: "Carried Forward",
          note: "Fee arrear from "+sess,
        }]:[],
        arrearFrom: arrear>0?sess:null,
      };
    });

    // Clean up arrearCarried from student objects
    const cleanStudents = updatedStudents.map(({arrearCarried,...s})=>s);

    const newSessObj = {
      id: newId,
      name: newName,
      students: cleanStudents,
      fees: newFees,
      marks: {},
    };
    setAllSessions(prev=>[...prev, newSessObj]);
    setCurrentSessId(newId);
    setPromoNewSess("");
    setShowPromo(false);
    setShowSet(false);
  }

  function switchSession(id){
    setCurrentSessId(id);
  }

  // Create a blank new session (or copy from src)
  function addBlankSession(name, src){
    const newId = "sess_"+Date.now();
    let newStudents = [];
    let newFees = {};

    if(src){
      // COPY session: deep-copy students + fees from source, reset transactional data
      // Configuration (classes, subjects, staff, cols, settings) is SHARED across sessions
      // Only student RECORDS and FEE TRANSACTIONS are session-scoped
      newStudents = src.students.map(s=>({
        ...s,
        id: Date.now()+(Math.random()*10000|0),
        sess: name,
        typ: "old",
      }));
      newStudents.forEach(s=>{
        newFees[s.id] = {total:0, pay:[], copiedFrom:src.name};
      });
    }
    // BLANK session: no students, no fees — but all config (classes, subjects, staff,
    // cols, settings, logo, watermark) is preserved because those live in App state,
    // NOT inside any session object. The session only holds: students, fees, marks.
    const newSessObj = {
      id: newId,
      name,
      students: newStudents,
      fees: newFees,
      marks: {},
      createdAt: new Date().toISOString(),
      type: src ? "copy" : "blank",
    };
    setAllSessions(prev=>[...prev, newSessObj]);
    setCurrentSessId(newId);
    setShowSet(false);
  }

  const NAV=[{id:"dashboard",icon:"🏠",label:"Dashboard"},{id:"admission",icon:"👤",label:"Admission"},{id:"fee",icon:"💳",label:"Fee Management"},{id:"result",icon:"📋",label:"Result Record"},{id:"attendance",icon:"📅",label:"Attendance"},{id:"staff",icon:"👨‍💼",label:"Staff"}];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:W.accentWin,fontFamily:"Segoe UI,sans-serif",overflow:"hidden"}}>

      {/* Title Bar */}
      <div style={{background:W.tb,height:32,display:"flex",alignItems:"center",justifyContent:"space-between",paddingLeft:12,flexShrink:0,userSelect:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>🏫</span>
          <span style={{fontSize:12,color:"#d0d0d0",fontFamily:"Segoe UI,sans-serif"}}>School Management System — {school}</span>
        </div>
        <div style={{display:"flex",height:"100%"}}>
          {[{l:"—",h:"#3a3a3a"},{l:"□",h:"#3a3a3a"},{l:"✕",h:W.er}].map(({l,h},i)=>(
            <button key={i} onMouseEnter={e=>e.currentTarget.style.background=h} onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              style={{background:"transparent",border:"none",color:"#d0d0d0",width:46,height:"100%",cursor:"pointer",fontSize:13,fontFamily:"Segoe UI,sans-serif",transition:"background 0.1s"}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden",background:W.bg}}>

        {/* Sidebar */}
        <div style={{width:196,background:W.sb,borderRight:"1px solid "+W.sbb,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"13px 14px 10px",borderBottom:"1px solid "+W.sbb}}>
            {logo&&<img src={logo} alt="Logo" style={{height:52,maxHeight:52,width:"auto",objectFit:"contain",display:"block",marginBottom:6,borderRadius:3}}/>}
            <div style={{fontSize:13,fontWeight:700,color:W.tx,fontFamily:"Segoe UI,sans-serif"}}>{school}</div>
            <div style={{fontSize:11,color:W.fa,marginTop:1,fontFamily:"Segoe UI,sans-serif"}}>Session {sess}</div>
          </div>
          <div style={{padding:"6px 6px",flex:1}}>
            {NAV.map(n=>(
              <div key={n.id} onClick={()=>setPage(n.id)}
                onMouseEnter={e=>{if(page!==n.id)e.currentTarget.style.background=W.hv;}}
                onMouseLeave={e=>{if(page!==n.id)e.currentTarget.style.background="transparent";}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:4,cursor:"pointer",marginBottom:2,background:page===n.id?W.acl:"transparent",color:page===n.id?W.ac:W.mu,borderLeft:page===n.id?"3px solid "+W.ac:"3px solid transparent",fontSize:13,fontWeight:page===n.id?600:400,transition:"all 0.1s",fontFamily:"Segoe UI,sans-serif"}}>
                <span style={{fontSize:15,flexShrink:0}}>{n.icon}</span>
                <span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{n.label}</span>
              </div>
            ))}
          </div>
          <div style={{borderTop:"1px solid "+W.sbb,padding:"6px 6px"}}>
            <div onClick={()=>{setSf({name:school,sess,addr:schoolAddr,email:schoolEmail,phone:schoolPhone,website:schoolWebsite,facebook:socialLinks.facebook,instagram:socialLinks.instagram,youtube:socialLinks.youtube});setSfLogo(logo);setSfLogoAlign(logoAlign);setSfWm({...watermark});setShowSet(true);}}
              onMouseEnter={e=>e.currentTarget.style.background=W.hv} onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:4,cursor:"pointer",fontSize:13,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>
              <span style={{fontSize:15}}>⚙️</span> Settings
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {/* Tab bar */}
          <div style={{background:W.sf,borderBottom:"1px solid "+W.sbb,padding:"0 14px",display:"flex",alignItems:"flex-end",height:34,flexShrink:0}}>
            <div style={{background:isArchived?"#fef9c3":W.acl,border:"1px solid "+(isArchived?"#f59e0b":W.acl),borderBottom:"none",padding:"5px 16px 4px",borderRadius:"4px 4px 0 0",fontSize:12,color:isArchived?"#92400e":W.ac,fontWeight:600,fontFamily:"Segoe UI,sans-serif",marginTop:6}}>
              {isArchived?"🔒":""}{NAV.find(n=>n.id===page)?.icon} {NAV.find(n=>n.id===page)?.label}
              {isArchived&&<span style={{fontSize:10,marginLeft:6,opacity:0.7}}>READ ONLY</span>}
            </div>
            <div style={{marginLeft:"auto",paddingBottom:4,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:12,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{students.length} students</span>
              <div style={{display:"flex",alignItems:"center",gap:5,paddingLeft:8,borderLeft:"1px solid "+W.bd}}>
                <span style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>📅</span>
                <select value={currentSessId} onChange={e=>switchSession(e.target.value)}
                  style={{background:W.sf,border:"1px solid "+W.bd,borderRadius:4,padding:"1px 5px",fontSize:11,color:W.tx,fontWeight:600,cursor:"pointer",fontFamily:"Segoe UI,sans-serif",outline:"none",maxWidth:100}}>
                  {allSessions.map(s=>(
                    <option key={s.id} value={s.id}>{s.name}{s.id===currentSessId?" ✓":""}</option>
                  ))}
                </select>
              </div>
              <Clock/>
            </div>
          </div>
          {/* Page content */}
          <div style={{flex:1,overflowY:"auto",background:W.bg}}>
            {page==="dashboard"&&<Dashboard students={students} fees={fees} session={sess} school={school} classes={classes}/>}
            {page==="admission"&&<Admission students={students} setStudents={setStudents} fees={fees} setFees={setFees} classes={classes} subjects={subjects} onManageClasses={()=>setShowCM(true)} school={school} sess={sess} schoolAddr={schoolAddr} cols={cols} setCols={setCols} logo={logo} logoAlign={logoAlign} watermark={watermark} schoolEmail={schoolEmail} schoolPhone={schoolPhone} schoolWebsite={schoolWebsite} isArchived={isArchived}/>}
            {page==="fee"&&<FeeManagement students={students} fees={fees} setFees={setFees} classes={classes} school={school} sess={sess} schoolAddr={schoolAddr} logo={logo} logoAlign={logoAlign} watermark={watermark} schoolEmail={schoolEmail} schoolPhone={schoolPhone} schoolWebsite={schoolWebsite} isArchived={isArchived}/>}
            {page==="result"&&<ResultRecord students={students} classes={classes} subjects={subjects} school={school} sess={sess} schoolAddr={schoolAddr} logo={logo} logoAlign={logoAlign} watermark={watermark} schoolEmail={schoolEmail} schoolPhone={schoolPhone} schoolWebsite={schoolWebsite} sessMarks={currentSession.marks||{}} setSessMarks={setMarks} isArchived={isArchived}/>}
            {page==="attendance"&&<Attendance students={students} classes={classes} school={school} sess={sess} schoolAddr={schoolAddr} logo={logo} logoAlign={logoAlign} watermark={watermark} schoolEmail={schoolEmail} schoolPhone={schoolPhone} schoolWebsite={schoolWebsite} attendance={attendance} setAttendance={setAttendance} isArchived={isArchived}/>}
            {page==="staff"&&<StaffModule staff={staff} setStaff={setStaff} staffAccounts={staffAccounts} setStaffAccounts={setStaffAccounts} classes={classes} school={school}/>}
          </div>

          {/* Status Bar */}
          <div style={{background:W.stb,borderTop:"1px solid "+W.sbb,padding:"2px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",height:22,flexShrink:0}}>
            <div style={{display:"flex",gap:16}}>
              <span style={{fontSize:11,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>Students: {students.length}</span>
              <span style={{fontSize:11,color:W.mu,fontFamily:"Segoe UI,sans-serif"}}>Classes: {classes.filter(c=>students.some(s=>s.cls===c)).length} active / {classes.length} total</span>
              <span style={{fontSize:11,color:W.ac,fontWeight:600,fontFamily:"Segoe UI,sans-serif"}}>📅 {sess}</span>
              {allSessions.length>1&&<span style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>{allSessions.length} sessions total</span>}
            </div>
            <span style={{fontSize:11,color:W.fa,fontFamily:"Segoe UI,sans-serif"}}>School Management System v2.0</span>
          </div>
        </div>
      </div>

      {/* Class Manager */}
      {showCM&&(
        <ClassManager
          classes={classes}
          subjects={subjects}
          students={students}
          onSave={handleClassSave}
          onClose={()=>setShowCM(false)}
        />
      )}

      {/* Settings Dialog — sidebar nav style */}
      {showSet&&<SettingsDialog
        W={W} theme={theme} setTheme={setTheme}
        sf={sf} setSf={setSf}
        sfLogo={sfLogo} setSfLogo={setSfLogo}
        sfLogoAlign={sfLogoAlign} setSfLogoAlign={setSfLogoAlign}
        sfWm={sfWm} setSfWm={setSfWm}
        promoNewSess={promoNewSess} setPromoNewSess={setPromoNewSess}
        nextSession={nextSession} sess={sess} students={students}
        allSessions={allSessions} currentSessId={currentSessId}
        onSwitchSession={id=>{switchSession(id);setShowSet(false);}}
        onDeleteSession={id=>setAllSessions(p=>p.filter(s=>s.id!==id))}
        onAddBlankSession={addBlankSession}
        onBackup={doBackup}
        onRestore={doRestore}
        backupHistory={backupHistory}
        onPromote={()=>setShowPromo(true)}
        onClose={()=>setShowSet(false)}
        onSave={()=>{setSchool(sf.name);setSchoolAddr(sf.addr);setSchoolEmail(sf.email||'');setSchoolPhone(sf.phone||'');setSchoolWebsite(sf.website||'');setSocialLinks({facebook:sf.facebook||'',instagram:sf.instagram||'',youtube:sf.youtube||''});setLogo(sfLogo);setLogoAlign(sfLogoAlign);setWatermark(sfWm);setShowSet(false);}}
        onDeleteAll={()=>{if(window.confirm("Delete ALL student records from the CURRENT session permanently? This cannot be undone.")){setStudents([]);setFees({});setShowSet(false);}}}
      />}

      {/* Feedback Popup */}
      {showFeedback&&<FeedbackPopup
        onClose={()=>{setShowFeedback(false);setFeedbackDone(true);localStorage.setItem("sms_feedback_shown",Date.now());}}
        isDark={theme==="dark"}
      />}

      {/* Session Promotion Wizard */}
      {showPromo&&(
        <SessionPromotion
          students={students}
          classes={classes}
          currentSess={sess}
          newSess={promoNewSess||nextSession(sess)}
          fees={currentSession.fees||{}}
          onConfirm={handlePromoConfirm}
          onClose={()=>{setShowPromo(false);setPromoNewSess("");}}
        />
      )}
    </div>
  );
}
