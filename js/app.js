(() => {
"use strict";
const $ = id => document.getElementById(id);
const DEFAULT_MEMBERS = ["Duda","Leto","Adriene","Gi","Girlene","Adri"];
const DEFAULT_ACTIVITIES = ["E-mail","Retorno","Fieldglass","FUP","ServiceNow","V360","Spot Materiais","Encerramento"];
const state = { user:null, supabase:null, start:"2026-12-21", end:"2027-01-03", days:{}, members:[], absences:[], activities:[...DEFAULT_ACTIVITIES], avoidConsecutive:true, syncTimer:null, syncing:false };
const todayISO = () => new Date().toISOString().slice(0,10);
const parseISO = s => new Date(s+"T12:00:00");
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmt = (s, opts={day:"2-digit",month:"short"}) => parseISO(s).toLocaleDateString("pt-BR",opts).replace(".","").toUpperCase();
const weekday = s => ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"][parseISO(s).getDay()];
const key = s => `caf-scale-${s}`;
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function setSync(ok,msg){$("syncDot").classList.toggle("online",!!ok);$("syncText").textContent=msg}
function configReady(){const c=window.CAF_SUPABASE_CONFIG||{};return c.url?.startsWith("https://")&&!c.url.includes("SEU-PROJETO")&&c.anonKey&&!c.anonKey.includes("SUA_CHAVE")}
function initMembers(){state.members=DEFAULT_MEMBERS.map((name,i)=>({id:"m"+i,name,role:name==="Girlene"?"ServiceNow fixa":"Equipe CAF",active:true}))}
function dayData(date){if(!state.days[date]){const w=parseISO(date).getDay();state.days[date]={type:w===0||w===6?"weekend":"home",note:"",assignments:{}};}return state.days[date]}
function eachDate(start,end){const out=[];let d=parseISO(start),last=parseISO(end);while(d<=last){out.push(iso(d));d.setDate(d.getDate()+1)}return out}
function renderCalendar(){
 const dates=eachDate(state.start,state.end);$("periodTitle").textContent=dates.length>10?"ESCALA PROGRAMADA":"ESCALA DE FIM DE ANO";
 $("periodLabel").textContent=`${fmt(state.start,{day:"2-digit",month:"short",year:"numeric"})} — ${fmt(state.end,{day:"2-digit",month:"short",year:"numeric"})}`;
 $("startDate").value=state.start;$("endDate").value=state.end;
 const chunks=[];for(let i=0;i<dates.length;i+=7)chunks.push(dates.slice(i,i+7));
 $("calendarWeeks").innerHTML=chunks.map((week,idx)=>`<div class="week-block"><div class="week-title ${idx%2?"second":""}">SEMANA ${idx+1} &nbsp;•&nbsp; ${fmt(week[0])} A ${fmt(week[week.length-1],{day:"2-digit",month:"long"})}</div><div class="day-grid">${week.map(renderDay).join("")}</div></div>`).join("");
}
function renderDay(date){
 const d=dayData(date),w=parseISO(date).getDay(),types={home:"HOME OFFICE",work:"DIA ÚTIL / COBERTURA",individual:"FOLGA INDIVIDUAL",collective:"FOLGA COLETIVA",weekend:"FIM DE SEMANA"};
 const assignments=Object.entries(d.assignments||{}).filter(([,v])=>v);
 let chips=assignments.map(([a,v])=>`<span class="person-chip" title="${esc(a)}: ${esc(v)}">${esc(v)}</span>`).join("");
 let central=d.type==="collective"?'<div class="collective-chip">FOLGA COLETIVA</div><div class="day-note">Equipe toda</div>':d.type==="home"?'<div class="home-chip">HOME OFFICE</div>':d.type==="weekend"?'<div class="weekend-label">FIM DE SEMANA</div>':chips;
 return `<article class="day-card ${d.type}" data-date="${date}"><div class="day-head"><span>${weekday(date)}</span><span class="day-month">${fmt(date,{day:"2-digit",month:"short",year:"2-digit"})}</span></div><h3>${fmt(date,{day:"2-digit"})}</h3><div class="day-status">${types[d.type]}</div>${central}${d.note?`<div class="day-note">${esc(d.note)}</div>`:""}<button class="day-edit" data-edit="${date}">Editar programação</button></article>`;
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showDay(date){const d=dayData(date);$("editDate").value=date;$("dayDialogTitle").textContent=`Programar ${fmt(date,{day:"2-digit",month:"long",year:"numeric"})}`;$("dayType").value=d.type;$("dayNote").value=d.note||"";renderAssignmentFields(d);$("dayDialog").showModal()}
function renderAssignmentFields(d){$("assignmentFields").innerHTML=state.activities.map(a=>`<label>${esc(a)}<select data-activity="${esc(a)}"><option value="">Não atribuído</option>${state.members.filter(m=>m.active).map(m=>`<option ${d.assignments?.[a]===m.name?"selected":""} value="${esc(m.name)}">${esc(m.name)}</option>`).join("")}</select></label>`).join("")}
function saveDay(){const date=$("editDate").value;const d=dayData(date);d.type=$("dayType").value;d.note=$("dayNote").value.trim();d.assignments={};document.querySelectorAll("[data-activity]").forEach(s=>{if(s.value)d.assignments[s.dataset.activity]=s.value});if(d.type==="collective"||d.type==="weekend")d.assignments={};$("dayDialog").close();renderCalendar();persist();toast("Programação atualizada.")}
function renderTeam(){$("teamList").innerHTML=state.members.map(m=>`<div class="member-card"><h3>${esc(m.name)}</h3><p>${esc(m.role||"Colaborador")} • ${m.active?"Ativo":"Inativo"}</p><div class="card-actions"><button class="btn light" data-member-edit="${m.id}">Editar</button><button class="btn light" data-member-toggle="${m.id}">${m.active?"Desativar":"Ativar"}</button></div></div>`).join("")||'<p class="muted">Nenhum colaborador cadastrado.</p>'}
function renderAbsences(){$("absenceList").innerHTML=state.absences.length?state.absences.map((a,i)=>`<div class="absence-row"><b>${esc(a.member)}</b><span>${fmt(a.start)} a ${fmt(a.end)}</span><span>${esc(a.type)}</span><span>${esc(a.note||"—")}</span><button class="btn light" data-absence-delete="${i}">Excluir</button></div>`).join(""):'<p class="muted">Nenhuma ausência cadastrada.</p>'}
function renderRules(){$("activityFields").innerHTML=state.activities.map((a,i)=>`<label>Atividade ${i+1}<input data-activity-name="${i}" value="${esc(a)}"></label>`).join("");$("avoidConsecutive").checked=state.avoidConsecutive}
function openPage(page){document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$("page-"+page).classList.remove("hidden");document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("pageTitle").textContent=({calendario:"Calendário de escalas",equipe:"Gestão da equipe",ausencias:"Gestão de ausências",regras:"Regras e atividades"})[page]}
function snapshot(){return {start:state.start,end:state.end,days:state.days,members:state.members,absences:state.absences,activities:state.activities,avoidConsecutive:state.avoidConsecutive}}
function applySnapshot(p){if(!p)return;state.start=p.start||state.start;state.end=p.end||state.end;state.days=p.days||{};state.members=p.members||state.members;state.absences=p.absences||[];state.activities=p.activities||state.activities;state.avoidConsecutive=p.avoidConsecutive!==false;renderAll()}
function renderAll(){renderCalendar();renderTeam();renderAbsences();renderRules()}
async function persist(){
 localStorage.setItem("caf-scale-local",JSON.stringify(snapshot()));
 if(!state.supabase||!state.user)return;
 try{const {error}=await state.supabase.from("caf_escalas").upsert({id:"principal",payload:snapshot(),updated_at:new Date().toISOString(),updated_by:state.user.id},{onConflict:"id"});if(error)throw error;localStorage.setItem("caf-scale-updated",String(Date.now()));setSync(true,"Sincronizado • atualização periódica")}catch(e){setSync(false,"Falha ao sincronizar");console.error(e);toast("Alteração salva localmente, mas não sincronizou.")}
}
async function syncRemote(){
 if(!state.supabase||!state.user||state.syncing)return;state.syncing=true;
 try{const {data,error}=await state.supabase.from("caf_escalas").select("payload,updated_at").eq("id","principal").maybeSingle();if(error)throw error;
 if(data?.payload){const remoteTime=new Date(data.updated_at).getTime();const localTime=Number(localStorage.getItem("caf-scale-updated")||0);if(remoteTime>localTime){applySnapshot(data.payload);localStorage.setItem("caf-scale-updated",String(remoteTime));setSync(true,"Atualizado do servidor");}else setSync(true,"Conectado • sincronização ativa");}
 else await persist();
 }catch(e){setSync(false,"Sem conexão com o banco");console.error(e)}finally{state.syncing=false}
}
async function login(email,password){
 if(!configReady()){throw new Error("Configure a URL e a chave anon do Supabase em js/supabase-config.js antes de entrar.");}
 const c=window.CAF_SUPABASE_CONFIG;state.supabase=window.supabase.createClient(c.url,c.anonKey);
 const {data,error}=await state.supabase.auth.signInWithPassword({email,password});if(error)throw error;state.user=data.user;
 $("loginView").classList.add("hidden");$("appView").classList.remove("hidden");$("userLabel").textContent=data.user.email||"Usuário";setSync(false,"Conectando...");
 const {data:row,error:readError}=await state.supabase.from("caf_escalas").select("payload").eq("id","principal").maybeSingle();if(readError)throw readError;
 if(row?.payload)applySnapshot(row.payload);else await persist();
 clearInterval(state.syncTimer);state.syncTimer=setInterval(syncRemote,10000);renderAll();
}
async function logout(){clearInterval(state.syncTimer);if(state.supabase)await state.supabase.auth.signOut();state.user=null;$("appView").classList.add("hidden");$("loginView").classList.remove("hidden")}
function exportJSON(){const blob=new Blob([JSON.stringify(snapshot(),null,2)],{type:"application/json"});download(blob,`caf-escala-${state.start}.json`)}
function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
function importJSON(file){const r=new FileReader();r.onload=()=>{try{applySnapshot(JSON.parse(r.result));persist();toast("Backup importado.")}catch{toast("Arquivo JSON inválido.")}};r.readAsText(file)}
function addMember(){ $("memberDialogTitle").textContent="Novo colaborador";$("memberId").value="";$("memberName").value="";$("memberRole").value="";$("memberActive").checked=true;$("memberDialog").showModal()}
function editMember(id){const m=state.members.find(x=>x.id===id);if(!m)return;$("memberDialogTitle").textContent="Editar colaborador";$("memberId").value=id;$("memberName").value=m.name;$("memberRole").value=m.role||"";$("memberActive").checked=m.active;$("memberDialog").showModal()}
function saveMember(){const id=$("memberId").value,name=$("memberName").value.trim();if(!name)return;const data={id:id||"m"+Date.now(),name,role:$("memberRole").value.trim(),active:$("memberActive").checked};const old=state.members.find(m=>m.id===id);if(old)Object.assign(old,data);else state.members.push(data);$("memberDialog").close();renderAll();persist();toast("Equipe atualizada.")}
function addAbsence(){ $("absenceMember").innerHTML=state.members.map(m=>`<option>${esc(m.name)}</option>`).join("");$("absenceStart").value=state.start;$("absenceEnd").value=state.start;$("absenceDialog").showModal()}
function saveAbsence(){const start=$("absenceStart").value,end=$("absenceEnd").value;if(!start||!end||end<start){toast("Confira o período da ausência.");return}state.absences.push({member:$("absenceMember").value,start,end,type:$("absenceType").value,note:$("absenceNote").value.trim()});$("absenceDialog").close();renderAbsences();persist();toast("Ausência cadastrada.")}
function changePeriod(delta){const s=parseISO(state.start);s.setDate(s.getDate()+delta*14);state.start=iso(s);const e=parseISO(state.end);e.setDate(e.getDate()+delta*14);state.end=iso(e);renderCalendar()}
function wire(){
 $("loginForm").addEventListener("submit",async e=>{e.preventDefault();$("loginMessage").textContent="";try{await login($("loginEmail").value.trim(),$("loginPassword").value)}catch(err){$("loginMessage").textContent=err.message}});
 $("logoutBtn").onclick=logout;document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>openPage(b.dataset.page));
 $("calendarWeeks").addEventListener("click",e=>{const b=e.target.closest("[data-edit]");if(b)showDay(b.dataset.edit)});
 $("addDayBtn").onclick=()=>showDay(state.start);$("saveDayBtn").onclick=e=>{e.preventDefault();saveDay()};
 $("applyPeriod").onclick=()=>{if($("endDate").value<$("startDate").value){toast("A data final deve ser posterior à inicial.");return}state.start=$("startDate").value;state.end=$("endDate").value;renderCalendar()};
 $("prevPeriod").onclick=()=>changePeriod(-1);$("nextPeriod").onclick=()=>changePeriod(1);$("todayBtn").onclick=()=>{state.start=todayISO();let e=parseISO(state.start);e.setDate(e.getDate()+13);state.end=iso(e);renderCalendar()};
 $("exportJsonBtn").onclick=exportJSON;$("importJson").onchange=e=>{if(e.target.files[0])importJSON(e.target.files[0]);e.target.value=""};$("exportPdfBtn").onclick=()=>window.print();
 $("addMemberBtn").onclick=addMember;$("saveMemberBtn").onclick=e=>{e.preventDefault();saveMember()};
 $("teamList").addEventListener("click",e=>{const ed=e.target.closest("[data-member-edit]"),tg=e.target.closest("[data-member-toggle]");if(ed)editMember(ed.dataset.memberEdit);if(tg){const m=state.members.find(x=>x.id===tg.dataset.memberToggle);m.active=!m.active;renderAll();persist()}});
 $("addAbsenceBtn").onclick=addAbsence;$("saveAbsenceBtn").onclick=e=>{e.preventDefault();saveAbsence()};$("absenceList").addEventListener("click",e=>{const b=e.target.closest("[data-absence-delete]");if(b){state.absences.splice(Number(b.dataset.absenceDelete),1);renderAbsences();persist()}});
 $("saveRulesBtn").onclick=()=>{document.querySelectorAll("[data-activity-name]").forEach(i=>{state.activities[Number(i.dataset.activityName)]=i.value.trim()||DEFAULT_ACTIVITIES[Number(i.dataset.activityName)]});state.avoidConsecutive=$("avoidConsecutive").checked;renderAll();persist();toast("Regras salvas.")};
}
initMembers();wire();renderAll();
})();