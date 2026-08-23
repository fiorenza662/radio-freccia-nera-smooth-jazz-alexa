'use strict';
const Alexa=require('ask-sdk-core');
const https=require('https');
const STREAM='https://radio.radiofreccianera.com/listen/smooth_jazz/radio128.mp3';
const NOW='https://radio.radiofreccianera.com/api/nowplaying/smooth_jazz';
const LOGO='https://www.radiofreccianera.com/wp-content/themes/radio-freccia-nera-thematic-network-en-v2.2/assets/img/cards-pro/smooth-jazz.png';
const isIT=h=>(Alexa.getLocale(h.requestEnvelope)||'en-GB').toLowerCase().startsWith('it');
const clean=v=>typeof v==='string'?v.trim():'';
function splitText(text){const t=clean(text);const p=t.indexOf(' - ');if(p>0)return{artist:t.slice(0,p).trim(),title:t.slice(p+3).trim()};return{artist:'',title:t};}
function getNow(){return new Promise(resolve=>{let done=false;const finish=v=>{if(!done){done=true;resolve(v)}};const req=https.get(NOW,{headers:{'User-Agent':'RFN-Alexa/1.1'}},res=>{let body='';res.setEncoding('utf8');res.on('data',c=>body+=c);res.on('end',()=>{if(res.statusCode<200||res.statusCode>=300)return finish(null);try{finish(JSON.parse(body))}catch(e){finish(null)}})});req.setTimeout(1500,()=>{req.destroy();finish(null)});req.on('error',()=>finish(null));});}
async function meta(){const d=await getNow();const s=d&&d.now_playing&&d.now_playing.song;if(!s)return{title:'Radio Freccia Nera Smooth Jazz',subtitle:'Radio Freccia Nera',art:LOGO};const parsed=splitText(s.text);const title=clean(s.title)||parsed.title||'Radio Freccia Nera Smooth Jazz';const artist=clean(s.artist)||parsed.artist||'Radio Freccia Nera';const art=clean(s.art)||LOGO;return{title,subtitle:artist,art};}
function streamDirective(tokenPrefix,m){m=m||{title:'Radio Freccia Nera Smooth Jazz',subtitle:'Radio Freccia Nera',art:LOGO};return{type:'AudioPlayer.Play',playBehavior:'REPLACE_ALL',audioItem:{stream:{url:STREAM,token:tokenPrefix+'-'+Date.now(),offsetInMilliseconds:0},metadata:{title:m.title,subtitle:m.subtitle,art:{sources:[{url:m.art}]},backgroundImage:{sources:[{url:m.art}]}}}};}
async function play(h){const m=await meta();return h.responseBuilder.speak('Radio Freccia Nera Smooth Jazz.').addDirective(streamDirective('rfn-smooth-jazz',m)).withShouldEndSession(true).getResponse();}
async function recover(h){const m=await meta();return h.responseBuilder.addDirective(streamDirective('rfn-smooth-jazz-recover',m)).getResponse();}
const Launch={canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='LaunchRequest',handle:play};
const Play={canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='IntentRequest'&&['PlayRadioIntent','AMAZON.ResumeIntent'].includes(Alexa.getIntentName(h.requestEnvelope)),handle:play};
const Stop={canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='IntentRequest'&&['AMAZON.StopIntent','AMAZON.CancelIntent','AMAZON.PauseIntent'].includes(Alexa.getIntentName(h.requestEnvelope)),handle:h=>h.responseBuilder.addAudioPlayerStopDirective().withShouldEndSession(true).getResponse()};
const Help={canHandle:h=>Alexa.getRequestType(h.requestEnvelope)==='IntentRequest'&&['AMAZON.HelpIntent','AMAZON.FallbackIntent'].includes(Alexa.getIntentName(h.requestEnvelope)),handle:h=>h.responseBuilder.speak(isIT(h)?"Di': Alexa, apri Freccia Nera Smooth Jazz.":'Say: Alexa, open Black Arrow Jazz.').getResponse()};
const Recover={canHandle:h=>['AudioPlayer.PlaybackFailed','AudioPlayer.PlaybackFinished'].includes(Alexa.getRequestType(h.requestEnvelope)),handle:recover};
const Audio={canHandle:h=>Alexa.getRequestType(h.requestEnvelope).startsWith('AudioPlayer.'),handle:h=>h.responseBuilder.getResponse()};
const End={canHandle:h=>['SessionEndedRequest','System.ExceptionEncountered'].includes(Alexa.getRequestType(h.requestEnvelope)),handle:h=>h.responseBuilder.getResponse()};
const Err={canHandle:()=>true,handle:(h,e)=>{console.error(e);return h.responseBuilder.speak(isIT(h)?'Si è verificato un problema.':'There was a problem.').getResponse();}};
exports.handler=Alexa.SkillBuilders.custom().addRequestHandlers(Launch,Play,Stop,Help,Recover,Audio,End).addErrorHandlers(Err).lambda();
