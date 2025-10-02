// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader-screen");
  const app = document.getElementById("app");

  // Loader screen -> show main app
  setTimeout(() => {
    loader.classList.add("d-none");
    app.classList.remove("d-none");
  }, 4000);

  // Elements
  const taskForm = document.getElementById("taskForm");
  const taskModal = new bootstrap.Modal(document.getElementById("taskModal"));
  const taskModalTitle = document.getElementById("taskModalTitle");
  const mainCards = document.getElementById("mainCards");
  const calendarView = document.getElementById("calendarView");
  const calendarTasks = document.getElementById("calendarTasks");
  const calendarDate = document.getElementById("calendarDate");
  const todayBtn = document.getElementById("todayBtn");
  const confirmDeleteModal = new bootstrap.Modal(document.getElementById("confirmDeleteModal"));
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  // Task Data - load from localStorage
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let editTaskId = null;
  let deleteTaskId = null;
  let currentCategory = "all";

  // ===== Save tasks to localStorage =====
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // ===== Render Tasks =====
  function renderTasks() {
    mainCards.innerHTML = "";
    calendarView.classList.add("d-none");

    let filtered = [...tasks];

    if (currentCategory === "pending") filtered = filtered.filter(t => !t.completed);
    else if (currentCategory === "completed") filtered = filtered.filter(t => t.completed);
    else if (currentCategory === "starred") filtered = filtered.filter(t => t.starred);
    else if (currentCategory === "calendar") {
      calendarView.classList.remove("d-none");
      filtered = [];
    }

    filtered.forEach(task => {
      const card = document.createElement("div");
      card.className = "col-md-6 col-lg-4";
      card.innerHTML = `
        <div class="card shadow-sm h-100 ${task.completed ? 'opacity-75' : ''}">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="card-title ${task.completed ? 'text-decoration-line-through' : ''}">${task.title}</h5>
              <div>
                <button class="btn btn-sm ${task.starred ? 'btn-warning' : 'btn-outline-warning'} me-1 star-btn"><i class="fa fa-star"></i></button>
                <button class="btn btn-sm btn-outline-primary me-1 edit-btn"><i class="fa fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger delete-btn"><i class="fa fa-trash"></i></button>
              </div>
            </div>
            <p class="card-text small flex-grow-1">${task.desc || ""}</p>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                ${task.date ? `<span class="badge bg-light text-dark"><i class="fa fa-calendar"></i> ${task.date}</span>` : ""}
                ${task.time ? `<span class="badge bg-light text-dark"><i class="fa fa-clock"></i> ${task.time}</span>` : ""}
              </div>
              <button class="btn btn-sm ${task.completed ? 'btn-success' : 'btn-outline-success'} complete-btn">
                <i class="fa ${task.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
              </button>
            </div>
          </div>
        </div>`;
      mainCards.appendChild(card);

      // Attach Event Listeners
      card.querySelector(".star-btn").addEventListener("click", () => toggleStar(task.id));
      card.querySelector(".edit-btn").addEventListener("click", () => editTask(task.id));
      card.querySelector(".delete-btn").addEventListener("click", () => askDelete(task.id));
      card.querySelector(".complete-btn").addEventListener("click", () => toggleComplete(task.id));
    });
  }

  // ===== Form Submit =====
  taskForm.addEventListener("submit", e => {
    e.preventDefault();

    const newTask = {
      id: editTaskId !== null ? editTaskId : Date.now(),
      title: document.getElementById("taskTitle").value,
      desc: document.getElementById("taskDesc").value,
      date: document.getElementById("taskDate").value,
      time: document.getElementById("taskTime").value,
      starred: document.getElementById("taskImportant").checked,
      completed: false
    };

    if (editTaskId !== null) {
      tasks = tasks.map(t => (t.id === editTaskId ? newTask : t));
      editTaskId = null;
    } else {
      tasks.push(newTask);
    }

    saveTasks();
    taskForm.reset();
    taskModal.hide();
    taskModalTitle.textContent = "Add Task";
    renderTasks();
  });

  // ===== Calendar =====
  todayBtn.addEventListener("click", () => {
    calendarDate.value = new Date().toISOString().split("T")[0];
    renderCalendar();
  });

  calendarDate.addEventListener("change", renderCalendar);

  function renderCalendar() {
    calendarTasks.innerHTML = "";
    const date = calendarDate.value;
    if (!date) return;

    const filtered = tasks.filter(t => t.date === date);
    if (filtered.length === 0) {
      calendarTasks.innerHTML = `<p class="text-muted">No tasks for this date.</p>`;
    } else {
      filtered.forEach(task => {
        const div = document.createElement("div");
        div.className = "col-md-6";
        div.innerHTML = `
          <div class="card shadow-sm">
            <div class="card-body">
              <h6 class="card-title">${task.title}</h6>
              <p class="small">${task.desc || ""}</p>
              <span class="badge bg-secondary">${task.time || ""}</span>
            </div>
          </div>`;
        calendarTasks.appendChild(div);
      });
    }
  }

  // ===== Category Buttons =====
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.cat;
      renderTasks();
      if(currentCategory === "calendar") renderCalendar();
    });
  });

  // ===== Delete =====
  function askDelete(id) {
    deleteTaskId = id;
    confirmDeleteModal.show();
  }

  confirmDeleteBtn.addEventListener("click", () => {
    if (deleteTaskId !== null) {
      tasks = tasks.filter(t => t.id !== deleteTaskId);
      deleteTaskId = null;
      saveTasks();
      renderTasks();
      confirmDeleteModal.hide();
    }
  });

  // ===== Edit =====
  function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editTaskId = id;
    taskModalTitle.textContent = "Edit Task";
    document.getElementById("taskId").value = id;
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDesc").value = task.desc;
    document.getElementById("taskDate").value = task.date;
    document.getElementById("taskTime").value = task.time;
    document.getElementById("taskImportant").checked = task.starred;

    taskModal.show();
  }

  // ===== Toggle Complete =====
  function toggleComplete(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks();
    renderTasks();
  }

  // ===== Toggle Star =====
  function toggleStar(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, starred: !t.starred } : t);
    saveTasks();
    renderTasks();
  }

  // ===== Initial Render =====
  renderTasks();
});

