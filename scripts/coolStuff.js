const get = id => document.getElementById(id);
const display = (id, option) => get(id).style.display = option;
const show = id => display(id, "block");
const showAll = arr => arr.forEach(e => show(e));
const hide = id => display(id, "none");
const hideAll = arr => arr.forEach(e => hide(e));

const isMobile = (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4)));

const url = "https://jc-fcc-exercise-tracker.glitch.me/api/exercise/all";

if (isMobile) get("headerAnchor").removeAttribute("href");

hideAll(["hideBtn", "options"]);

const userOptions = {
  username: null,
  arrangeBy: 0,
  rev: false,
  from: null,
  to: null
};
let preInfo; // XMLRequest will store information here so parameters can be set without reloading all data


const req = new XMLHttpRequest();
req.open("GET", url, true);
req.send();
req.onload = () => {
  preInfo = JSON.parse(req.responseText);
  fillTable();
};

function fillTable() {
  let toHTML = [];
  // Make a copy of each object in the array so that the originals aren't permanently affected
  let info = preInfo.slice().map(d => JSON.parse(JSON.stringify(d)));
  for (let i = 0; i < info.length; i++) {
    info[i].exercises = info[i].exercises.filter(e => (new Date(e.date) >= userOptions.from || userOptions.from === null) && (new Date(e.date) <= userOptions.to || userOptions.to === null));
    let ex = info[i].exercises;
    let _totalTime = 0;
    for (let j = 0; j < ex.length; j++) {
      _totalTime += Number(ex[j].duration);
    }
    info[i]["totalTime"] = _totalTime;
  }
  let regX = userOptions.username;
  // If this value isn't null, seach by username
  if (regX) {
    info = info.filter(d => regX.test(d.username));
  }
  // Arrange by user's choice
  let arrange = userOptions.arrangeBy;
  if (arrange === 1) {
    info = info.sort((a, b) => a.username.toLowerCase().charCodeAt(0) - b.username.toLowerCase().charCodeAt(0));
  } else if (arrange === 2) {
    info = info.sort((a, b) => a.totalTime - b.totalTime);
    info = info.reverse();
  } else if (arrange === 0) {
    info = info.reverse();
  }
  if (userOptions.rev) info.reverse();
  if (info.length === 0) return get("dataTable").innerHTML = "No matches";
  // info[i] represents each user / person
  for (let i = 0; i < info.length; i++) {
    const unsorted_e = info[i].exercises.slice();
    const _e = unsorted_e.sort((a, b) => new Date(a.date) - new Date(b.date));
    let exerciseList = _e.length > 0 ? ["<ul>"] : "<p>No exercises recorded yet</p>";
    // let totalMins = 0;
    // _e[j] OR info[i].exercises[j] is each individual exercise the user did
    for (let j = 0; j < _e.length; j++) {
      // totalMins += Number(_e[j].duration);
      exerciseList.push(`
        <li>${_e[j].description} for ${_e[j].duration} minutes on ${_e[j].date.substr(0, 10)}</li>
      `);
    }
    // If this variable is an array, add the finishing touches, otherwise leave it as a string
    if (typeof exerciseList === "object") {
      exerciseList.push("</ul>");
      exerciseList.push(`<p class="totalMins">Total exercise time: ${info[i].totalTime} minutes<p>`);
      exerciseList = exerciseList.join("")
    }
    toHTML.push(`
      <div class="tableDatum">
        <h3>${info[i].username}</h3>
        ${exerciseList}
      </div>
    `);
  }
  get("dataTable").innerHTML = toHTML.join("");
}

function showOptions() {
  hide("showBtn");
  showAll(["hideBtn", "options"]);
}

function hideOptions() {
  hideAll(["hideBtn", "options"]);
  show("showBtn");
}

function searchName() {
  let val = get("searchByName").value;
  if (val.length > 0) {
    let reg = new RegExp(val, "i");
    userOptions.username = reg;
  } else {
    userOptions.username = null;
  }
  fillTable();
}

function arrangeData() {
  const choices = "mem alp exe".split(" ") // make array for IDs of radio buttons
  for (let i = 0; i < choices.length; i++) {
    if (get(choices[i]+"Rad").checked) userOptions.arrangeBy = i;
  }
  fillTable();
}

function revSort() {
  userOptions.rev = !userOptions.rev;
  fillTable();
}

function limitDates() {
  userOptions.from = new Date(get("from").value)
  userOptions.to = new Date(get("to").value);
  if (userOptions.from.toString() === "Invalid Date") userOptions.from = null;
  if (userOptions.to.toString() === "Invalid Date") userOptions.to = null;
  fillTable();
}


// const url = "https://jc-fcc-exercise-tracker.glitch.me/api/exercise/log?userId=FWgZ3SxPy";
// const param = "&from=2000-01-01&to=2018-01-01&limit=1";