const get = id => document.getElementById(id);

// const url = "https://jc-fcc-exercise-tracker.glitch.me/api/exercise/log?userId=FWgZ3SxPy";
// const param = "&from=2000-01-01&to=2018-01-01&limit=1";

const url = "https://jc-fcc-exercise-tracker.glitch.me/api/exercise/all";

const req = new XMLHttpRequest();
req.open("GET", url, true);
req.send();
req.onload = () => {
  const info = JSON.parse(req.responseText);
  let toHTML = [];
  for (let i = 0; i < info.length; i++) {
    console.log(info[i]);
    const _e = info[i].exercises;
    let exerciseList = _e.length > 0 ? ["<ul>"] : "<p>No exercises recorded yet</p>";
    for (let j = 0; j < _e.length; j++) {
      exerciseList.push(`
        <li>${_e[j].description} for ${_e[j].duration} minutes on ${_e[j].date.substr(0, 10)}</li>
      `);
    }
    if (typeof exerciseList === "object") exerciseList.push("</ul>");
    toHTML.push(`
      <div class="tableDatum">
        <h3>${info[i].username}</h3>
        ${exerciseList.join("")}
      </div>
    `);
  }
  get("dataTable").innerHTML = toHTML.join("");
};

// document.write("Hi");