// Mental Tech — perfil-psicologo.html
// Lê ?id= da URL, busca GET /api/psicologos/:id e preenche a página.
// O link "Agendar consulta" passa a levar o id junto, pra agendar-consulta.html
// (js/booking.js) já abrir direto no profissional certo.

document.addEventListener('DOMContentLoaded', function () {
  var profileHead = document.querySelector('[data-psicologo-profile]');
  if (!profileHead) return;

  var notFoundBox = document.querySelector('[data-profile-not-found]');
  var infoGrid = document.querySelector('[data-psicologo-info]');
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');

  function showNotFound() {
    if (notFoundBox) notFoundBox.classList.add('visible');
  }

  if (!id) { showNotFound(); return; }

  fetch('/api/psicologos/' + encodeURIComponent(id), {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (r) {
      if (!r.ok || !r.data.ok) { showNotFound(); return; }
      var p = r.data.psicologo;

      profileHead.style.display = '';
      if (infoGrid) infoGrid.style.display = '';

      document.querySelector('[data-field="full_name"]').textContent = p.full_name;
      document.querySelector('[data-field="crp_number"]').textContent = p.crp_number;
      document.querySelector('[data-field="status"]').textContent = p.modality;
      document.querySelector('[data-field="bio"]').textContent = p.bio;
      document.querySelector('[data-field="experience"]').textContent = p.experience;
      document.querySelector('[data-field="approach"]').textContent = p.approach;
      document.querySelector('[data-field="modality"]').textContent = p.modality;

      var tagsEl = document.querySelector('[data-field="tags"]');
      if (tagsEl) tagsEl.innerHTML = '<span class="tag">' + p.specialty_label + '</span>';

      var agendarLink = document.querySelector('[data-field="agendar-link"]');
      if (agendarLink) agendarLink.setAttribute('href', 'agendar-consulta.html?psicologo_id=' + p.id);

      var slotsEl = document.querySelector('[data-field="slots"]');
      var slotNote = document.querySelector('[data-field="slot-note"]');
      if (slotsEl) {
        if (p.next_available.length === 0) {
          if (slotNote) slotNote.style.display = '';
        } else {
          if (slotNote) slotNote.style.display = 'none';
          slotsEl.innerHTML = p.next_available.map(function (s) {
            var d = new Date(s.date + 'T12:00:00');
            var label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' · ' + s.time;
            return '<a href="agendar-consulta.html?psicologo_id=' + p.id + '&data=' + s.date + '&horario=' + s.time + '" class="time-pill">' + label + '</a>';
          }).join('');
        }
      }
    })
    .catch(showNotFound);
});
