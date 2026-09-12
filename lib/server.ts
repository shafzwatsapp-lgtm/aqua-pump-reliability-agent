import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export async function identity(){const user=await getChatGPTUser();if(!user)throw new Error('SIGN_IN');return user.userId;}
export function database(){if(!env.DB)throw new Error('STORAGE');return env.DB;}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new Error('ORIGIN');}
export function failure(error:unknown){const m=error instanceof Error?error.message:'';return Response.json({error:m==='SIGN_IN'?'Sign in to save investigations.':m==='ORIGIN'?'Request origin rejected.':m==='INPUT'?'Check the submitted fields.':'The service is unavailable. Your input has been kept; please try again.'},{status:m==='SIGN_IN'?401:m==='ORIGIN'?403:m==='INPUT'?400:503});}
