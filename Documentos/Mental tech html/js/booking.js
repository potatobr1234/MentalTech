// Mental Tech — agendar-consulta.html
// Lê ?psicologo_id= da URL (definido em perfil-psicologo.html ao clicar em
// "Agendar consulta"; se ausente, usa o primeiro profissional aprovado —
// útil enquanto perfil-psicologo.html ainda não repassa o id real).
// Busca datas/horários reais em /api/psicologos/:id/horarios e envia o
// agendamento para POST /api/consultas.

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('bookingForm');
  if (!form) return;

  var WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var strip = document.querySelector('[data-field="calendar-strip"]');
  var calendarEmpty = document.querySelector('[data-field="calendar-empty"]');
  var slotGrid = document.querySelector('[data-field="slot-grid"]');
  var slotEmpty = document.querySelector('[data-field="slot-empty"]');
  var confirmBtn = document.querySelector('[data-confirm-btn]');
  var selectedIdField = document.querySelector('[data-selected-psicologo]');
  var selectedDateField = document.querySelector('[data-selected-date]');
  var selectedTimeField = document.querySelector('[data-selected-time]');
  var nameField = document.querySelector('[data-psicologo-summary] [data-field="full_name"]');
  var specialtyField = document.querySelector('[data-psicologo-summary] [data-field="specialties"]');
  var alertBox = document.querySelector('[data-form-alert]');

  function showError(message) {
    if (!alertBox) { alert(message); return; }
    alertBox.textContent = message;
    alertBox.classList.add('visible', 'form-error');
  }

  function isoDate(d) { return d.toISOString().slice(0, 10); }

  function renderCalendarStrip() {
    var days = [];
    var today = new Date();
    for (var i = 0; i < 14; i++) {
      var d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    strip.innerHTML = days.map(function (d) {
      return '<button type="button" class="day-btn" data-day-btn data-date="' + isoDate(d) + '">' +
        '<span class="dow">' + WEEKDAY_SHORT[d.getDay()] + '</span>' +
        '<span class="dom">' + d.getDate() + '</span>' +
        '</button>';
    }).join('');
    if (calendarEmpty) calendarEmpty.classList.remove('visible');
  }

  function loadHorarios(psicologoId, date) {
    slotGrid.innerHTML = '';
    if (slotEmpty) { slotEmpty.textContent = 'Carregando horários...'; slotEmpty.style.display = ''; }

    fetch('/api/psicologos/' + psicologoId + '/horarios?data=' + date, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var horarios = (data.ok && data.horarios) || [];
        if (horarios.length === 0) {
          slotGrid.innerHTML = '';
          if (slotEmpty) { slotEmpty.textContent = 'Nenhum horário disponível nesse dia.'; slotEmpty.style.display = ''; }
          return;
        }
        if (slotEmpty) slotEmpty.style.display = 'none';
        slotGrid.innerHTML = horarios.map(function (h) {
          return '<button type="button" class="slot-btn" data-slot-btn data-time="' + h + '">' + h + '</button>';
        }).join('');
        bindSlotButtons();

        var requestedTime = new URLSearchParams(window.location.search).get('horario');
        if (requestedTime && horarios.indexOf(requestedTime) !== -1) {
          var requestedBtn = slotGrid.querySelector('[data-time="' + requestedTime + '"]');
          if (requestedBtn) requestedBtn.click();
        }
      });
  }

  function selectDay(date) {
    var dayButtons = strip.querySelectorAll('[data-day-btn]');
    dayButtons.forEach(function (b) { b.classList.toggle('selected', b.getAttribute('data-date') === date); });
    if (selectedDateField) selectedDateField.value = date;
    if (selectedTimeField) selectedTimeField.value = '';
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Selecione um horário'; }
    loadHorarios(selectedIdField.value, date);
  }

  function bindDayButtons() {
    var dayButtons = strip.querySelectorAll('[data-day-btn]');
    dayButtons.forEach(function (btn) {
      btn.addEventListener('click', function () { selectDay(btn.getAttribute('data-date')); });
    });

    // Veio de um link "horário" do perfil do profissional (?data=&horario=):
    // já abre no dia certo e, assim que os horários chegarem, pré-seleciona o horário também.
    var requestedDate = new URLSearchParams(window.location.search).get('data');
    var matchingDayBtn = requestedDate && strip.querySelector('[data-date="' + requestedDate + '"]');
    if (matchingDayBtn) selectDay(requestedDate);
  }

  function bindSlotButtons() {
    var slotButtons = slotGrid.querySelectorAll('[data-slot-btn]');
    slotButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        slotButtons.forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        if (selectedTimeField) selectedTimeField.value = btn.getAttribute('data-time') || '';
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Confirmar agendamento'; }
      });
    });
  }

  function initWithProfessional(prof) {
    selectedIdField.value = prof.id;
    if (nameField) nameField.textContent = prof.full_name;
    if (specialtyField) specialtyField.textContent = prof.specialty;
    renderCalendarStrip();
    bindDayButtons();
  }

  var params = new URLSearchParams(window.location.search);
  var requestedId = params.get('psicologo_id');

  fetch('/api/psicologos', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var lista = (data.ok && data.psicologos) || [];
      if (lista.length === 0) {
        showError('Nenhum profissional disponível para agendamento no momento.');
        return;
      }
      var chosen = lista[0];
      if (requestedId) {
        var found = lista.filter(function (p) { return String(p.id) === String(requestedId); })[0];
        if (found) chosen = found;
      }
      initWithProfessional(chosen);
    });

  form.addEventListener('submit', function (ev) {
    if (!selectedDateField.value || !selectedTimeField.value) {
      ev.preventDefault();
      showError('Selecione uma data e um horário antes de confirmar.');
    }
    // Sem outro preventDefault: o form faz POST tradicional para
    // /api/consultas (ver server/routes/consultas.js), que redireciona
    // para agendamento-confirmado.html?id=... em caso de sucesso, ou
    // volta para esta página com ?error=... em caso de falha.
  });
});
