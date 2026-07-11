/* ---------------- MODULE NOTES ---------------- */
var noteTab="staff";
var nConfig={range:12,speed:0,total:15};
var nState={idx:0,total:15,score:0,queue:[],statuses:[],missed:[]};
var noteTimerHandle=null;

document.getElementById("tabStaff").addEventListener("click",function(){setNoteTab("staff");});
document.getElementById("tabFret").addEventListener("click",function(){setNoteTab("fret");});
document.getElementById("tabFretRead").addEventListener("click",function(){setNoteTab("fretread");});
wireFlagButton("notesFlagBtn","notes",currentNoteTarget);

document.getElementById("startNotesBtn").addEventListener("click",function(){
  nConfig.range=parseInt(radioValue("notePos"),10);
  nConfig.speed=parseInt(radioValue("noteSpeed"),10);
  nConfig.total=parseInt(radioValue("noteCount"),10);
  document.getElementById("notes-config").classList.add("hidden");
  document.getElementById("notes-quiz").classList.remove("hidden");
  startNotesModule();
});
function notesQuizInProgress(){
  if(document.getElementById("notes-quiz").classList.contains("hidden")) return false;
  return nState.idx>0 && nState.idx<nState.total;
}
function setNoteTab(tab){
  if(notesQuizInProgress()){
    if(!window.confirm("Changer de sous-mode va reinitialiser la session en cours. Continuer ?")) return;
  }
  noteTab=tab;
  document.getElementById("tabStaff").className=tab==="staff"?"active":"";
  document.getElementById("tabFret").className=tab==="fret"?"active":"";
  document.getElementById("tabFretRead").className=tab==="fretread"?"active":"";
  startNotesModule();
}
function startNotesModule(customQueue){
  var pool=fretboardNotesAll.filter(function(n){return n.fret<=nConfig.range;});
  var total=customQueue?customQueue.length:nConfig.total;
  var queue=customQueue?customQueue:buildQueueOfLength(pool,total);
  nState={idx:0,total:total,score:0,queue:queue,statuses:queue.map(function(){return "pending";}),missed:[],responseTimes:[],questionStartedAt:null};
  document.getElementById("notes-results").classList.add("hidden");
  document.getElementById("notes-results").innerHTML="";
  document.getElementById("notes-quiz").classList.remove("hidden");
  document.getElementById("staff-area").classList.toggle("hidden",noteTab!=="staff");
  document.getElementById("fret-area").classList.toggle("hidden",noteTab!=="fret");
  document.getElementById("fretread-area").classList.toggle("hidden",noteTab!=="fretread");
  document.getElementById("notes-answers").classList.remove("hidden");
  renderNoteQuestion();
}
function currentNoteTarget(){return nState.queue[nState.idx];}
function noteId(n){return n.letter+(n.accidental||"")+"-"+n.octave;}
function renderNotesHistoryNote(){
  var el=document.getElementById("notes-history");
  if(!el) return;
  el.innerHTML="";
  var last=lastSessionResult("notes");
  var bank=getMissedBank("notes");
  if(!last && bank.length===0) return;
  if(last){
    var p=document.createElement("p");
    p.textContent="Derniere session : "+last.score+"/"+last.total;
    el.appendChild(p);
  }
  if(bank.length>0){
    var btn=document.createElement("button");
    btn.className="ghost";
    btn.textContent="Reviser mes erreurs ("+bank.length+")";
    btn.addEventListener("click",function(){
      document.getElementById("notes-config").classList.add("hidden");
      document.getElementById("notes-quiz").classList.remove("hidden");
      startNotesModule(bank);
    });
    el.appendChild(btn);
  }
}

function statusColor(status){
  if(status==="correct") return "#3b6d11";
  if(status==="wrong") return "#a32d2d";
  return "#2c2c2a";
}
function renderSequenceStaff(){
  var W=95+nState.total*70;
  var notesArr=nState.queue.map(function(item,i){
    return {letter:item.letter,octave:item.octave,accidental:item.accidental,x:70+i*70,color:statusColor(nState.statuses[i])};
  });
  var s=staffSVG(notesArr,{width:W,heightAttr:true,style:"display:block;",top:-30,height:170,ledgerColor:"#8a8880",stems:true,markIndex:nState.idx});
  document.getElementById("staff-inner").innerHTML=s;
  document.getElementById("tab-inner").innerHTML=buildTabSVG();
  var container=document.querySelector(".staff-scroll");
  if(container){
    var currentX=70+nState.idx*70;
    var target=Math.max(0,currentX-container.clientWidth/2);
    container.scrollLeft=target;
  }
}
function buildTabSVG(){
  var sequence=nState.queue.map(function(item,i){
    return {stringIndex:item.stringIndex,fret:item.fret,shown:nState.statuses[i]!=="pending",color:statusColor(nState.statuses[i])};
  });
  return tabSVG(sequence,{width:95+nState.total*70});
}

function markLetterButtons(target,choice,correct){
  Array.prototype.forEach.call(document.getElementById("notes-answers").children,function(b){
    if(b.textContent===dispName(target.letter,target.accidental)) b.classList.add("ans-correct");
    else if(!correct && choice && b.textContent===dispName(choice.letter,choice.accidental)) b.classList.add("ans-wrong");
  });
}

function renderNoteQuestion(){
  nState.questionStartedAt=performance.now();
  setFeedback("feedback","");
  resetFlagButton("notesFlagBtn");
  document.getElementById("notesScore").textContent="Question "+(nState.idx+1)+"/"+nState.total+" · score "+nState.score;
  updateProgress("notesProgress",nState.idx,nState.total);
  var target=currentNoteTarget();
  var answersC=document.getElementById("notes-answers");
  answersC.innerHTML="";
  if(noteTimerHandle){clearInterval(noteTimerHandle);noteTimerHandle=null;}
  var timerEl=document.getElementById("notesTimer");
  timerEl.textContent="";
  if(noteTab==="staff"){
    document.getElementById("fret-area").innerHTML="";
    document.getElementById("fretread-area").innerHTML="";
    renderSequenceStaff();
    CHROMATIC.forEach(function(entry){
      var b=document.createElement("button");
      b.textContent=dispName(entry.letter,entry.accidental);
      b.addEventListener("click",function(){checkStaffAnswer(entry,target);});
      answersC.appendChild(b);
    });
    focusFirstIn(answersC);
  } else if(noteTab==="fret"){
    document.getElementById("staff-inner").innerHTML="";
    document.getElementById("tab-inner").innerHTML="";
    document.getElementById("fretread-area").innerHTML="";
    var p=document.createElement("p");
    p.style.margin="0 0 0.5rem";
    p.innerHTML="Trouve : <strong>"+dispName(target.letter,target.accidental)+"</strong> (octave "+target.octave+")";
    var fretArea=document.getElementById("fret-area");
    fretArea.innerHTML="";
    fretArea.appendChild(p);
    var scroll=document.createElement("div");
    scroll.className="fret-scroll";
    scroll.appendChild(buildFretTable(target));
    fretArea.appendChild(scroll);
    focusFirstIn(fretArea);
  } else if(noteTab==="fretread"){
    document.getElementById("staff-inner").innerHTML="";
    document.getElementById("tab-inner").innerHTML="";
    document.getElementById("fret-area").innerHTML="";
    var fretreadArea=document.getElementById("fretread-area");
    fretreadArea.innerHTML="";
    var p2=document.createElement("p");
    p2.style.margin="0 0 0.5rem";
    p2.innerHTML="Corde <strong>"+STRINGS[target.stringIndex].label+"</strong>, case <strong>"+target.fret+"</strong> - quelle note ?";
    fretreadArea.appendChild(p2);
    var scroll2=document.createElement("div");
    scroll2.className="fret-scroll";
    scroll2.appendChild(buildFretHighlight(target));
    fretreadArea.appendChild(scroll2);
    CHROMATIC.forEach(function(entry){
      var b=document.createElement("button");
      b.textContent=dispName(entry.letter,entry.accidental);
      b.addEventListener("click",function(){checkStaffAnswer(entry,target);});
      answersC.appendChild(b);
    });
    focusFirstIn(answersC);
  }
  if(nConfig.speed>0){
    var deadline=performance.now()+nConfig.speed;
    noteTimerHandle=setInterval(function(){
      var remain=(deadline-performance.now())/1000;
      if(remain<=0){
        clearInterval(noteTimerHandle);
        noteTimerHandle=null;
        timerEl.textContent="Temps ecoule";
        registerMiss(target,true);
        disableAllAnswerButtons();
        markLetterButtons(target,null,false);
        setFeedback("feedback","Temps ecoule - reponse attendue : "+dispName(target.letter,target.accidental),"bad");
        advanceNote();
      } else {
        timerEl.textContent="Temps restant : "+remain.toFixed(1)+"s";
      }
    },100);
  }
}
function disableAllAnswerButtons(){
  Array.prototype.forEach.call(document.getElementById("notes-answers").children,function(b){b.disabled=true;});
  var allBtns=document.querySelectorAll("#fret-area button");
  Array.prototype.forEach.call(allBtns,function(b){b.disabled=true;});
}
function registerMiss(target,isTimeout){
  nState.missed.push(target);
  nState.statuses[nState.idx]="wrong";
  addToMissedBank("notes",target,noteId);
  nState.responseTimes.push(performance.now()-nState.questionStartedAt);
}
function buildFretTable(target){
  return buildFretboardTable({
    range:nConfig.range,
    cell:function(si,f){
      return {button:true,text:"-",id:"fb-"+si+"-"+f,onClick:function(){checkFretAnswer(si,f);}};
    }
  });
}
function buildFretHighlight(target){
  return buildFretboardTable({
    range:nConfig.range,
    cell:function(si,f){
      if(si===target.stringIndex && f===target.fret){
        return {text:"●",style:{background:"#7a2b2b",color:"#fff",fontWeight:"500"}};
      }
      return {text:""};
    }
  });
}
function checkStaffAnswer(choice,target){
  if(noteTimerHandle){clearInterval(noteTimerHandle);noteTimerHandle=null;}
  nState.responseTimes.push(performance.now()-nState.questionStartedAt);
  var correct=choice.letter===target.letter&&choice.accidental===target.accidental;
  nState.score+=correct?1:0;
  nState.statuses[nState.idx]=correct?"correct":"wrong";
  if(!correct) nState.missed.push(target);
  if(correct) removeFromMissedBank("notes",target,noteId);
  else addToMissedBank("notes",target,noteId);
  if(noteTab==="staff") renderSequenceStaff();
  disableAllAnswerButtons();
  markLetterButtons(target,choice,correct);
  setFeedback("feedback",correct?"Correct":"Reponse attendue : "+dispName(target.letter,target.accidental),correct?"good":"bad");
  advanceNote();
}
function checkFretAnswer(si,f){
  if(noteTimerHandle){clearInterval(noteTimerHandle);noteTimerHandle=null;}
  nState.responseTimes.push(performance.now()-nState.questionStartedAt);
  var target=currentNoteTarget();
  var correct=fretboardNotesAll.some(function(n){return n.stringIndex===si&&n.fret===f&&n.letter===target.letter&&n.accidental===target.accidental&&n.octave===target.octave;});
  var clicked=document.getElementById("fb-"+si+"-"+f);
  if(clicked){clicked.style.background=correct?"#c9e2b0":"#f0b8b8";clicked.style.color=correct?"#2c2c2a":"#7a2b2b";clicked.style.fontWeight="700";}
  if(!correct){
    nState.missed.push(target);
    fretboardNotesAll.filter(function(n){return n.letter===target.letter&&n.accidental===target.accidental&&n.octave===target.octave&&n.fret<=nConfig.range;}).forEach(function(n){
      var el=document.getElementById("fb-"+n.stringIndex+"-"+n.fret);
      if(el){el.style.background="#c9e2b0";el.style.fontWeight="700";}
    });
  }
  nState.score+=correct?1:0;
  if(correct) removeFromMissedBank("notes",target,noteId);
  else addToMissedBank("notes",target,noteId);
  setFeedback("feedback",correct?"Correct":"Position(s) correcte(s) surlignee(s)",correct?"good":"bad");
  disableAllAnswerButtons();
  advanceNote();
}
function advanceNote(){
  var handle=setTimeout(runAdvanceNote,850);
  registerPendingAdvance(function(){clearTimeout(handle);runAdvanceNote();});
}
function runAdvanceNote(){
  clearPendingAdvance();
  nState.idx++;
  if(nState.idx>=nState.total){showNotesResults();}
  else renderNoteQuestion();
}
function showNotesResults(){
  if(noteTimerHandle){clearInterval(noteTimerHandle);noteTimerHandle=null;}
  document.getElementById("notes-quiz").classList.add("hidden");
  recordSessionResult("notes",nState.score,nState.total,nState.responseTimes);
  var pct=Math.round(100*nState.score/nState.total);
  var res=document.getElementById("notes-results");
  res.classList.remove("hidden");
  res.innerHTML='<div class="metrics"><div class="metric"><div class="num">'+nState.score+"/"+nState.total+'</div><div class="lbl">score</div></div><div class="metric"><div class="num">'+pct+'%</div><div class="lbl">reussite</div></div></div>';
  if(nState.missed.length>0){
    var uniq=[];
    nState.missed.forEach(function(m){
      var name=dispName(m.letter,m.accidental)+" ("+m.octave+")";
      if(uniq.indexOf(name)===-1) uniq.push(name);
    });
    var mDiv=document.createElement("div");
    mDiv.className="missed-list";
    mDiv.textContent="Notes ratees : "+uniq.join(", ");
    res.appendChild(mDiv);
  }
  var row=document.createElement("div");
  row.className="row";
  row.style.marginTop="1.25rem";
  var again=document.createElement("button");
  again.className="primary";
  again.textContent="Recommencer";
  again.addEventListener("click",function(){startNotesModule();});
  row.appendChild(again);
  var bank=getMissedBank("notes");
  if(bank.length>0){
    var replay=document.createElement("button");
    replay.textContent="Rejouer mes erreurs ("+bank.length+")";
    replay.addEventListener("click",function(){startNotesModule(bank);});
    row.appendChild(replay);
  }
  var menu=document.createElement("button");
  menu.className="ghost";
  menu.textContent="Menu";
  menu.addEventListener("click",backToHome);
  row.appendChild(menu);
  res.appendChild(row);
  again.focus();
}
