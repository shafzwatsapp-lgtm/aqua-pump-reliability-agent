import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database,sameOrigin,boundedJson,failure} from '@/lib/server';
import {inspectionCard,mayNotifyTeams} from '@/lib/teams';
type Settings={AQUA_TEAMS_WEBHOOK_URL?:string;AQUA_TEAMS_ALLOWED_EMAIL?:string};
export async function GET(){const user=await getChatGPTUser(),settings=env as Settings;return Response.json({enabled:mayNotifyTeams(user?.email,settings.AQUA_TEAMS_ALLOWED_EMAIL,settings.AQUA_TEAMS_WEBHOOK_URL),destination:'Your personal Teams demo chat'});}
export async function POST(request:Request){try{
  sameOrigin(request);const user=await getChatGPTUser(),settings=env as Settings;
  if(!user)throw Error('SIGN_IN');
  if(!mayNotifyTeams(user.email,settings.AQUA_TEAMS_ALLOWED_EMAIL,settings.AQUA_TEAMS_WEBHOOK_URL))return Response.json({error:'Teams notifications are not configured for this signed-in account.'},{status:403});
  const input=await boundedJson(request,1000) as {id?:unknown};if(!input||typeof input.id!=='string'||!/^[-a-zA-Z0-9]{8,80}$/.test(input.id)||Object.keys(input).length!==1)throw Error('INPUT');
  const task=await database().prepare("SELECT id,kind,body,created,scenario FROM case_events WHERE id=? AND owner=? AND kind='task'").bind(input.id,user.userId).first<{id:string;kind:string;body:string;created:string;scenario:string}>();
  if(!task)return Response.json({error:'Approved task not found in your case history.'},{status:404});
  const body=JSON.parse(task.body),card=inspectionCard({...task,body}),deliveryId='teams-'+task.id;
  const current=await database().prepare("SELECT json_extract(body,'$.finding') AS finding FROM case_events WHERE owner=? AND scenario=? AND kind='finding' ORDER BY created DESC,rowid DESC LIMIT 1").bind(user.userId,task.scenario).first<{finding:string}>();
  if(body.finding!==(current?.finding??'none'))return Response.json({error:'Evidence changed after this task was approved. Review and approve a fresh inspection before sending it to Teams.'},{status:409});
  const claim=await database().prepare("INSERT INTO case_events (id,owner,scenario,kind,body,created) VALUES (?,?,?,'teams_delivery',?,?) ON CONFLICT(id) DO NOTHING").bind(deliveryId,user.userId,task.scenario,JSON.stringify({taskId:task.id,status:'pending'}),new Date().toISOString()).run();
  if(!claim.meta.changes){const previous=await database().prepare("SELECT body FROM case_events WHERE id=? AND owner=? AND kind='teams_delivery'").bind(deliveryId,user.userId).first<{body:string}>();const status=previous?JSON.parse(previous.body).status:'unknown';return Response.json({status,message:'A notification was already attempted. Check Teams or the workflow run history; it was not sent again.'});}
  let status='unknown';
  try{const response=await fetch(settings.AQUA_TEAMS_WEBHOOK_URL!,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(card),redirect:'manual',signal:AbortSignal.timeout(15000)});status=response.ok?'accepted':'failed';void response.body?.cancel().catch(()=>{});}catch(error){status='unknown';console.warn('Teams request could not be confirmed',error instanceof Error?error.name+': '+error.message.replaceAll(settings.AQUA_TEAMS_WEBHOOK_URL!,'[redacted]').replace(/https?:\/\/\S+/g,'[redacted]'):'UnknownError');}
  await database().prepare('UPDATE case_events SET body=? WHERE id=? AND owner=?').bind(JSON.stringify({taskId:task.id,status,attemptedAt:new Date().toISOString()}),deliveryId,user.userId).run();
  return Response.json({status,message:status==='accepted'?'Teams workflow accepted the inspection notification. Check your personal Teams chat.':status==='failed'?'The Teams workflow rejected the notification. Your approved AQUA task is still saved.':'Delivery could not be confirmed. Check Teams before retrying; AQUA will not automatically send a duplicate.'});
}catch(error){return failure(error);}}
