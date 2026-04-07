document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  async function fetchActivities() {
    try {
      // FIX 1: 'no-store' obliga al navegador a no usar caché, arreglando el problema de refresco.
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="" disabled selected>Select an activity</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.capacity - details.participants.length;

        let participantsHTML = `<ul class='participants-list' style='list-style: none; padding-left: 0;'>`;

        if (details.participants.length > 0) {
          details.participants.forEach(email => {
            participantsHTML += `
              <li class="participant-item" style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="flex:1;">${email}</span>
                <button class="delete-participant-btn" title="Remove" 
                        data-activity="${name}" 
                        data-email="${email}" 
                        style="background: none; border: none; color: #c62828; cursor: pointer; font-size: 18px; margin-left: 8px;">
                  &#128465;
                </button>
              </li>`;
          });
        } else {
          participantsHTML += `<li class='no-participants'>No participants yet</li>`;
        }
        participantsHTML += "</ul>";

        activityCard.innerHTML = `
          <h3>${name}</h3>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // --- FUNCIÓN DE ELIMINAR ACTUALIZADA ---
  activitiesList.addEventListener("click", async (event) => {
    const deleteBtn = event.target.closest(".delete-participant-btn");
    if (!deleteBtn) return;

    const activityName = deleteBtn.dataset.activity;
    const email = deleteBtn.dataset.email;

    if (confirm(`Are you sure you want to remove ${email} from ${activityName}?`)) {
      try {
        // FIX 2: Muchos backends usan la misma ruta de registro pero con método DELETE
        const response = await fetch(
          `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
          { method: "DELETE" } 
        );

        if (response.ok) {
          // FIX 3: Actualización optimista de la UI (borra el elemento visualmente al instante)
          deleteBtn.closest('.participant-item').remove();
          fetchActivities(); // Asegura sincronización
        } else {
          alert(`Error del Servidor: No se pudo eliminar a ${email}. Revisa la consola o el backend.`);
        }
      } catch (error) {
        console.error("Error removing participant:", error);
      }
    }
  });

  // --- MANEJO DEL FORMULARIO ---
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();
      messageDiv.textContent = result.message || result.detail;
      messageDiv.className = response.ok ? "success" : "error";
      messageDiv.classList.remove("hidden");

      if (response.ok) {
        signupForm.reset();
        fetchActivities(); 
      }

      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});