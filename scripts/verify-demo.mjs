import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {analyse} from '../lib/pump.ts';
import {proposalFor} from '../lib/agent.ts';
const base='http://localhost:5173';
const signin=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
assert.equal(signin.status,302);
const cookie=signin.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie);
const headers={'Content-Type':'application/json',Origin:base,Cookie:cookie};
const post=async(path,body)=>{const r=await fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});return {status:r.status,...await r.json()};};
const records=[];
const finding=async(value)=>post('/api/cases',{id:crypto.randomUUID(),scenario:'suction',kind:'finding',finding:value,note:'Submission verification: synthetic inspection.'});
assert.equal((await finding('none')).status,200);
const stale=proposalFor(analyse('suction'));
assert.equal((await finding('clear')).status,200);
const task={id:crypto.randomUUID(),scenario:'suction',kind:'task',finding:'none',approved:true,title:stale.title,hypothesisId:stale.hypothesisId,revision:stale.revision};
assert.equal((await post('/api/cases',task)).status,409);
records.push({check:'Stale approval after new evidence',passed:true});
assert.equal((await finding('none')).status,200);
const saved=await post('/api/cases',task);assert.equal(saved.status,200);
assert.equal((await post('/api/cases',task)).event.id,saved.event.id);
const events=await (await fetch(base+'/api/cases?scenario=suction',{headers})).json();
assert.equal(events.events.filter(e=>e.id===task.id).length,1);
records.push({check:'Approved task persisted, read back and retry deduplicated',passed:true,id:saved.event.id});
for(const [scenario,selected,question] of [
 ['suction','none','Investigate the pump by comparing process, vibration and maintenance evidence, then propose the next inspection.'],
 ['suction','clear','The suction path is clear. Reassess the leading hypothesis and explain the next discriminating check.'],
 ['sensor','none','Is this vibration evidence trustworthy? Explain what to do next and whether remaining life can be predicted.']
]){
 const answer=await post('/api/copilot',{scenario,finding:selected,question,history:[]});
 records.push({check:'Live OpenRouter investigation',scenario,finding:selected,...answer});
 console.log(JSON.stringify({scenario,finding:selected,status:answer.status,mode:answer.mode,tools:answer.trace?.map(t=>t.name),error:answer.error}));
 await mkdir('outputs',{recursive:true});await writeFile('outputs/live-verification.json',JSON.stringify(records,null,2));
 assert.equal(answer.status,200);assert.equal(answer.mode,'agent');assert.ok(answer.trace.length);
}
console.log('All local integration checks passed.');
