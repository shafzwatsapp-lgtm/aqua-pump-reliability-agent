import {z} from 'zod';
import {analyse,scenarios,findings,type Scenario,type Finding} from '@/lib/pump';
import {analysisRevision} from '@/lib/agent';
import {identity,database,sameOrigin,failure,boundedJson} from '@/lib/server';
const schema=z.object({scenario:z.string(),kind:z.enum(['finding','task']),finding:z.string(),approved:z.boolean().optional(),title:z.string().trim().max(500).optional(),note:z.string().max(2000).optional(),id:z.string().regex(/^[-a-zA-Z0-9]{8,80}$/),hypothesisId:z.string().optional(),revision:z.string().optional()});
export async function GET(request:Request){try{const owner=await identity();const scenario=new URL(request.url).searchParams.get('scenario');if(!scenarios.some(x=>x.id===scenario))throw Error('INPUT');const data=await database().prepare("SELECT e.id,e.kind,e.body,e.created,d.body AS delivery FROM case_events e LEFT JOIN case_events d ON d.id='teams-'||e.id AND d.owner=e.owner AND d.kind='teams_delivery' WHERE e.owner=? AND e.scenario=? AND e.kind IN ('finding','task') ORDER BY e.created DESC,e.rowid DESC LIMIT 250").bind(owner,scenario).all();return Response.json({events:data.results.reverse().map(({delivery,...x})=>({...x,body:{...JSON.parse(String(x.body)),...(delivery?{teamsDelivery:JSON.parse(String(delivery)).status}:{})}}))});}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 sameOrigin(request);const owner=await identity();const parsed=schema.safeParse(await boundedJson(request,12000));if(!parsed.success)throw Error('INPUT');const input=parsed.data;
 if(input.id.startsWith('teams-')||!scenarios.some(x=>x.id===input.scenario)||!findings.some(x=>x.id===input.finding))throw Error('INPUT');
 const result=analyse(input.scenario as Scenario,input.finding as Finding),h=result.hypotheses.find(h=>h.id===input.hypothesisId);
 if(input.kind==='task'&&(input.approved!==true||!input.title||!h||h.support<40||input.revision!==analysisRevision(result)))throw Error('INPUT');
 const body=input.kind==='finding'?{finding:input.finding,note:input.note||''}:{title:input.title,finding:input.finding,hypothesisId:h!.id,revision:analysisRevision(result),evidence:h!.evidence,status:'approved',destination:'AQUA demo task'};
 const encoded=JSON.stringify(body),created=new Date().toISOString();
 if(input.kind==='task'){
  await database().prepare("INSERT INTO case_events (id,owner,scenario,kind,body,created) SELECT ?,?,?,?,?,? WHERE COALESCE((SELECT json_extract(body,'$.finding') FROM case_events WHERE owner=? AND scenario=? AND kind='finding' ORDER BY created DESC,rowid DESC LIMIT 1),'none')=? ON CONFLICT(id) DO NOTHING").bind(input.id,owner,input.scenario,input.kind,encoded,created,owner,input.scenario,input.finding).run();
 }else{
  await database().prepare('INSERT INTO case_events (id,owner,scenario,kind,body,created) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(input.id,owner,input.scenario,input.kind,encoded,created).run();
 }
 const saved=await database().prepare('SELECT id,kind,body,created FROM case_events WHERE id=? AND owner=? AND scenario=?').bind(input.id,owner,input.scenario).first<{id:string;kind:string;body:string;created:string}>();
 if(!saved)return Response.json({error:'The saved evidence changed. Reload the case and review a fresh inspection before approving.'},{status:409});
 if(saved.kind!==input.kind||saved.body!==encoded)return Response.json({error:'This request ID already belongs to different data. Close the form and review a new draft.'},{status:409});
 return Response.json({ok:true,event:{...saved,body:JSON.parse(saved.body)}});
}catch(e){return failure(e);}}
