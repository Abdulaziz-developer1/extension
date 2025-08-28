// timer
let timername = document.getElementById("timername");
let time = document.getElementById("time");
let timer = document.getElementById("timer");
let btn1 = document.getElementById("btn1");

// load existing timers (as array)
let timers = JSON.parse(localStorage.getItem("timers")) || [];

btn1.addEventListener("click", () => {
  let name = timername.value.trim();
  let timeSeconds = parseInt(time.value);

  if (name && !isNaN(timeSeconds) && timeSeconds > 0) {
    alert("Timer added");

    // store future time in ms
    let endTime = Date.now() + timeSeconds * 1000;

    timers.push({ endTime, name });
    localStorage.setItem("timers", JSON.stringify(timers));
  } else {
    alert("Please fill in the required fields with valid values");
  }
});

// tick every second
setInterval(() => {
  let now = Date.now();

  timers.forEach((e, index) => {
    let remaining = Math.floor((e.endTime - now) / 1000);

    // show countdowns
    if (remaining > 0) {
      timer.innerHTML = `${e.name}: ${remaining}s left`;
    } else {
      alert(`Timer "${e.name}" has rang!`);
      timers.splice(index, 1); // remove expired timer
    }
  });

  // save updated timers
  localStorage.setItem("timers", JSON.stringify(timers));
}, 1000);


// second counter

let btn2 = document.getElementById("btn2");
let container = document.getElementById("seconds");
let used = false;
let seconds = 0;
let minutes = 0;

btn2.addEventListener("click", () => {
  if (used == false) {
    used = true;
    btn2.innerHTML = "Stop";
  } else {
    alert(`Stopped! At ${localStorage.getItem("time") || "0:0"}`);
    used = false;
    btn2.innerHTML = "Start Second Counter";
  }
});

setInterval(() => {
  if (used) {
    // setInterval(() => {
    if (seconds == 59) {
      minutes++;
      seconds = 0;
    } else {
      seconds++;
    }

    localStorage.setItem("time", `${minutes}:${seconds}`);
    container.innerHTML = `
        ${minutes}:${seconds}
    `;
    // }, 1000);
  } else {
    seconds = 0;
    minutes = 0;
    container.innerHTML = `
        ${minutes}:${seconds}
    `;
  }
}, 1000);
