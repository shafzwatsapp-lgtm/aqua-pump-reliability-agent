import test from 'node:test';
import assert from 'node:assert/strict';
import {analyse} from '../lib/pump.ts';
import {runEvidenceAgent,executeEvidenceTool,proposalFor,analysisRevision} from '../lib/agent.ts';
const call=(id,name,args={})=>({id,type:'function',function:{name,arguments:JSON.stringify(args)}});
test('model-selected tools are executed, consumed, and traced',async()=>{
 const r=await runEvidenceAgent({result:analyse('suction'),question:'Why?',history:[],complete:async(messages,round)=>{
  if(round===0)return {tool_calls:[call('a','read_process_trends'),call('b','inspect_vibration')]};
  assert.equal(messages.filter(m=>m.role==='tool').length,2);assert.equal(JSON.parse(messages.at(-1).content).valid,true);
  return {content:'Suction pressure fell [SC-01], with a broadband vibration signature [VB-02]. This is a hypothesis, not confirmation.'};
 }});assert.deepEqual(r.trace.map(t=>t.name),['read_process_trends','inspect_vibration']);assert.equal(r.proposal,undefined);
});
test('unknown tools, invalid arguments, and unbounded loops cannot perform actions',async()=>{
 assert.throws(()=>executeEvidenceTool('save_task',{},analyse('suction')));
 assert.throws(()=>executeEvidenceTool('read_process_trends',{url:'https://example.com'},analyse('suction')));
 await assert.rejects(runEvidenceAgent({result:analyse('suction'),question:'loop',history:[],complete:async(_,i)=>({tool_calls:[call(String(i),'read_process_trends')]})}),/AGENT_LIMIT/);
});
test('invalid channels withhold every derived vibration feature',()=>{
 for(const r of [analyse('sensor'),analyse('suction','loose-sensor')]){const out=executeEvidenceTool('inspect_vibration',{},r);assert.equal(out.data.valid,false);assert.equal(out.data.features,null);assert.match(out.data.evidence[1].quality,/Invalid/);assert.doesNotMatch(out.data.evidence[1].detail,/peak [\d.]+/);}
});
test('new evidence revises support, snapshot and proposed scope without persisting anything',()=>{
 const before=analyse('suction'),after=analyse('suction','clear');const p=proposalFor(before),q=proposalFor(after);
 assert.notEqual(analysisRevision(before),analysisRevision(after));assert.notEqual(p.title,q.title);assert.ok(q.evidence.includes('IN-01'));
 const out=executeEvidenceTool('propose_inspection',{hypothesisId:'suction'},after);assert.equal(out.data.saved,false);assert.equal(out.data.requiresApproval,true);
 assert.throws(()=>proposalFor(analyse('healthy')));
});
test('fabricated citations and answers without evidence are rejected',async()=>{
 await assert.rejects(runEvidenceAgent({result:analyse('suction'),question:'why',history:[],complete:async()=>({content:'Trust me'})}),/MODEL_NO_EVIDENCE/);
 await assert.rejects(runEvidenceAgent({result:analyse('suction'),question:'why',history:[],complete:async(_,r)=>r?{content:'Confirmed [MX-99]'}:{tool_calls:[call('x','read_process_trends')]}}),/MODEL_CITATION/);
});
test('a proposal cannot replace evidence review and uncited answers are rejected',async()=>{
 await assert.rejects(runEvidenceAgent({result:analyse('suction'),question:'plan',history:[],complete:async(_,r)=>r?{content:'Inspect it [SC-01]'}:{tool_calls:[call('x','propose_inspection',{hypothesisId:'suction'})]}}),/MODEL_NO_EVIDENCE/);
 await assert.rejects(runEvidenceAgent({result:analyse('suction'),question:'why',history:[],complete:async(_,r)=>r?{content:'Pressure fell.'}:{tool_calls:[call('x','read_process_trends')]}}),/MODEL_CITATION/);
});
