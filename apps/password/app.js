const lowercase = "abcdefghijklmnopqrstuvwxyz";
const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numbers = "0123456789";

let btn = document.getElementById("btn");
let copyBtn = document.getElementById("copy");
let result = document.getElementById("result");

btn.addEventListener("click", () => {
  const length = parseInt(document.getElementById("inp1").value);
  const useNumbers = document.getElementById("inp2").checked;
  const useUpper = document.getElementById("inp3").checked;

  const password = generatePassword(length, useNumbers, useUpper);
  result.value = password || "";
});

copyBtn.addEventListener("click", () => {
  if (result.value) {
    navigator.clipboard.writeText(result.value).then(() => {
      alert("Password copied to clipboard!");
    });
  } else {
    alert("No password to copy!");
  }
});

function generatePassword(length, useNumbers, useUpper) {
  if (isNaN(length) || length < 6 || length > 32) {
    alert("Please enter a number between 6 and 32.");
    return "";
  }

  let chars = lowercase; // always include lowercase
  if (useUpper) chars += uppercase;
  if (useNumbers) chars += numbers;

  if (chars === "") {
    alert("Select at least one option!");
    return "";
  }

  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}
