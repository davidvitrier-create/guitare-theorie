/* ---------------- COMPOSANT REUTILISABLE : TABLEAU DE MANCHE ---------------- */
function fretHeaderCell(f){
  var th=document.createElement("th");
  th.textContent=f;
  var dots=fretMarkerDots(f);
  if(dots>0){
    var m=document.createElement("span");
    m.className="fret-marker";
    m.textContent=dots===2?" ●●":" ●";
    th.appendChild(m);
  }
  if(f===0) th.className="nut-edge";
  return th;
}
function buildFretboardTable(opts){
  var table=document.createElement("table");
  table.className="fret";
  var headRow=document.createElement("tr");
  headRow.appendChild(document.createElement("th"));
  for(var f=0;f<=opts.range;f++){
    headRow.appendChild(fretHeaderCell(f));
  }
  table.appendChild(headRow);
  STRINGS.forEach(function(s,si){
    var tr=document.createElement("tr");
    var th=document.createElement("th");
    th.textContent=s.label;
    th.style.textAlign="right";
    th.style.paddingRight="4px";
    tr.appendChild(th);
    for(var f=0;f<=opts.range;f++){
      var td=document.createElement("td");
      if(f===0) td.className="nut-edge";
      var cell=opts.cell(si,f)||{};
      if(cell.button){
        var btn=document.createElement("button");
        btn.textContent=cell.text!==undefined?cell.text:"-";
        if(cell.id) btn.id=cell.id;
        if(cell.onClick) btn.addEventListener("click",cell.onClick);
        td.appendChild(btn);
      } else {
        td.textContent=cell.text||"";
      }
      if(cell.style){
        Object.keys(cell.style).forEach(function(k){td.style[k]=cell.style[k];});
      }
      if(cell.className) td.className=(td.className?td.className+" ":"")+cell.className;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  });
  return table;
}
