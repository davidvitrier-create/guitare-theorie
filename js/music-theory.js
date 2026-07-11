/* ---------------- LOGIQUE MUSICALE REUTILISABLE (notes, portee, intervalles) ---------------- */
var LETTERS=["C","D","E","F","G","A","B"];
var SOLFEGE={C:"Do",D:"Re",E:"Mi",F:"Fa",G:"Sol",A:"La",B:"Si"};
var SEMI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
var NUMBER_NAMES=["unisson","seconde","tierce","quarte","quinte","sixte","septieme","octave"];

function letterIdx(l){return LETTERS.indexOf(l);}
function stepOf(l,o){return letterIdx(l)+7*o;}
function noteY(step){return 210-5*step;}
function ledgerSteps(step){
  var lines=[];
  if(step<30){var s=28;while(s>=step){lines.push(s);s-=2;}}
  if(step>38){var s=40;while(s<=step+1){lines.push(s);s+=2;}}
  return lines;
}
function shuffle(a){
  for(var i=a.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var t=a[i];a[i]=a[j];a[j]=t;
  }
  return a;
}
function buildQueueOfLength(pool,total){
  var out=[];
  var guard=0;
  while(out.length<total && guard<200){
    var s=shuffle(pool.slice());
    for(var k=0;k<s.length && out.length<total;k++) out.push(s[k]);
    guard++;
  }
  return out;
}

var STRINGS=[
  {label:"6",openAbs:40},{label:"5",openAbs:45},{label:"4",openAbs:50},
  {label:"3",openAbs:55},{label:"2",openAbs:59},{label:"1",openAbs:64}
];
var CHROMATIC=[
  {letter:"C",accidental:""},{letter:"C",accidental:"#"},{letter:"D",accidental:""},
  {letter:"D",accidental:"#"},{letter:"E",accidental:""},{letter:"F",accidental:""},
  {letter:"F",accidental:"#"},{letter:"G",accidental:""},{letter:"G",accidental:"#"},
  {letter:"A",accidental:""},{letter:"A",accidental:"#"},{letter:"B",accidental:""}
];
function absToNote(abs){
  var rem=((abs%12)+12)%12;
  var c=CHROMATIC[rem];
  return {letter:c.letter,accidental:c.accidental,octave:Math.floor(abs/12)};
}
var ENHARMONIC_FLAT={
  "C#":{letter:"D",accidental:"b"},
  "D#":{letter:"E",accidental:"b"},
  "F#":{letter:"G",accidental:"b"},
  "G#":{letter:"A",accidental:"b"},
  "A#":{letter:"B",accidental:"b"}
};
function enharmonicOf(note){
  var key=note.letter+(note.accidental||"");
  var flat=ENHARMONIC_FLAT[key];
  return flat?{letter:flat.letter,accidental:flat.accidental,octave:note.octave}:null;
}
var FRET_MARKERS=[3,5,7,9,12];
function fretMarkerDots(f){
  if(f===12) return 2;
  return FRET_MARKERS.indexOf(f)>=0?1:0;
}
var fretboardNotesAll=[];
STRINGS.forEach(function(s,si){
  for(var f=0;f<=12;f++){
    var n=absToNote(s.openAbs+f);
    fretboardNotesAll.push({stringIndex:si,fret:f,letter:n.letter,accidental:n.accidental,octave:n.octave});
  }
});

function intervalDetails(l1,o1,l2,o2){
  var li1=LETTERS.indexOf(l1),li2=LETTERS.indexOf(l2);
  var diatonic=(li2-li1+7)%7;
  var a1=o1*12+SEMI[l1],a2=o2*12+SEMI[l2];
  var semi=a2-a1;
  var number=diatonic+1;
  if(diatonic===0&&semi>0) number=8;
  var refs={1:0,2:2,3:4,4:5,5:7,6:9,7:11,8:12};
  var delta=semi-refs[number];
  var q;
  if([1,4,5,8].indexOf(number)>=0){
    q=delta===0?"juste":delta===1?"augmentee":delta===-1?"diminuee":(delta>0?"sur-augmentee":"sur-diminuee");
  } else {
    q=delta===0?"majeure":delta===-1?"mineure":delta===1?"augmentee":delta===-2?"diminuee":(delta>0?"sur-augmentee":"sur-diminuee");
  }
  return {number:number,label:NUMBER_NAMES[number-1]+" "+q};
}
function staffSVG(notesArr){
  var lines=[20,30,40,50,60];
  var ys=notesArr.map(function(n){return noteY(stepOf(n.letter,n.octave));});
  var minY=Math.min.apply(null,ys.concat([20]))-10;
  var maxY=Math.max.apply(null,ys.concat([60]))+10;
  var top=Math.min(0,minY);
  var height=Math.max(80,maxY)-top;
  var s='<svg viewBox="0 '+top+' 220 '+height+'" width="220" style="max-width:100%;">';
  lines.forEach(function(ly){s+='<line x1="15" y1="'+ly+'" x2="205" y2="'+ly+'" stroke="#8a8880" stroke-width="1"></line>';});
  s+='<text x="16" y="60" font-size="46" fill="#2c2c2a">G</text>';
  notesArr.forEach(function(n){
    var step=stepOf(n.letter,n.octave), y=noteY(step);
    ledgerSteps(step).forEach(function(ls){
      var ly=noteY(ls);
      s+='<line x1="'+(n.x-13)+'" y1="'+ly+'" x2="'+(n.x+13)+'" y2="'+ly+'" stroke="#2c2c2a" stroke-width="1.2"></line>';
    });
    s+='<ellipse cx="'+n.x+'" cy="'+y+'" rx="7.5" ry="5.8" fill="#2c2c2a" transform="rotate(-18 '+n.x+' '+y+')"></ellipse>';
  });
  s+="</svg>";
  return s;
}

if(typeof module!=="undefined"&&module.exports){
  module.exports={
    LETTERS:LETTERS,SOLFEGE:SOLFEGE,SEMI:SEMI,NUMBER_NAMES:NUMBER_NAMES,
    STRINGS:STRINGS,CHROMATIC:CHROMATIC,FRET_MARKERS:FRET_MARKERS,
    fretboardNotesAll:fretboardNotesAll,
    stepOf:stepOf,noteY:noteY,ledgerSteps:ledgerSteps,shuffle:shuffle,
    buildQueueOfLength:buildQueueOfLength,absToNote:absToNote,
    fretMarkerDots:fretMarkerDots,intervalDetails:intervalDetails,
    enharmonicOf:enharmonicOf,staffSVG:staffSVG
  };
}
