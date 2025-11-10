
const execUrl = "https://script.google.com/macros/s/AKfycbzFiGVXqdeDVQH7cENcb123mg4at0I9Xhjv-D599mkVkqUSMtSygDhgIUmP29PVS9CP/exec";

const form = document.getElementById('rsvpForm');
const guestFields = document.getElementById('guestFields');
const guestsSelect = document.getElementById('guestsSelect');
const statusEl = document.getElementById('status');

guestsSelect.addEventListener('change', () => {
  guestFields.innerHTML = '';
  const n = parseInt(guestsSelect.value);
  for(let i=1;i<=n;i++){
    guestFields.innerHTML += `<label>Begleitperson ${i}</label>
      <input name="guest${i}name" placeholder="Name">
      <input name="guest${i}age" type="number" placeholder="Alter">`;
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = "Speichere...";
  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await fetch(execUrl, {
      method: "POST",
      body: JSON.stringify({type:'rsvp', ...data})
    });
    statusEl.textContent = "Danke für deine Zusage ❤️";
  } catch {
    statusEl.textContent = "Fehler beim Speichern.";
  }
});
