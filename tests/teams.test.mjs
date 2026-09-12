import test from 'node:test';
import assert from 'node:assert/strict';
import {mayNotifyTeams,inspectionCard} from '../lib/teams.ts';
test('personal Teams destination is unavailable to unconfigured or different users',()=>{
 assert.equal(mayNotifyTeams('owner@example.com','owner@example.com','https://example.com'),true);
 for(const args of [[undefined,'owner@example.com','url'],['other@example.com','owner@example.com','url'],['owner@example.com',undefined,'url'],['owner@example.com','owner@example.com',undefined]])assert.equal(mayNotifyTeams(...args),false);
});
test('Teams cards require an approved persisted task and contain no approval action',()=>{
 const t={id:'demo-task-001',kind:'task',created:'2026-09-12T11:00:00Z',body:{status:'approved',title:'Validate the pressure reading.',revision:'aqua-v2-demo',evidence:['SC-01']}};
 const card=inspectionCard(t).attachments[0].content;assert.equal(card.actions.length,1);assert.equal(card.actions[0].type,'Action.OpenUrl');assert.ok(JSON.stringify(card).includes(t.id));assert.ok(JSON.stringify(card).includes('Synthetic'));
 assert.throws(()=>inspectionCard({...t,kind:'finding'}),/APPROVED_TASK_REQUIRED/);assert.throws(()=>inspectionCard({...t,body:{...t.body,status:'draft'}}),/APPROVED_TASK_REQUIRED/);
});
