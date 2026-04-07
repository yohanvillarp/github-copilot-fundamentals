document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Referencias a los Templates del HTML
  const cardTemplate = document.getElementById("activity-card-template");
  const participantTemplate = document.getElementById("participant-item-template");
  const noParticipantTemplate = document.getElementById("no-participants-template");

  async function fetchActivities() {
    try {
      // FIX 1: 'no-store' obliga al navegador a no usar caché, arreglando el problema de refresco.
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="" disabled selected>Select an activity</option>';

      Object.entries(activities).forEach(([name, details]) => {
        // 1. Clonar el template de la tarjeta
        const cardClone = cardTemplate.content.cloneNode(true);
        
        // 2. Llenar los datos básicos
        const spotsLeft = details.capacity - details.participants.length;
        cardClone.querySelector(".activity-name").textContent = name;
        cardClone.querySelector(".activity-schedule").textContent = details.schedule;
        cardClone.querySelector(".activity-spots").textContent = spotsLeft;

        // 3. Manejar la lista de participantes
        const ul = cardClone.querySelector(".participants-list");

        if (details.participants.length > 0) {
          details.participants.forEach(email => {
            // Clonar template de participante
            const participantClone = participantTemplate.content.cloneNode(true);
            participantClone.querySelector(".participant-email").textContent = email;
            
            // Configurar el botón de borrar
            const deleteBtn = participantClone.querySelector(".delete-participant-btn");
            deleteBtn.dataset.activity = name;
            deleteBtn.dataset.email = email;

            ul.appendChild(participantClone);
          });
        } else {
          // Si no hay participantes, clonar el mensaje vacío
          const noPartClone = noParticipantTemplate.content.cloneNode(true);
          ul.appendChild(noPartClone);
        }

        // 4. Inyectar al DOM
        activitiesList.appendChild(cardClone);

        // 5. Poblar el Select
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