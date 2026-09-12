export const scenarios = [
  {id:'suction',label:'Suction restriction',subtitle:'Falling inlet pressure · rising broadband energy'},
  {id:'bearing',label:'Bearing deterioration',subtitle:'Impulsive vibration · gradual heating'},
  {id:'alignment',label:'Post-maintenance misalignment',subtitle:'Strong 2× signature · recent coupling work'},
  {id:'healthy',label:'Healthy operation',subtitle:'Stable process · normal vibration'},
  {id:'sensor',label:'Sensor fault',subtitle:'Flat-lined channel · conflicting observations'},
] as const;
export type Scenario = typeof scenarios[number]['id'];
export type Finding = 'none'|'restriction'|'clear'|'alignment'|'loose-sensor';
export const findings: {id:Finding,label:string,description:string}[]=[
  {id:'none',label:'No new inspection',description:'Use the available process and vibration evidence.'},
  {id:'restriction',label:'Strainer restriction observed',description:'Engineer reports debris and elevated differential pressure across the suction strainer.'},
  {id:'clear',label:'Suction path checked clear',description:'Engineer reports normal strainer differential pressure and no visible restriction.'},
  {id:'alignment',label:'Alignment outside tolerance',description:'Engineer reports laser alignment outside the demo maintenance tolerance.'},
  {id:'loose-sensor',label:'Sensor mounting found loose',description:'Engineer reports loose vibration sensor mounting; readings need re-acquisition.'},
];
export type Sample={hour:number,time:string,flow:number,suction:number,discharge:number,power:number,temp:number,vibration:number|null};
export type SpectrumPoint={hz:number,amplitude:number};
export function fft(signal:number[],sampleRate:number):SpectrumPoint[]{
  const n=signal.length;if(n<2||(n&(n-1)))throw Error('FFT requires a power-of-two sample length');
  const mean=signal.reduce((a,b)=>a+b,0)/n;const re=signal.map((x,i)=>(x-mean)*(.5-.5*Math.cos(2*Math.PI*i/(n-1))));const im=new Array(n).fill(0);
  for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];}}
  for(let len=2;len<=n;len<<=1){const angle=-2*Math.PI/len;for(let i=0;i<n;i+=len){for(let j=0;j<len/2;j++){const c=Math.cos(angle*j),s=Math.sin(angle*j),k=i+j+len/2;const r=re[k]*c-im[k]*s,v=re[k]*s+im[k]*c;re[k]=re[i+j]-r;im[k]=im[i+j]-v;re[i+j]+=r;im[i+j]+=v;}}}
  return Array.from({length:n/2},(_,k)=>({hz:k*sampleRate/n,amplitude:Math.hypot(re[k],im[k])*4/(n-1)}));
}
function random(seed:number){let x=seed;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
export function waveform(scenario:Scenario){
  const rand=random(137),fs=2048,n=2048;
  const samples=Array.from({length:n},(_,i)=>{const t=i/fs,noise=(rand()-.5)*2;
    if(scenario==='sensor')return 0;
    const base=1.45*Math.sin(2*Math.PI*25*t)+.22*Math.sin(2*Math.PI*50*t)+.2*noise;
    if(scenario==='suction')return base+6*noise+.9*Math.sin(2*Math.PI*150*t);
    if(scenario==='alignment')return base+4.8*Math.sin(2*Math.PI*50*t)+1.5*Math.sin(2*Math.PI*25*t);
    if(scenario==='bearing'){const phase=(t*113)%1;return base+8*Math.exp(-phase*16)*Math.sin(2*Math.PI*670*t)+.8*noise;}
    return base;
  });
  const rms=Math.sqrt(samples.reduce((a,x)=>a+x*x,0)/n),peak=Math.max(...samples.map(Math.abs));
  const spectrum=fft(samples,fs);const band=(lo:number,hi:number)=>spectrum.filter(x=>x.hz>=lo&&x.hz<=hi).reduce((a,x)=>a+x.amplitude*x.amplitude,0);
  return {samples,fs,spectrum,rms,crest:rms?peak/rms:0,kurtosis:rms?samples.reduce((a,x)=>a+x**4,0)/n/rms**4:0,twoX:Math.max(...spectrum.filter(x=>x.hz>=49&&x.hz<=51).map(x=>x.amplitude)),highBand:band(300,900),totalBand:band(1,1000)};
}
export function telemetry(scenario:Scenario):Sample[]{
  const r=random(82),endRms=waveform(scenario).rms,referenceRms=waveform('healthy').rms;return Array.from({length:73},(_,i)=>{const p=Math.max(0,(i-30)/42),noise=(r()-.5),s=scenario==='suction',b=scenario==='bearing',a=scenario==='alignment',sensor=scenario==='sensor';
    const flow=480+5*Math.sin(i/4)+noise*3-(s?65*p:0),suction=1.1+noise*.025-(s?.82*p:0),discharge=6.5+noise*.03-(s?.65*p:0),power=91+noise-(s?4*p:0)+(a?8*p:0),temp=54+noise*.7+(b?18*p:0)+(a?8*p:0);
    return {hour:i,time:`${String(Math.floor((i+12)%24)).padStart(2,'0')}:00`,flow,suction,discharge,power,temp,vibration:sensor&&i>49?null:referenceRms+(endRms-referenceRms)*p+noise*.06*(1-p)};
  });
}
export type Evidence={id:string,source:string,title:string,detail:string,quality:string};
export type Hypothesis={id:string,title:string,support:number,effect:string,reason:string,against:string,check:string,evidence:string[],severity:number,occurrence:number,detection:number};
export function analyse(scenario:Scenario,finding:Finding='none'){
  const trend=telemetry(scenario),now=trend.at(-1)!,base=trend[24],wave=waveform(scenario),quality=now.vibration===null||finding==='loose-sensor';
  const drop=base.suction-now.suction,ratio=wave.highBand/Math.max(wave.totalBand,.001);
  const evidence:Evidence[]=[
    {id:'SC-01',source:'SCADA · simulated',title:'Suction pressure trend',detail:`Pressure fell ${drop.toFixed(2)} bar from the reference period to ${now.suction.toFixed(2)} bar(g). Speed is fixed at 1,500 rpm.`,quality:'Hourly samples · pressure at suction flange'},
    {id:'SC-02',source:'SCADA · simulated',title:'Flow, load and temperature',detail:`Flow ${now.flow.toFixed(0)} m³/h; electrical input ${now.power.toFixed(1)} kW; bearing temperature ${now.temp.toFixed(1)} °C. Reference temperature ${base.temp.toFixed(1)} °C.`,quality:'Matched speed · reference hour 24'},
    {id:'VB-01',source:'Vibration · simulated',title:'Drive-end radial waveform',detail:quality?'Vibration evidence is unreliable. Channel is missing or mounting is reported loose; do not diagnose mechanical condition from this signal.':`Velocity RMS ${wave.rms.toFixed(2)} mm/s; crest factor ${wave.crest.toFixed(2)}; kurtosis ${wave.kurtosis.toFixed(2)}. One-second sample, 2,048 Hz.`,quality:quality?'Invalid / investigate sensor':'Generated velocity waveform · no sensor noise calibration'},
    {id:'VB-02',source:'Vibration · calculated',title:'Frequency signature',detail:`Hann-window FFT: 2× (50 Hz) peak ${wave.twoX.toFixed(2)} mm/s peak. Energy above 300 Hz represents ${(ratio*100).toFixed(0)}% of the 1–1,000 Hz spectral sum.`,quality:'1 Hz resolution · relative spectral energy'},
    {id:'MX-01',source:'Maximo-style · simulated',title:'Most recent maintenance record',detail:scenario==='alignment'?'WO-2048 · 11 Sep: coupling replaced. Laser alignment report was not attached. Return-to-service checklist signed.':'WO-2031 · 28 Aug: lubrication check completed. No bearing replacement recorded. Suction strainer inspection is due.',quality:'Fictional work order · no live Maximo connection'},
  ];
  if(finding!=='none')evidence.push({id:'IN-01',source:'Engineer input · demo',title:findings.find(f=>f.id===finding)!.label,detail:findings.find(f=>f.id===finding)!.description,quality:'Reported observation · independently verify'});
  const hypotheses:Hypothesis[]=[
    {id:'suction',title:'Suction restriction / cavitation risk',support:quality?15:Math.min(95,15+(drop>.4?40:0)+(ratio>.35?25:0)+(finding==='restriction'?15:0)-(finding==='clear'?35:0)),effect:'Unstable delivery, impeller erosion and loss of hydraulic performance.',reason:'A falling suction pressure with elevated broadband vibration supports a hydraulic disturbance.',against:finding==='clear'?'The reported clear suction path conflicts with restriction. Check aeration and pressure measurement.':'NPSH available, vapour pressure and OEM NPSH required are not established; cavitation is not confirmed.',check:finding==='clear'?'Validate the pressure instrument and check for air ingress; obtain water temperature, elevation and OEM NPSHr to assess suction margin.':'Inspect the suction strainer and validate flange pressure; obtain water temperature, elevation and OEM NPSHr.',evidence:['SC-01','VB-02','SC-02',...(finding==='restriction'||finding==='clear'?['IN-01']:[])],severity:8,occurrence:5,detection:4},
    {id:'bearing',title:'Bearing distress',support:quality?10:Math.min(90,10+(now.temp-base.temp>12?35:0)+(wave.kurtosis>3.8?25:0)+(ratio>.4?10:0)),effect:'Progressive bearing damage, heat and unplanned loss of service.',reason:'Temperature growth and impulsive high-frequency vibration can support bearing distress.',against:'Bearing geometry, acceleration envelope and phase data are missing. A race-specific defect cannot be assigned.',check:'Acquire acceleration and envelope spectra, confirm bearing geometry, lubrication and repeat at matched load.',evidence:['SC-02','VB-01','VB-02','MX-01'],severity:9,occurrence:4,detection:5},
    {id:'alignment',title:'Coupling misalignment',support:quality?10:Math.min(95,10+(wave.twoX>2?50:0)+(scenario==='alignment'?15:0)+(finding==='alignment'?20:0)),effect:'Elevated shaft loading and accelerated seal or bearing wear.',reason:'Strong 2× vibration following coupling work supports an alignment investigation.',against:'Radial 2× alone is not diagnostic; axial vibration, phase and laser alignment are needed.',check:'Review the alignment report; collect axial/phase data and verify cold alignment and thermal growth.',evidence:['VB-02','MX-01',...(finding==='alignment'?['IN-01']:[])],severity:7,occurrence:4,detection:4},
    {id:'sensor',title:'Measurement integrity issue',support:quality?95:5,effect:'Misleading alarms or a missed developing fault.',reason:'A missing/flat channel or loose mounting invalidates condition conclusions.',against:quality?'Independent vibration measurement is needed; a sensor issue does not prove the pump is healthy.':'The available channel is coherent; no current evidence of a sensor fault.',check:'Inspect mounting, cable and acquisition chain; repeat with a calibrated portable instrument.',evidence:['VB-01',...(finding==='loose-sensor'?['IN-01']:[])],severity:6,occurrence:3,detection:3},
  ].map(h=>({...h,support:Math.max(0,h.support)})).sort((a,b)=>b.support-a.support);
  const active=hypotheses[0].support>=40;
  const efficiency=now.flow/3600*(now.discharge-now.suction)*100000/(now.power*1000)*100;
  return {now,base,trend,wave,evidence,hypotheses,active,quality,efficiency,head:(now.discharge-now.suction)*100000/(998*9.81),headline:quality?'Validate the measurement before diagnosis':active?hypotheses[0].title:'No strong fault evidence in this window',finding};
}
export function guidedReply(question:string,result:ReturnType<typeof analyse>){
  const q=question.toLowerCase(),h=result.hypotheses[0];
  if(/life|rul|replace|remaining|cost|efficien/.test(q))return `Wire-to-water efficiency is ${result.efficiency.toFixed(1)}%, calculated from flow, flange pressure difference and electrical input [SC-01, SC-02]. This approximation ignores elevation and velocity-head differences. Remaining useful life is not modelled: synthetic observations cannot establish a failure-time distribution. Use Lifecycle to compare energy and maintenance history; collect run-to-failure or censored asset histories before training RUL.`;
  if(/fmea|risk|priority/.test(q))return `The FMEA register separates failure mode, effect, checks and evidence. ${result.active?h.title:'No fault hypothesis'} currently leads. S/O/D values are illustrative engineering ratings, not probabilities. Review them against your utility's consequence and detection scales before using RPN for work prioritisation.`;
  if(/next|check|inspect|action|work order|task/.test(q)&&!result.active)return 'No strong fault evidence is present. Preserve the matched-load baseline, continue routine lubrication checks and repeat the waveform if operating conditions change. No corrective work is justified by these synthetic observations alone.';
  if(/next|check|inspect|action|work order|task/.test(q))return `Next check: ${h.check} Evidence: ${h.evidence.join(', ')}. Add a reported inspection using “Add evidence” to revise the ranking. “Create inspection” opens an approval step and saves an AQUA demo task; it does not issue a Maximo work order.`;
  if(/why|root|cause|investig|analyse|analyze|happen|evidence|vibrat|pump|cavitat|bearing|align/.test(q))return `${result.headline}. ${result.active?h.reason:'The current process and waveform are consistent with the synthetic healthy reference.'}\n\nEvidence reviewed: ${h.evidence.join(', ')}. ${result.evidence.find(e=>e.id===h.evidence[0])!.detail}\n\nWhat remains uncertain: ${h.against}\n\nNext discriminating check: ${h.check}\n\nThis is a ranked hypothesis, not a confirmed root cause.`;
  return 'I can guide four investigations with the current evidence: “Why is vibration rising?”, “What should I inspect next?”, “Explain the FMEA”, or “Can we estimate remaining life?”. Free-form AI conversation becomes available when OpenRouter is connected. Your question has not changed any asset or task.';
}
