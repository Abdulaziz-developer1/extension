document.getElementById("btn").addEventListener("click", () => {
  let text = document.getElementById("text").value;
    document.getElementById("result").innerHTML = `
        Characters: ${text.length} | Words: ${text.split(" ").length}
    `;
});
