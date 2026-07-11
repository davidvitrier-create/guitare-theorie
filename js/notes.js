/* ---------------- MODULE NOTES ---------------- */
var noteTab="staff";
var nConfig={range:12,speed:0,total:15};
var nState={idx:0,total:15,score:0,queue:[],statuses:[],missed:[]};
var noteTimerHandle=null;

document.getElementById("tabStaff").addEventListener("click",function(){setNoteTab("staff");});
document.getElementById("tabFret").addEventListener("click",function(){setNoteTab("fret");});
document.getElementById("tabFretRead").addEventListener("click",function(){setNoteTab("fretread");});

document.getElementById("startNotesBtn").addEventListener("click",function(){
  nConfig.range=parseInt(radioValue("notePos"),10);
  nConfig.speed=parseInt(radioValue("noteSpeed"),10);
  nConfig.total=parseInt(radioValue("noteCount"),10);
  document.getElementById("notes-config").classList.add("hidden");
  document.getElementById("notes-quiz").classList.remove("hidden");
  startNotesModule();
});
function setNoteTab(tab){
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
  nState={idx:0,total:total,score:0,queue:queue,statuses:queue.map(function(){return "pending";}),missed:[]};
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
function noteId(n){return n.letter+"-"+n.octave;}
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
  var top=-30, W=95+nState.total*70, height=170;
  var s='<svg viewBox="0 '+top+' '+W+' '+height+'" width="'+W+'" height="'+height+'" style="display:block;">';
  [20,30,40,50,60].forEach(function(ly){
    s+='<line x1="15" y1="'+ly+'" x2="'+(W-15)+'" y2="'+ly+'" stroke="#8a8880" stroke-width="1"></line>';
  });
  s+='<text x="16" y="60" font-size="46" fill="#2c2c2a">G</text>';
  nState.queue.forEach(function(item,i){
    var x=70+i*70;
    var step=stepOf(item.letter,item.octave);
    var y=noteY(step);
    var color=statusColor(nState.statuses[i]);
    ledgerSteps(step).forEach(function(ls){
      var ly=noteY(ls);
      s+='<line x1="'+(x-13)+'" y1="'+ly+'" x2="'+(x+13)+'" y2="'+ly+'" stroke="#8a8880" stroke-width="1.2"></line>';
    });
    var stemUp=step<34;
    if(stemUp){
      s+='<line x1="'+(x+7)+'" y1="'+y+'" x2="'+(x+7)+'" y2="'+(y-20)+'" stroke="'+color+'" stroke-width="1.3"></line>';
    } else {
      s+='<line x1="'+(x-7)+'" y1="'+y+'" x2="'+(x-7)+'" y2="'+(y+20)+'" stroke="'+color+'" stroke-width="1.3"></line>';
    }
    s+='<ellipse cx="'+x+'" cy="'+y+'" rx="7.5" ry="5.8" fill="'+color+'" transform="rotate(-18 '+x+' '+y+')"></ellipse>';
    if(i===nState.idx){
      s+='<polygon points="'+(x-6)+',-24 '+(x+6)+',-24 '+x+',-15" fill="#7a2b2b"></polygon>';
    }
  });
  s+="</svg>";
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
  var W=95+nState.total*70;
  var lineYs=[10,22,34,46,58,70];
  var labelOrder=["1","2","3","4","5","6"];
  var s='<svg viewBox="0 0 '+W+' 84" width="'+W+'" height="84" style="display:block;">';
  lineYs.forEach(function(ly,idx){
    s+='<line x1="15" y1="'+ly+'" x2="'+(W-15)+'" y2="'+ly+'" stroke="#c9c6ba" stroke-width="1"></line>';
    s+='<text x="4" y="'+(ly+3)+'" font-size="9" fill="#8a8880">'+labelOrder[idx]+'</text>';
  });
  nState.queue.forEach(function(item,i){
    if(nState.statuses[i]==="pending") return;
    var x=70+i*70;
    var color=statusColor(nState.statuses[i]);
    var lineIndexFromTop=5-item.stringIndex;
    var ly=lineYs[lineIndexFromTop];
    s+='<rect x="'+(x-9)+'" y="'+(ly-7)+'" width="18" height="14" fill="#f5f1e8"></rect>';
    s+='<text x="'+x+'" y="'+(ly+3)+'" font-size="11" text-anchor="middle" fill="'+color+'" font-weight="bold">'+item.fret+'</text>';
  });
  s+="</svg>";
  return s;
}

function markLetterButtons(target,choice,correct){
  Array.prototype.forEach.call(document.getElementById("notes-answers").children,function(b){
    if(b.textContent===dispName(target.letter)) b.classList.add("ans-correct");
    else if(!correct && b.textContent===dispName(choice)) b.classList.add("ans-wrong");
  });
}

function renderNoteQuestion(){
  setFeedback("feedback","");
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
    LETTERS.forEach(function(l){
      var b=document.createElement("button");
      b.textContent=dispName(l);
      b.addEventListener("click",function(){checkStaffAnswer(l,target);});
      answersC.appendChild(b);
    });
  } else if(noteTab==="fret"){
    document.getElementById("staff-inner").innerHTML="";
    document.getElementById("tab-inner").innerHTML="";
    document.getElementById("fretread-area").innerHTML="";
    var p=document.createElement("p");
    p.style.margin="0 0 0.5rem";
    p.innerHTML="Trouve : <strong>"+dispName(target.letter)+"</strong> (octave "+target.octave+")";
    var fretArea=document.getElementById("fret-area");
    fretArea.innerHTML="";
    fretArea.appendChild(p);
    var scroll=document.createElement("div");
    scroll.className="fret-scroll";
    scroll.appendChild(buildFretTable(target));
    fretArea.appendChild(scroll);
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
    LETTERS.forEach(function(l){
      var b=document.createElement("button");
      b.textContent=dispName(l);
      b.addEventListener("click",function(){checkStaffAnswer(l,target);});
      answersC.appendChild(b);
    });
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
        setFeedback("feedback","Temps ecoule - reponse attendue : "+dispName(target.letter),"bad");
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
}
function buildFretTable(target){
  var table=document.createElement("table");
  table.className="fret";
  var headRow=document.createElement("tr");
  headRow.appendChild(document.createElement("th"));
  for(var f=0;f<=nConfig.range;f++){
    var th=document.createElement("th");
    th.textContent=f;
    headRow.appendChild(th);
  }
  table.appendChild(headRow);
  STRINGS.forEach(function(s,si){
    var tr=document.createElement("tr");
    var th=document.createElement("th");
    th.textContent=s.label;
    th.style.textAlign="right";
    th.style.paddingRight="4px";
    tr.appendChild(th);
    for(var f=0;f<=nConfig.range;f++){
      var td=document.createElement("td");
      var btn=document.createElement("button");
      btn.textContent="-";
      btn.id="fb-"+si+"-"+f;
      btn.addEventListener("click",function(si,f){
        return function(){checkFretAnswer(si,f);};
      }(si,f));
      td.appendChild(btn);
      tr.appendChild(td);
    }
    table.appendChild(tr);
  });
  return table;
}
function buildFretHighlight(target){
  var table=document.createElement("table");
  table.className="fret";
  var headRow=document.createElement("tr");
  headRow.appendChild(document.createElement("th"));
  for(var f=0;f<=nConfig.range;f++){
    var th=document.createElement("th");
    th.textContent=f;
    headRow.appendChild(th);
  }
  table.appendChild(headRow);
  STRINGS.forEach(function(s,si){
    var tr=document.createElement("tr");
    var th=document.createElement("th");
    th.textContent=s.label;
    th.style.textAlign="right";
    th.style.paddingRight="4px";
    tr.appendChild(th);
    for(var f=0;f<=nConfig.range;f++){
      var td=document.createElement("td");
      if(si===target.stringIndex && f===target.fret){
        td.style.background="#7a2b2b";
        td.style.color="#fff";
        td.style.fontWeight="500";
        td.textContent="●";
      } else {
        td.textContent="";
      }
      tr.appendChild(td);
    }
    table.appendChild(tr);
  });
  return table;
}
function checkStaffAnswer(choice,target){
  if(noteTimerHandle){clearInterval(noteTimerHandle);noteTimerHandle=null;}
  var correct=choice===target.letter;
  nState.score+=correct?1:0;
  nState.statuses[nState.idx]=correct?"correct":"wrong";
  if(!correct) nState.missed.push(target);
  if(correct) removeFromMissedBank("notes",target,noteId);
  else addToMissedBank("notes",target,noteId);
  if(noteTab==="staff") renderSequenceStaff();
  disableAllAnswerButtons();
  markLetterButtons(target,choice,correct);
  setFeedback("feedback",correct?"Correct":"Reponse attendue : "+dispName(target.letter),correct?"good":"bad");
  advanceNote();
}
function checkFretAnswer(si,f){
  if(noteTimerHandle){clearInterval(noteTimerHandle);noteTimerHandle=null;}
  var target=currentNoteTarget();
  var correct=fretboardNotesAll.some(function(n){return n.stringIndex===si&&n.fret===f&&n.letter===target.letter&&n.octave===target.octave;});
  var clicked=document.getElementById("fb-"+si+"-"+f);
  if(clicked){clicked.style.background=correct?"#c9e2b0":"#f0b8b8";clicked.style.color=correct?"#2c2c2a":"#7a2b2b";clicked.style.fontWeight="700";}
  if(!correct){
    nState.missed.push(target);
    fretboardNotesAll.filter(function(n){return n.letter===target.letter&&n.octave===target.octave&&n.fret<=nConfig.range;}).forEach(function(n){
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
  setTimeout(function(){
    nState.idx++;
    if(nState.idx>=nState.total){showNotesResults();}
    else renderNoteQuestion();
  },850);
}
function showNotesResults(){
  if(noteTimerHandle){clearInterval(noteTimerHandle);noteTimerHandle=null;}
  document.getElementById("notes-quiz").classList.add("hidden");
  recordSessionResult("notes",nState.score,nState.total);
  var pct=Math.round(100*nState.score/nState.total);
  var res=document.getElementById("notes-results");
  res.classList.remove("hidden");
  res.innerHTML='<div class="metrics"><div class="metric"><div class="num">'+nState.score+"/"+nState.total+'</div><div class="lbl">score</div></div><div class="metric"><div class="num">'+pct+'%</div><div class="lbl">reussite</div></div></div>';
  if(nState.missed.length>0){
    var uniq=[];
    nState.missed.forEach(function(m){
      var name=dispName(m.letter)+" ("+m.octave+")";
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
}
