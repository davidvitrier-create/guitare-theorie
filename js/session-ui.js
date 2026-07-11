/* ---------------- GABARIT DE SESSION PARTAGE (clavier, focus, avance, signalement) ---------------- */
var pendingAdvanceFn=null;
function registerPendingAdvance(fn){pendingAdvanceFn=fn;}
function clearPendingAdvance(){pendingAdvanceFn=null;}

function visibleAnswerContainer(){
  var candidates=[document.getElementById("notes-answers"),document.getElementById("intervals-answers")];
  for(var i=0;i<candidates.length;i++){
    if(candidates[i]&&candidates[i].offsetParent!==null) return candidates[i];
  }
  return null;
}
function handleGlobalShortcutKey(e){
  if(e.ctrlKey||e.altKey||e.metaKey) return;
  if(e.key==="Enter"){
    if(pendingAdvanceFn){
      var fn=pendingAdvanceFn;
      fn();
      e.preventDefault();
    }
    return;
  }
  if(e.key>="0"&&e.key<="9"){
    var container=visibleAnswerContainer();
    if(!container) return;
    var index=e.key==="0"?9:(parseInt(e.key,10)-1);
    var btn=container.children[index];
    if(btn&&!btn.disabled){
      btn.click();
      e.preventDefault();
    }
  }
}
document.addEventListener("keydown",handleGlobalShortcutKey);

function focusFirstIn(container){
  if(!container) return;
  var btn=container.querySelector("button:not([disabled])");
  if(btn) btn.focus();
}

function wireFlagButton(buttonId,moduleKey,getItemFn){
  var btn=document.getElementById(buttonId);
  if(!btn) return;
  btn.addEventListener("click",function(){
    flagItem(moduleKey,getItemFn());
    btn.disabled=true;
    btn.textContent="Signale";
  });
}
function resetFlagButton(buttonId){
  var btn=document.getElementById(buttonId);
  if(!btn) return;
  btn.disabled=false;
  btn.textContent="Signaler";
}
