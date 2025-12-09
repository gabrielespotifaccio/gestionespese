// ===============================
// CONFIGURAZIONE SUPABASE
// ===============================
const SUPABASE_URL = "https://ojwctjrlpliapsgbjhus.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9zwgzE5pkfXoIHh8RMT2RQ_RsGQ7KD5";

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===============================
// ELEMENTI DELLA PAGINA
// ===============================
const form = document.getElementById("form-spesa");
const msgForm = document.getElementById("msg-form");
const msgList = document.getElementById("msg-list");
const tabellaBody = document.querySelector("#tabella-spese tbody");
const btnAggiorna = document.getElementById("btn-aggiorna");

// Imposta la data di oggi nel form
(function setToday() {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById("data").value = today;
})();

// ===============================
// SALVATAGGIO NUOVA SPESA
// ===============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgForm.textContent = "";
  msgForm.className = "msg";

  const data = document.getElementById("data").value;
  const categoria = document.getElementById("categoria").value.trim();
  const descrizione = document.getElementById("descrizione").value.trim();
  const importoVal = document.getElementById("importo").value;
  const importo = parseFloat(importoVal.replace(",", "."));
  const metodo = document.getElementById("metodo").value.trim();

  if (!data || !categoria || isNaN(importo)) {
    msgForm.textContent = "Compila data, categoria e importo valido.";
    msgForm.classList.add("err");
    return;
  }

  const { error } = await supabase.from("spese").insert({
    data,
    categoria,
    descrizione,
    importo,
    metodo_pagamento: metodo || null,
  });

  if (error) {
    msgForm.textContent = "Errore nel salvataggio: " + error.message;
    msgForm.classList.add("err");
  } else {
    msgForm.textContent = "Spesa salvata!";
    msgForm.classList.add("ok");
    form.reset();

    // rimetti la data di oggi
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById("data").value = today;

    caricaSpese();
  }
});

// ===============================
// CARICA ELENCO SPESE
// ===============================
async function caricaSpese() {
  msgList.textContent = "Caricamento...";
  msgList.className = "msg small";

  const { data, error } = await supabase
    .from("spese")
    .select("*")
    .order("data", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    msgList.textContent = "Errore: " + error.message;
    msgList.classList.add("err");
    return;
  }

  tabellaBody.innerHTML = "";

  if (!data || data.length === 0) {
    msgList.textContent = "Nessuna spesa trovata.";
    return;
  }

  let totale = 0;

  data.forEach((riga) => {
    const tr = document.createElement("tr");

    const dataFormat =
      riga.data ?
      new Date(riga.data).toLocaleDateString("it-IT", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }) : "";

    tr.innerHTML = `
      <td>${dataFormat}</td>
      <td>${riga.categoria || ""}</td>
      <td>${riga.descrizione || ""}</td>
      <td class="right">${(riga.importo ?? 0).toFixed(2).replace(".", ",")} €</td>
      <td>${riga.metodo_pagamento || ""}</td>
      <td><button data-id="${riga.id}" class="delete-btn">X</button></td>
    `;

    tabellaBody.appendChild(tr);

    totale += riga.importo || 0;
  });

  msgList.textContent =
    `Spese: ${data.length} | Totale: ${totale.toFixed(2).replace(".", ",")} €`;

  // aggiungi eventi delete
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => eliminaSpesa(btn.dataset.id));
  });
}

// ===============================
// ELIMINA SPESA
// ===============================
async function eliminaSpesa(id) {
  if (!confirm("Eliminare questa spesa?")) return;

  const { error } = await supabase.from("spese").delete().eq("id", id);

  if (error) {
    alert("Errore: " + error.message);
    return;
  }

  caricaSpese();
}

// ===============================
// BOTTONE AGGIORNA
// ===============================
btnAggiorna.addEventListener("click", () => {
  caricaSpese();
});

// Carica spese all’avvio
caricaSpese();
