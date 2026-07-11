/* ---------------- NAVIGATION + ACCUEIL + BASCULE DE NOTATION ---------------- */
var useSolfege=true;

function dispName(letter,accidental){
  var base=useSolfege?SOLFEGE[letter]:letter;
  return accidental==="#"?base+"♯":base;
}
function refreshToggleLabel(){
  document.getElementById("toggleNaming").textContent="Notation : "+(useSolfege?"Do Re Mi":"C D E");
}
document.getElementById("toggleNaming").addEventListener("click",function(){
  useSolfege=!useSolfege;
  refreshToggleLabel();
  if(!document.getElementById("notes-quiz").classList.contains("hidden") && noteTab==="staff"){
    renderSequenceStaff();
  }
});

document.getElementById("cardNotes").addEventListener("click",function(){openModule("notes");});
document.getElementById("cardIntervals").addEventListener("click",function(){openModule("intervals");});
document.getElementById("backFromNotes").addEventListener("click",backToHome);
document.getElementById("backFromIntervals").addEventListener("click",backToHome);

function openModule(name){
  document.getElementById("home").classList.add("hidden");
  if(name==="notes"){
    document.getElementById("notes-module").classList.remove("hidden");
    document.getElementById("notes-config").classList.remove("hidden");
    document.getElementById("notes-quiz").classList.add("hidden");
    document.getElementById("notes-results").classList.add("hidden");
    renderNotesHistoryNote();
  }
  if(name==="intervals"){
    document.getElementById("intervals-module").classList.remove("hidden");
    document.getElementById("intervals-config").classList.remove("hidden");
    document.getElementById("intervals-quiz").classList.add("hidden");
    document.getElementById("intervals-results").classList.add("hidden");
    renderIntervalsHistoryNote();
  }
}
function backToHome(){
  document.getElementById("notes-module").classList.add("hidden");
  document.getElementById("intervals-module").classList.add("hidden");
  document.getElementById("home").classList.remove("hidden");
}
function radioValue(name){
  var el=document.querySelector('input[name="'+name+'"]:checked');
  return el?el.value:null;
}
function updateProgress(barId,idx,total){
  document.getElementById(barId).style.width=Math.round(100*idx/total)+"%";
}
function setFeedback(id,text,kind){
  var el=document.getElementById(id);
  el.textContent=text;
  el.className="";
  if(kind) el.classList.add(kind);
}

refreshToggleLabel();
