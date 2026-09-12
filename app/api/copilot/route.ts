import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { analyse, guidedReply, scenarios, findings, type Scenario, type Finding } from '@/lib/pump';
import { agentTools, runEvidenceAgent, type ModelReply } from '@/lib/agent';
import { identity, sameOrigin, failure, boundedJson } from '@/lib/server';
type Settings={OPENROUTER_API_KEY?:string;OPENROUTER_MODEL?:string};
const inputSchema=z.object({scenario:z.string(),finding:z.string(),question:z.string().trim().min(1).max(2000),history:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().max(5000)})).max(40).optional()});
export async function GET(){const settings=env as Settings;return Response.json({mode:settings.OPENROUTER_API_KEY?'agent-ready':'guided',provider:settings.OPENROUTER_API_KEY?'configured':'not-connected',hermes:'not-connected',ambiguous:'not-connected',maximo:'simulated'});}
export async function POST(request:Request){try{
 sameOrigin(request);const parsed=inputSchema.safeParse(await boundedJson(request,30000));if(!parsed.success)throw Error('INPUT');const body=parsed.data;
 if(!scenarios.some(s=>s.id===body.scenario)||!findings.some(f=>f.id===body.finding))throw Error('INPUT');
 const result=analyse(body.scenario as Scenario,body.finding as Finding),settings=env as Settings;
 if(!settings.OPENROUTER_API_KEY)return Response.json({mode:'guided',reply:guidedReply(body.question,result),trace:[],proposal:null});
 await identity();const signal=AbortSignal.timeout(55000);
 const answer=await runEvidenceAgent({result,question:body.question,history:(body.history||[]).slice(-8),complete:async(messages,round)=>{
  const response=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${settings.OPENROUTER_API_KEY}`,'Content-Type':'application/json','X-OpenRouter-Title':'AQUA Pump Reliability'},body:JSON.stringify({model:settings.OPENROUTER_MODEL||'google/gemini-3-flash-preview',provider:{require_parameters:true},max_tokens:1000,temperature:.2,messages,tools:agentTools,tool_choice:round===0?'required':'auto'}),signal});
  if(!response.ok){console.warn('AQUA provider HTTP status',response.status);throw Error('PROVIDER');}const data=await response.json() as {choices?:{message?:ModelReply}[]};if(!data.choices?.[0]?.message)throw Error('MODEL');return data.choices[0].message;
 }});return Response.json({mode:'agent',...answer});
}catch(e){const m=e instanceof Error?e.message:'';console.warn('AQUA agent failed',e instanceof Error?e.name:'Unknown', ['PROVIDER','MODEL','MODEL_NO_EVIDENCE','MODEL_CITATION','AGENT_LIMIT'].includes(m)?m:'request failure');if(['PROVIDER','MODEL','MODEL_NO_EVIDENCE','MODEL_CITATION','AGENT_LIMIT'].includes(m)||e instanceof Error&&e.name==='TimeoutError')return Response.json({error:'The agent could not complete a verified answer. Your question is retained; retry or use the evidence panels. No task was saved.'},{status:502});return failure(e);}}
