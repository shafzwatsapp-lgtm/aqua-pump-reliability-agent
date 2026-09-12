export type TeamsTask = {id:string;kind:string;created:string;body:{title?:string;status?:string;revision?:string;evidence?:string[]}};
export function mayNotifyTeams(email:string|undefined,allowed:string|undefined,webhook:string|undefined){
  return !!email&&!!allowed&&!!webhook&&email.toLowerCase()===allowed.toLowerCase();
}
export function inspectionCard(task:TeamsTask){
  if(task.kind!=='task'||task.body.status!=='approved'||!task.body.title||!task.body.revision||!task.body.evidence?.length)throw Error('APPROVED_TASK_REQUIRED');
  return {type:'message',attachments:[{contentType:'application/vnd.microsoft.card.adaptive',contentUrl:null,content:{
    $schema:'http://adaptivecards.io/schemas/adaptive-card.json',type:'AdaptiveCard',version:'1.4',body:[
      {type:'TextBlock',text:'AQUA / Approved inspection',weight:'Bolder',size:'Large',wrap:true},
      {type:'TextBlock',text:'P-101 · Synthetic demonstration · No plant controls',wrap:true,isSubtle:true},
      {type:'TextBlock',text:task.body.title,wrap:true},
      {type:'FactSet',facts:[{title:'Task ID',value:task.id},{title:'Evidence revision',value:task.body.revision},{title:'Evidence',value:task.body.evidence.join(', ')},{title:'Saved at',value:task.created}]},
      {type:'TextBlock',text:'Approved and saved in AQUA. This notification does not create a Maximo work order or grant access to the private case. Sign in with your AQUA account to review it.',wrap:true,isSubtle:true},
    ],actions:[{type:'Action.OpenUrl',title:'Open AQUA',url:'https://aqua-pump-command-shafi.shafz.chatgpt.site/desk'}]
  }}]};
}
