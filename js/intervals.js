/* ---------------- MODULE INTERVALLES ---------------- */
var intervalTypeGroup=document.getElementById("intervalTypeGroup");
for(var n=2;n<=8;n++){
  var lbl=document.createElement("label");
  var cb=document.createElement("input");
  cb.type="checkbox";
  cb.value=n;
  cb.checked=true;
  cb.className="intervalTypeBox";
  lbl.appendChild(cb);
  lbl.appendChild(document.createTextNode(NUMBER_NAMES[n-1]));
  intervalTypeGroup.appendChild(lbl);
}
var iConfig={allowedNumbers:[2,3,4,5,6,7,8],rootMode:"random",total:12};
var iState={idx:0,total:12,score:0,q:[],labels:[],missed:[]};

document.getElementById("startIntervalsBtn").addEventListener("click",function(){
  var boxes=document.querySelectorAll(".intervalTypeBox");
  var allowed=[];
  Array.prototype.forEach.call(boxes,function(b){if(b.checked) allowed.push(parseInt(b.value,10));});
  if(allowed.length===0) allowed=[2,3,4,5,6,7,8];
  iConfig.allowedNumbers=allowed;
  iConfig.rootMode=radioValue("intervalRoot");
  iConfig.total=parseInt(radioValue("intervalCount"),10);
  document.getElementById("intervals-config").classList.add("hidden");
  document.getElementById("intervals-quiz").classList.remove("hidden");
  startIntervalsModule();
});

function buildIntervalPool(){
  var roots=[],combos=[];
  if(iConfig.rootMode==="fixed"){
    roots=[["C",4]];
  } else {
    [3,4,5].forEach(function(o){LETTERS.forEach(function(l){roots.push([l,o]);});});
  }
  roots.forEach(function(r){
    for(var off=1;off<=6;off++){
      var li=LETTERS.indexOf(r[0]);
      var ti=(li+off)%7;
      var tl=LETTERS[ti];
      var to=r[1]+((li+off>=7)?1:0);
      if(to>5) continue;
      var d=intervalDetails(r[0],r[1],tl,to);
      if(iConfig.allowedNumbers.indexOf(d.number)===-1) continue;
      combos.push({root:{letter:r[0],octave:r[1]},target:{letter:tl,octave:to},label:d.label,number:d.number});
    }
  });
  return combos;
}
function startIntervalsModule(customQueue){
  var combosAll=buildIntervalPool();
  var q=customQueue?customQueue:shuffle(combosAll).slice(0,iConfig.total);
  var total=customQueue?customQueue.length:iConfig.total;
  iState={idx:0,total:total,score:0,q:q,labels:[],missed:[]};
  combosAll.forEach(function(c){if(iState.labels.indexOf(c.label)===-1)iState.labels.push(c.label);});
  if(iState.labels.length<4){
    ["seconde majeure","tierce majeure","quarte juste","quinte juste","sixte majeure","septieme majeure","octave juste"].forEach(function(l){
      if(iState.labels.indexOf(l)===-1) iState.labels.push(l);
    });
  }
  document.getElementById("intervals-results").classList.add("hidden");
  document.getElementById("intervals-results").innerHTML="";
  document.getElementById("intervals-quiz").classList.remove("hidden");
  renderIntervalQuestion();
}
function renderIntervalQuestion(){
  setFeedback("feedback2","");
  document.getElementById("intervalsScore").textContent="Question "+(iState.idx+1)+"/"+iState.total+" · score "+iState.score;
  updateProgress("intervalsProgress",iState.idx,iState.total);
  var c=iState.q[iState.idx];
  var wrap=document.getElementById("intervals-staff");
  wrap.innerHTML="";
  var p=document.createElement("p");
  p.style.margin="0 0 0.5rem";
  p.style.color="var(--gray)";
  p.style.fontSize="0.9rem";
  p.textContent=dispName(c.root.letter)+" vers "+dispName(c.target.letter);
  wrap.appendChild(p);
  var svgHolder=document.createElement("div");
  svgHolder.innerHTML=staffSVG([{letter:c.root.letter,octave:c.root.octave,x:80},{letter:c.target.letter,octave:c.target.octave,x:140}]);
  wrap.appendChild(svgHolder);
  var distractors=shuffle(iState.labels.filter(function(l){return l!==c.label;})).slice(0,3);
  var choices=shuffle([c.label].concat(distractors));
  var answersC=document.getElementById("intervals-answers");
  answersC.innerHTML="";
  choices.forEach(function(ch){
    var b=document.createElement("button");
    b.textContent=ch;
    b.addEventListener("click",function(){checkIntervalAnswer(ch,c);});
    answersC.appendChild(b);
  });
}
function checkIntervalAnswer(choice,c){
  var correct=choice===c.label;
  iState.score+=correct?1:0;
  if(!correct) iState.missed.push(c);
  Array.prototype.forEach.call(document.getElementById("intervals-answers").children,function(b){
    if(b.textContent===c.label) b.classList.add("ans-correct");
    else if(!correct && b.textContent===choice) b.classList.add("ans-wrong");
    b.disabled=true;
  });
  setFeedback("feedback2",correct?"Correct":"Reponse attendue : "+c.label,correct?"good":"bad");
  setTimeout(function(){
    iState.idx++;
    if(iState.idx>=iState.total) showIntervalsResults();
    else renderIntervalQuestion();
  },800);
}
function showIntervalsResults(){
  document.getElementById("intervals-quiz").classList.add("hidden");
  var pct=Math.round(100*iState.score/iState.total);
  var res=document.getElementById("intervals-results");
  res.classList.remove("hidden");
  res.innerHTML='<div class="metrics"><div class="metric"><div class="num">'+iState.score+"/"+iState.total+'</div><div class="lbl">score</div></div><div class="metric"><div class="num">'+pct+'%</div><div class="lbl">reussite</div></div></div>';
  if(iState.missed.length>0){
    var uniq=[];
    iState.missed.forEach(function(m){
      var name=dispName(m.root.letter)+"-"+dispName(m.target.letter)+" ("+m.label+")";
      if(uniq.indexOf(name)===-1) uniq.push(name);
    });
    var mDiv=document.createElement("div");
    mDiv.className="missed-list";
    mDiv.textContent="Intervalles rates : "+uniq.join(", ");
    res.appendChild(mDiv);
  }
  var row=document.createElement("div");
  row.className="row";
  row.style.marginTop="1.25rem";
  var again=document.createElement("button");
  again.className="primary";
  again.textContent="Recommencer";
  again.addEventListener("click",function(){startIntervalsModule();});
  row.appendChild(again);
  if(iState.missed.length>0){
    var replay=document.createElement("button");
    replay.textContent="Rejouer les erreurs ("+iState.missed.length+")";
    replay.addEventListener("click",function(){startIntervalsModule(iState.missed.slice());});
    row.appendChild(replay);
  }
  var menu=document.createElement("button");
  menu.className="ghost";
  menu.textContent="Menu";
  menu.addEventListener("click",backToHome);
  row.appendChild(menu);
  res.appendChild(row);
}
