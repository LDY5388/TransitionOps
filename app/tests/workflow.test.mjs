import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,applyAction,currentEstimate,calculate,bankView,opsView,restoreState,quote} from '../lib/demo/engine.ts';
const at='2026-09-06T04:00:00.000Z';
const run=(s,type,role='manufacturer',extra={})=>applyAction(s,role,{type,...extra},at);
const share=(s,energy=false)=>run(s,'share','manufacturer',{fields:energy?['scope','quote','energy']:['scope','quote'],consent:true});
const prepared=()=>run(run(initialState(),'receive_basis'),'review_basis');
const shared=()=>share(prepared(),true);

test('whole-factory bill cannot produce an equipment estimate; initial package preserves missing values',()=>{
 const s=initialState();assert.equal(currentEstimate(s),null);assert.equal(share(s).packages[0].estimate,null);
 assert.throws(()=>share(s,true),/확인 전/);assert.equal(s.packages.length,0);
});
test('receiving a facility reply does not imply human review or change bank evidence',()=>{
 const s=share(initialState());const snap=JSON.stringify(bankView(s));const next=run(s,'receive_basis');
 assert.equal(currentEstimate(next),null);assert.equal(JSON.stringify(bankView(next)),snap);
 assert.equal(currentEstimate(run(next,'review_basis')).saving,35200);
});
test('load boundary arithmetic includes dryer once, uses exact cash totals, and leaves carbon unknown',()=>{
 const a=calculate(1),b=calculate(2);
 assert.deepEqual([a.baseline,a.proposed,a.saving,a.annualCostSaving],[152800,117600,35200,5280000]);
 assert.deepEqual([b.baseline,b.proposed,b.saving,b.annualCostSaving],[152800,113600,39200,5880000]);
 assert.equal(b.saving-a.saving,4000);assert.ok(b.payback>a.payback);assert.equal(b.co2,null);assert.equal(quote(2).totalCash,60500000);
 for(const h of [0,-1,NaN,Infinity,9000])assert.equal(calculate(1,h),null);
 assert.equal(calculate(1,4000,0),null);
});
test('approval is required and export is constructed by an allowlist, not copied from private documents',()=>{
 const s=prepared();assert.throws(()=>run(s,'share','manufacturer',{fields:['scope','quote'],consent:false}),/승인/);
 assert.throws(()=>run(s,'share','manufacturer',{fields:['scope','quote','raw_documents'],consent:true}),/필수 공유/);
 const p=share(s,true).packages[0];const raw=JSON.stringify(p);
 for(const value of ['예시고객-A','R-DEMO-17','12,400','640000','internal_file_paths','private_fields','content'])assert.equal(raw.includes(value),false,value);
 assert.equal(p.fields.includes('energy'),true);const withoutEnergy=share(s,false).packages[0];assert.equal(withoutEnergy.estimate,null);assert.equal(JSON.stringify(withoutEnergy).includes('150원'),false);assert.equal(JSON.stringify(withoutEnergy).includes('회수기간은'),false);
});
test('receiving and reviewing quote v2 cannot update or signal unapproved changes to the bank',()=>{
 const s=run(shared(),'review_bank','bank');const before=JSON.stringify(bankView(s));
 const changed=run(s,'receive_quote');assert.equal(currentEstimate(changed),null);assert.equal(JSON.stringify(bankView(changed)),before);
 const reviewed=run(changed,'review_quote');assert.equal(JSON.stringify(bankView(reviewed)),before);
 const next=share(reviewed,true);assert.equal(bankView(next).reviewStale,true);assert.equal(next.packages[0].quoteVersion,1);assert.equal(next.packages[0].estimate.saving,35200);assert.equal(next.packages[1].quoteVersion,2);
});
test('failed transmission retains an approved immutable snapshot; retry is idempotent and does not duplicate',()=>{
 let s=run(prepared(),'fail_next','ops');s=share(s,true);assert.equal(bankView(s).package,null);assert.ok(s.pending);
 const frozen=JSON.stringify(s.pending);const next=run(s,'retry','ops');assert.equal(JSON.stringify(next.packages[0]),frozen);assert.equal(next.pending,null);assert.equal(next.packages.length,1);
 assert.throws(()=>run(next,'retry','ops'),/재전달할 자료/);assert.equal(next.packages.length,1);
});
test('operations cannot approve sharing or bank review and its read view excludes business amounts and private text',()=>{
 let s=shared();for(const [role,type] of [['ops','share'],['ops','review_bank'],['bank','review_basis'],['manufacturer','request']])assert.throws(()=>run(s,type,role,{fields:['scope','quote'],consent:true}),/현재 역할/);
 const raw=JSON.stringify(opsView(s));for(const secret of ['48000000','152800','R-DEMO-17','예시고객-A','sources'])assert.equal(raw.includes(secret),false);
});
test('requests are linked to received versions, duplicates rejected, and new evidence answers basis requests',()=>{
 let s=run(share(initialState()),'request','bank');assert.throws(()=>run(s,'request','bank'),/이미 열려/);
 s=share(run(run(s,'receive_basis'),'review_basis'),true);s=run(s,'review_bank','bank');assert.equal(s.requests[0].status,'answered');
 assert.throws(()=>run(s,'request','bank'),/현재 데모의 보완 요청/);
});
test('duplicate sharing is blocked; optional energy can be added in a new approved package',()=>{
 let s=share(prepared());assert.throws(()=>share(s),/이미 전달/);s=share(s,true);assert.equal(s.packages.length,2);assert.equal(s.packages[1].supersedes,s.packages[0].id);
});
test('browser-state restore round-trips valid data and rejects malformed nested records',()=>{
 const s=shared();assert.deepEqual(restoreState(JSON.parse(JSON.stringify(s))),s);
 for(const v of [null,[],{}, {...s,pending:{}},{...s,packages:[{}]},{...s,requests:[null]},{...s,events:[null]},{...s,packages:[{...s.packages[0],estimate:{}}]}])assert.equal(restoreState(v),null);
});
