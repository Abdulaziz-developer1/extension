document.addEventListener("DOMContentLoaded", loadTasks);

function myFunction() {
    const taskList = document.getElementById("tasklist");
    const taskInput = document.getElementById("taskInput");
    let taskText = taskInput.value.trim();

    if (taskText === "") {
        alert("Task name can't be empty!");
        return;
    }

    let tasks = getTasksFromStorage();
    
    if (tasks.length >= 10) {
        alert("You can't enter 11 or more tasks");
        return;
    }
    const newListItem = document.createElement("li");
    newListItem.innerText = taskText;
    
    // Right click to delete with confirmation
    newListItem.addEventListener("contextmenu", (e) => {
        e.preventDefault(); // prevent default browser menu
        if (confirm(`Do you really want to delete "${taskText}"?`)) {
            removeTask(tasks.indexOf(taskText));
        }
    });
    
    newListItem.addEventListener("dblclick", (e) => {
        // e.preventDefault(); // prevent default browser menu
        if (confirm(`Do you really want to delete "${taskText}"?`)) {
            removeTask(tasks.indexOf(taskText));
        }
    });
    
    taskList.appendChild(newListItem);
    
    tasks.push(taskText);
    saveTasksToStorage(tasks);
    
    taskInput.value = ""; 
    newListItem.classList.add('listItem')
}

function removeTask(index) {
    let tasks = getTasksFromStorage();
    if (index >= 0 && index < tasks.length) {
        tasks.splice(index, 1);
        saveTasksToStorage(tasks);
        loadTasks();
    }
}

function loadTasks() {
    const taskList = document.getElementById("tasklist");
    taskList.innerHTML = "";
    let tasks = getTasksFromStorage();

    tasks.forEach((taskText, index) => {
        const newListItem = document.createElement("li");
        newListItem.innerText = taskText;

        // Right click to delete with confirmation
        newListItem.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (confirm(`Do you really want to delete "${taskText}"?`)) {
                removeTask(index);
            }
        });

        taskList.appendChild(newListItem);
    });
}

function clearAllTasks() {
    localStorage.removeItem("tasks");
    loadTasks();
}

function getTasksFromStorage() {
    return JSON.parse(localStorage.getItem("tasks")) || [];
}

function saveTasksToStorage(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Trigger add function when Enter is pressed in input
document.getElementById("taskInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault(); // prevent accidental form submission
        myFunction();
    }
});
