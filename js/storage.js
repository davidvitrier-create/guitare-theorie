/* ---------------- PERSISTANCE LOCALE (historique de score, erreurs a reviser) ---------------- */
var STORAGE_KEY="guitare-theorie:v1";

function defaultAppState(){
  return {
    notes:{history:[],missedBank:[]},
    intervals:{history:[],missedBank:[]}
  };
}
function loadAppState(){
  var state=defaultAppState();
  try{
    var raw=localStorage.getItem(STORAGE_KEY);
    if(raw){
      var parsed=JSON.parse(raw);
      if(parsed.notes){
        state.notes.history=parsed.notes.history||[];
        state.notes.missedBank=parsed.notes.missedBank||[];
      }
      if(parsed.intervals){
        state.intervals.history=parsed.intervals.history||[];
        state.intervals.missedBank=parsed.intervals.missedBank||[];
      }
    }
  }catch(e){}
  return state;
}
var APP_STATE=loadAppState();
function saveAppState(){
  try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(APP_STATE)); }catch(e){}
}
function recordSessionResult(moduleKey,score,total,responseTimesMs){
  var h=APP_STATE[moduleKey].history;
  var avgMs=null;
  if(responseTimesMs&&responseTimesMs.length){
    var sum=responseTimesMs.reduce(function(a,b){return a+b;},0);
    avgMs=Math.round(sum/responseTimesMs.length);
  }
  h.push({date:new Date().toISOString(),score:score,total:total,avgMs:avgMs});
  if(h.length>20) h.shift();
  saveAppState();
}
function lastSessionResult(moduleKey){
  var h=APP_STATE[moduleKey].history;
  return h.length?h[h.length-1]:null;
}
function addToMissedBank(moduleKey,item,idFn){
  var bank=APP_STATE[moduleKey].missedBank;
  var id=idFn(item);
  var exists=bank.some(function(b){return idFn(b)===id;});
  if(!exists) bank.push(item);
  saveAppState();
}
function removeFromMissedBank(moduleKey,item,idFn){
  var id=idFn(item);
  APP_STATE[moduleKey].missedBank=APP_STATE[moduleKey].missedBank.filter(function(b){return idFn(b)!==id;});
  saveAppState();
}
function getMissedBank(moduleKey){
  return APP_STATE[moduleKey].missedBank.slice();
}
