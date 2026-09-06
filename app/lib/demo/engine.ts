import scenario from './scenario.json' with { type: 'json' };
export { scenario };
export type Role = 'manufacturer' | 'bank' | 'ops';
export type ShareField = 'scope' | 'quote' | 'energy';
export type Estimate = { baseline: number; proposed: number; saving: number; savingPercent: number; annualCostSaving: number; payback: number; hours: number; tariff: number; co2: null };
export type Package = { id: string; revision: number; sourceRevision: number; quoteVersion: 1 | 2; approvedAt: string; recipient: string; purpose: string; fields: ShareField[]; supersedes: string | null; project: { id: string; company: string; purpose: string }; scope: string; quote: { version: number; capex: number; vat: number; totalCash: number; description: string }; estimate: Estimate | null; sources: { id: string; excerpt: string }[]; openItems: string[]; assumptions: string[]; approval: string; synthetic: true };
export type Request = { id: string; packageId: string; kind: 'basis' | 'revision'; text: string; status: 'open' | 'answered' };
export type Event = { id: number; role: Role; name: string; status: 'done' | 'waiting' | 'failed'; at: string; reference: string };
export type State = { schema: 1; quoteVersion: 1 | 2; basisReceived: boolean; basisReviewed: boolean; quoteReviewed: boolean; sourceRevision: number; packages: Package[]; pending: Package | null; reviewedPackageId: string | null; requests: Request[]; events: Event[]; failNextDelivery: boolean };
export type Action = { type: 'receive_basis' | 'review_basis' | 'receive_quote' | 'review_quote' | 'request' | 'review_bank' | 'fail_next' | 'retry' } | { type: 'share'; fields: ShareField[]; consent: boolean };
export const INITIAL_STATE: State = {schema:1,quoteVersion:1,basisReceived:false,basisReviewed:false,quoteReviewed:true,sourceRevision:0,packages:[],pending:null,reviewedPackageId:null,requests:[],events:[],failNextDelivery:false};
export function initialState(): State {return structuredClone(INITIAL_STATE)}
export function quote(version: 1 | 2) { const capex=version===1?48000000:55000000; return {version,capex,vat:capex*.1,totalCash:capex+capex*.1,description:version===1?'압축기 교체 · 기존 드라이어 재사용':'압축기·드라이어 교체 · 신규 드라이어 포함'}; }
export function calculate(version: 1 | 2, hours=4000, tariff=150): Estimate | null {
 if(!Number.isFinite(hours)||hours<=0||hours>8760||!Number.isFinite(tariff)||tariff<=0)return null;
 let baseline=0, proposed=0;
 for(const bin of scenario.project.load_bins){const h=hours*bin.annual_hours/4000;baseline+=(bin.baseline_compressor_kw+3)*h;proposed+=(bin.new_compressor_kw+(version===1?3:2))*h;}
 const saving=baseline-proposed, annualCostSaving=saving*tariff;
 if(saving<=0)return null;
 return {baseline,proposed,saving,savingPercent:saving/baseline*100,annualCostSaving,payback:quote(version).capex/annualCostSaving,hours,tariff,co2:null};
}
export function currentEstimate(state:State){return state.basisReviewed&&state.quoteReviewed?calculate(state.quoteVersion):null}
export function latestPackage(state:State){return state.packages.at(-1)??null}
export function bankView(state:State){const p=latestPackage(state);return {package:p,history:state.packages,requests:state.requests,reviewed:p!==null&&state.reviewedPackageId===p.id,reviewStale:p!==null&&state.reviewedPackageId!==null&&state.reviewedPackageId!==p.id};}
export function opsView(state:State){return {events:state.events,pending:state.pending?{id:state.pending.id,revision:state.pending.revision,recipient:state.pending.recipient}:null,failNextDelivery:state.failNextDelivery,deliveredCount:state.packages.length};}
export function getFindings(state:State){
 const findings:{id:string;severity:'blocking'|'review'|'info';title:string;body:string;owner:string;sources:string[]}[]=[];
 if(!state.basisReceived)findings.push({id:'boundary',severity:'blocking',title:'공장 전체 전력은 압축기 계측값이 아닙니다',body:'640,000 kWh는 공장 전체의 다른 기간 자료입니다. CA-01의 계측 범위·부하별 시간·기존 드라이어 전력을 시설 담당자에게 요청하세요.',owner:'시설 담당자',sources:['DOC-02','DOC-03']});
 else if(!state.basisReviewed)findings.push({id:'basis-review',severity:'review',title:'시설 회신이 도착했습니다. 적용 조건을 확인하세요',body:'압축기와 드라이어를 같은 경계로 비교하고, 80시간 표본을 연 4,000시간으로 환산하는 가정과 생산 압력·공기질 요구를 검토해야 합니다.',owner:'시설·품질 담당자',sources:['DOC-01','DOC-04']});
 if(state.quoteVersion===2&&!state.quoteReviewed)findings.push({id:'quote-change',severity:'review',title:'드라이어가 추가되어 기존 투자 검토가 달라집니다',body:'투자비 +700만원, 부가세 포함 지급액 +770만원. 동일 운전 가정에서 추가 절감은 연 4,000 kWh입니다. 비용·설비 범위·공기질 조건을 다시 확인하세요.',owner:'구매·시설·품질 담당자',sources:['DOC-03','DOC-05','DOC-04']});
 if(currentEstimate(state))findings.push({id:'estimate',severity:'info',title:state.quoteVersion===1?'조건부 추정과 근거를 공유할 수 있습니다':'절감은 늘지만 회수기간도 길어집니다',body:state.quoteVersion===1?'동일 부하·공급 조건이라는 가정에서만 전력을 비교했습니다. 기업 담당자가 필요한 항목을 선택하고 공유를 승인하세요.':'드라이어 교체로 예상 절감액이 연 60만원 늘지만, 추가 투자 700만원 때문에 단순 회수기간은 9.09년에서 9.35년으로 늘어납니다.',owner:'투자 담당자',sources:state.quoteVersion===1?['DOC-03','DOC-04']:['DOC-03','DOC-04','DOC-05']});
 findings.push({id:'carbon',severity:'info',title:'탄소 감축량과 신용 승인은 별도입니다',body:'적용 가능한 배출계수·방법론을 확정하지 않아 CO₂ 감축량은 미산정입니다. 전력 절감 추정이나 자료 검토 완료는 대출 승인이 아닙니다.',owner:'전문 검토·은행',sources:['DOC-07']});
 return findings;
}
function record(s:State,role:Role,name:string,status:Event['status'],reference:string,at:string){s.events.push({id:s.events.length+1,role,name,status,reference,at})}
function createPackage(s:State,fields:ShareField[],at:string):Package{
 const prev=latestPackage(s), revision=(prev?.revision??-1)+1;
 const estimate=fields.includes('energy')?currentEstimate(s):null;
 return {id:`PKG-TO-001-r${revision}`,revision,sourceRevision:s.sourceRevision,quoteVersion:s.quoteVersion,approvedAt:at,recipient:'BANK-DEMO-IM',purpose:'설비투자 금융상담 근거 확인',fields:[...fields],supersedes:prev?.id??null,project:{id:scenario.scenario_id,company:scenario.company.name,purpose:'생산에 필요한 압축공기를 유지하며 설비투자 근거 준비'},scope:s.basisReviewed?'CA-01 압축기 패키지 + 드라이어. 다른 생산 설비·조명·공조 제외. 동일 생산·유량·압력 조건의 조건부 비교.':'CA-01 압축공기 계통. 상세 계측 경계와 연간 운전 조건은 확인 전.',quote:quote(s.quoteVersion),estimate,sources:[{id:s.quoteVersion===1?'DOC-03':'DOC-05',excerpt:quote(s.quoteVersion).description+' / 공급가 '+quote(s.quoteVersion).capex.toLocaleString('ko-KR')+'원'},...(estimate?[{id:'DOC-04',excerpt:'합성 80h 표본 × 50주 = 4000h/년. 고·중·저 부하 1600/1600/800h. 기존 드라이어 3kW. 동일 조건 비교.'}]:[])],openItems:[...(estimate?[]:['계측 경계·운전 가정 및 전력 추정 근거 보완']), '교체 후 말단 압력·건조·여과 조건은 시운전에서 별도 확인','적용 배출계수·방법론 미확정','신용·담보·상품요건 별도 심사'],assumptions:['모든 기업·설비·계측·견적 수치는 합성 시나리오',...(estimate?['전력 단가 150원/kWh는 시연 가정','단순 회수기간은 부가세 제외 투자비/예상 전력비 절감. 금융·유지비 미반영']:[])],approval:'제조 공유 승인 담당자 · 데모 사용자 확인',synthetic:true};
}
export function applyAction(state:State,role:Role,action:Action,at=new Date().toISOString()):State{
 const s=structuredClone(state);
 const allowed:Record<Action['type'],Role>={receive_basis:'manufacturer',review_basis:'manufacturer',receive_quote:'manufacturer',review_quote:'manufacturer',share:'manufacturer',request:'bank',review_bank:'bank',fail_next:'ops',retry:'ops'};
 if(allowed[action.type]!==role)throw new Error('현재 역할에서 수행할 수 없는 작업입니다.');
 switch(action.type){
 case 'receive_basis': if(s.basisReceived)throw new Error('이미 시설 회신을 받았습니다.');s.basisReceived=true;s.sourceRevision++;record(s,role,'시설 회신 수신','done','DOC-04',at);break;
 case 'review_basis':if(!s.basisReceived||s.basisReviewed)throw new Error('검토할 새 시설 회신이 없습니다.');s.basisReviewed=true;s.sourceRevision++;record(s,role,'운전 경계·생산 조건 검토','done','DOC-04',at);break;
 case 'receive_quote':if(s.quoteVersion===2||!s.packages.some(p=>p.estimate&&p.quoteVersion===1))throw new Error('v1 근거를 공유한 뒤 변경 견적을 받을 수 있습니다.');s.quoteVersion=2;s.quoteReviewed=false;s.sourceRevision++;record(s,role,'변경 견적 수신','done','DOC-05',at);break;
 case 'review_quote':if(s.quoteVersion!==2||s.quoteReviewed||!s.basisReviewed)throw new Error('검토할 변경 견적이 없습니다.');s.quoteReviewed=true;s.sourceRevision++;record(s,role,'변경 범위·비용·품질 조건 검토','done','DOC-05',at);break;
 case 'share':{
  if(s.pending)throw new Error('승인된 자료가 전달 대기 중입니다. 운영 화면에서 재전달하세요.');
  if(!action.consent)throw new Error('공유 범위 확인과 승인이 필요합니다.');
  const valid:ShareField[]=['scope','quote','energy'];
  if(!Array.isArray(action.fields)||action.fields.some(f=>!valid.includes(f))||new Set(action.fields).size!==action.fields.length||!action.fields.includes('scope')||!action.fields.includes('quote'))throw new Error('설비 범위와 견적 요약은 필수 공유 항목입니다.');
  if(action.fields.includes('energy')&&!currentEstimate(s))throw new Error('조건 확인 전에는 전력 추정을 공유할 수 없습니다.');
  if(!s.quoteReviewed)throw new Error('변경 견적의 비용·범위·품질 조건을 먼저 검토하세요.');
  const prev=latestPackage(s);
  if(prev&&prev.sourceRevision===s.sourceRevision&&JSON.stringify([...prev.fields].sort())===JSON.stringify([...action.fields].sort()))throw new Error('같은 근거와 공유 범위를 이미 전달했습니다.');
  const p=createPackage(s,action.fields,at);record(s,role,'자료 공유 승인','done',p.id,at);
  if(s.failNextDelivery){s.pending=p;s.failNextDelivery=false;record(s,'ops','자료 전달 실패','failed',p.id,at)}else{s.packages.push(p);record(s,'ops','승인 자료 전달','done',p.id,at)}break;
 }
 case 'request':{const p=latestPackage(s);if(!p)throw new Error('먼저 제조기업의 상담 준비본을 받아야 합니다.');if(p.estimate)throw new Error('현재 데모의 보완 요청은 미산정된 계측·운전 근거를 대상으로 합니다. 금융 조건은 별도 검토 항목입니다.');if(s.requests.some(r=>r.packageId===p.id&&r.status==='open'))throw new Error('이 자료에 대한 보완 요청이 이미 열려 있습니다.');const kind=p.estimate?'revision':'basis';s.requests.push({id:`REQ-${String(s.requests.length+1).padStart(3,'0')}`,packageId:p.id,kind,text:kind==='basis'?'CA-01의 계측 경계, 부하별 시간, 기존 드라이어 전력과 생산 요구조건을 확인해 주세요. 공장 전체 전력으로는 해당 설비 절감량을 검토할 수 없습니다.':'변경 견적의 공급가·부가세·자부담 계획을 확인해 주세요. 교체 후 압력·공기질 조건과 미산정 탄소 항목도 별도 확인이 필요합니다.',status:'open'});record(s,role,'근거 보완 요청','done',p.id,at);break;}
 case 'review_bank':{const p=latestPackage(s);if(!p?.estimate)throw new Error('전력 추정과 운전 근거가 포함된 자료가 필요합니다.');if(s.reviewedPackageId===p.id)throw new Error('이미 해당 버전을 검토했습니다.');s.reviewedPackageId=p.id;s.requests=s.requests.map(r=>r.kind==='basis'&&r.packageId!==p.id?{...r,status:'answered'}:r);record(s,role,'공유 자료 검토 완료','done',p.id,at);break;}
 case 'fail_next':if(s.failNextDelivery)throw new Error('이미 다음 전달의 실패 시연이 예약돼 있습니다.');s.failNextDelivery=true;record(s,role,'다음 전달 실패 시연 설정','waiting','DELIVERY-DEMO',at);break;
 case 'retry':if(!s.pending)throw new Error('재전달할 자료가 없습니다.');if(!s.packages.some(p=>p.id===s.pending!.id))s.packages.push(s.pending);record(s,role,'승인 자료 재전달','done',s.pending.id,at);s.pending=null;break;
 }
 return s;
}
export function canApply(s:State,r:Role,a:Action){try{applyAction(s,r,a);return true}catch{return false}}
export function restoreState(value:unknown):State|null{
 // Device-local demo state, not an authentication boundary. Reject malformed saved records.
 if(!value||typeof value!=='object'||Array.isArray(value))return null;const s=value as State;
 const isEstimate=(e:unknown)=>{if(e===null)return true;if(!e||typeof e!=='object')return false;const x=e as Record<string,unknown>;return ['baseline','proposed','saving','savingPercent','annualCostSaving','payback','hours','tariff'].every(k=>typeof x[k]==='number'&&Number.isFinite(x[k]))&&x.co2===null};
 const isPackage=(p:unknown)=>{if(!p||typeof p!=='object')return false;const x=p as Package;return typeof x.id==='string'&&Number.isInteger(x.revision)&&Number.isInteger(x.sourceRevision)&&[1,2].includes(x.quoteVersion)&&typeof x.approvedAt==='string'&&!Number.isNaN(Date.parse(x.approvedAt))&&typeof x.purpose==='string'&&typeof x.recipient==='string'&&typeof x.scope==='string'&&typeof x.approval==='string'&&x.synthetic===true&&!!x.project&&['id','company','purpose'].every(k=>typeof (x.project as Record<string,unknown>)[k]==='string')&&!!x.quote&&['capex','vat','totalCash'].every(k=>typeof (x.quote as Record<string,unknown>)[k]==='number'&&Number.isFinite((x.quote as Record<string,unknown>)[k]))&&typeof x.quote.description==='string'&&Array.isArray(x.fields)&&x.fields.every(k=>['scope','quote','energy'].includes(k))&&Array.isArray(x.sources)&&x.sources.every(r=>r&&typeof r.id==='string'&&typeof r.excerpt==='string')&&Array.isArray(x.openItems)&&x.openItems.every(r=>typeof r==='string')&&Array.isArray(x.assumptions)&&x.assumptions.every(r=>typeof r==='string')&&isEstimate(x.estimate)};
 if(s.schema!==1||![1,2].includes(s.quoteVersion)||!Array.isArray(s.packages)||!Array.isArray(s.requests)||!Array.isArray(s.events)||typeof s.basisReviewed!=='boolean'||typeof s.basisReceived!=='boolean'||typeof s.quoteReviewed!=='boolean'||!Number.isInteger(s.sourceRevision)||typeof s.failNextDelivery!=='boolean'||!(s.pending===null||isPackage(s.pending))||!(s.reviewedPackageId===null||typeof s.reviewedPackageId==='string'))return null;
 if(!s.packages.every(isPackage)||!s.requests.every(r=>r&&typeof r.id==='string'&&typeof r.packageId==='string'&&typeof r.text==='string'&&['basis','revision'].includes(r.kind)&&['open','answered'].includes(r.status))||!s.events.every(e=>e&&Number.isInteger(e.id)&&['manufacturer','bank','ops'].includes(e.role)&&typeof e.name==='string'&&typeof e.reference==='string'&&typeof e.at==='string'&&['done','waiting','failed'].includes(e.status)))return null;
 return s;
}
