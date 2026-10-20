// Mental Tech — painel do psicólogo.
// Cada bloco só roda se encontrar o [data-field] correspondente na página,
// então este único arquivo pode ser incluído em todas as telas do painel
// (painel-psicologo.html, consultas.html, agenda-psicologo.html,
// pacientes.html, mensagens.html, disponibilidade.html).

document.addEventListener('DOMContentLoaded', function () {

  var STATUS_LABEL = { confirmada: 'Confirmada', pendente: 'Pendente', concluida: 'Concluída', cancelada: 'Cancelada' };
  var WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  function getJson(url) {
    return fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); });
  }

  /* ---------------------------------------------------------
     1) Dashboard (painel-psicologo.html)
  --------------------------------------------------------- */
  var upcomingEl = document.querySelector('[data-field="upcoming-appointments"]');
  if (upcomingEl) {
    getJson('/api/psicologo/dashboard').then(function (r) {
      if (!r.ok) return;
      var d = r.data;

      var todayCount = document.querySelector('[data-field="today-count"]');
      if (todayCount) todayCount.textContent = d.today_count;

      var nextTime = document.querySelector('[data-field="next-time"]');
      if (nextTime) nextTime.textContent = d.next_appointment ? d.next_appointment.time : '—';

      var patientsTotal = document.querySelector('[data-field="patients-total"]');
      if (patientsTotal) patientsTotal.textContent = d.patients_total;

      var unread = document.querySelector('[data-field="unread-count"]');
      if (unread) unread.textContent = d.unread_messages;

      var emptyNote = document.querySelector('[data-field="upcoming-empty"]');
      if (d.upcoming.length === 0) {
        if (emptyNote) emptyNote.style.display = '';
      } else {
        if (emptyNote) emptyNote.style.display = 'none';
        upcomingEl.innerHTML = d.upcoming.map(function (a) {
          return '' +
            '<div class="appt-row">' +
              '<div class="appt-time">' + a.time + '</div>' +
              '<div class="appt-who"><strong>' + a.patient_name + '</strong><span>Consulta psicológica</span></div>' +
              '<span class="status-pill ' + a.status + '">' + STATUS_LABEL[a.status] + '</span>' +
              '<div class="appt-actions">' +
                '<a href="consultas.html" class="btn btn-primary">Ver</a>' +
                '<a href="mensagens.html" class="btn btn-secondary">Chat</a>' +
              '</div>' +
            '</div>';
        }).join('');
      }

      var activityEl = document.querySelector('[data-field="activity-list"]');
      var activityEmpty = document.querySelector('[data-field="activity-empty"]');
      if (activityEl) {
        if (d.recent_activity.length === 0) {
          if (activityEmpty) activityEmpty.style.display = '';
        } else {
          if (activityEmpty) activityEmpty.style.display = 'none';
          activityEl.innerHTML = d.recent_activity.map(function (a) {
            var icon = a.status === 'cancelada' ? '🚫' : '📅';
            var text = a.status === 'cancelada'
              ? 'Consulta com ' + a.patient_name + ' foi cancelada'
              : 'Consulta agendada com ' + a.patient_name + ' — ' + a.date + ' às ' + a.time;
            return '<li class="activity-item"><span class="activity-icon">' + icon + '</span>' +
                   '<div><p>' + text + '</p><time>' + a.created_at + '</time></div></li>';
          }).join('');
        }
      }
    });
  }

  /* ---------------------------------------------------------
     2) Minhas consultas (consultas.html)
  --------------------------------------------------------- */
  var consultasBody = document.querySelector('[data-field="consultas-body"]');
  if (consultasBody) {
    var filterChips = document.querySelectorAll('[data-consulta-filter]');
    var consultasEmpty = document.querySelector('[data-field="consultas-empty"]');

    function loadConsultas(range) {
      getJson('/api/consultas?range=' + range).then(function (r) {
        if (!r.ok) return;
        var rows = r.data.consultas;
        if (rows.length === 0) {
          consultasBody.innerHTML = '';
          if (consultasEmpty) consultasEmpty.style.display = '';
          return;
        }
        if (consultasEmpty) consultasEmpty.style.display = 'none';
        consultasBody.innerHTML = rows.map(function (c) {
          var cancelBtn = c.status === 'cancelada' ? '' :
            '<button type="button" class="btn btn-secondary" data-cancel-consulta="' + c.id + '">Cancelar</button>';
          return '' +
            '<tr>' +
              '<td>' + c.other_name + '</td>' +
              '<td>' + c.date + '</td>' +
              '<td>' + c.time + '</td>' +
              '<td><span class="status-pill ' + c.status + '">' + STATUS_LABEL[c.status] + '</span></td>' +
              '<td class="dt-actions">' + cancelBtn + '</td>' +
            '</tr>';
        }).join('');
      });
    }

    filterChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        filterChips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        loadConsultas(chip.getAttribute('data-consulta-filter'));
      });
    });

    consultasBody.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-cancel-consulta]');
      if (!btn) return;
      if (!confirm('Cancelar esta consulta?')) return;
      var id = btn.getAttribute('data-cancel-consulta');
      fetch('/api/consultas/' + id + '/cancelar', {
        method: 'PATCH',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      }).then(function () {
        var activeChip = document.querySelector('[data-consulta-filter].active');
        loadConsultas(activeChip ? activeChip.getAttribute('data-consulta-filter') : 'todas');
      });
    });

    loadConsultas('todas');
  }

  /* ---------------------------------------------------------
     3) Agenda semanal (agenda-psicologo.html)
  --------------------------------------------------------- */
  var agendaBody = document.querySelector('[data-field="agenda-body"]');
  if (agendaBody) {
    var weekOffset = 0;
    var headerRow = document.querySelector('[data-field="agenda-header"]');
    var periodEl = document.querySelector('[data-field="agenda-period"]');
    var agendaEmpty = document.querySelector('[data-field="agenda-empty"]');
    var HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

    function startOfWeek(offset) {
      var d = new Date();
      var day = d.getDay(); // 0=domingo
      var diffToMonday = (day === 0 ? -6 : 1) - day;
      d.setDate(d.getDate() + diffToMonday + offset * 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }

    function isoDate(d) {
      return d.toISOString().slice(0, 10);
    }

    function loadWeek() {
      var monday = startOfWeek(weekOffset);
      var days = [];
      for (var i = 0; i < 5; i++) {
        var d = new Date(monday);
        d.setDate(d.getDate() + i);
        days.push(d);
      }

      if (periodEl) {
        periodEl.textContent = days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
          ' – ' + days[4].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      }

      if (headerRow) {
        headerRow.innerHTML = '<th></th>' + days.map(function (d) {
          return '<th>' + WEEKDAY_LABELS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + '</th>';
        }).join('');
      }

      getJson('/api/consultas?range=todas').then(function (r) {
        var byDate = {};
        if (r.ok) {
          r.data.consultas.forEach(function (c) {
            if (c.status === 'cancelada') return;
            byDate[c.date + ' ' + c.time] = c;
          });
        }

        var hasAny = false;
        agendaBody.innerHTML = HOURS.map(function (hour) {
          var cells = days.map(function (d) {
            var key = isoDate(d) + ' ' + hour;
            var c = byDate[key];
            if (!c) return '<td></td>';
            hasAny = true;
            return '<td><div class="agenda-event">' +
              '<strong>' + c.other_name + '</strong><span>Consulta</span></div></td>';
          }).join('');
          return '<tr><td>' + hour + '</td>' + cells + '</tr>';
        }).join('');

        if (agendaEmpty) agendaEmpty.style.display = hasAny ? 'none' : '';
      });
    }

    var navButtons = document.querySelectorAll('[data-agenda-nav]');
    navButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        weekOffset += btn.getAttribute('data-agenda-nav') === 'next' ? 1 : -1;
        loadWeek();
      });
    });

    loadWeek();
  }

  /* ---------------------------------------------------------
     4) Pacientes (pacientes.html) — também alimenta mensagens.html
  --------------------------------------------------------- */
  var patientsGrid = document.querySelector('[data-field="patients-grid"]');
  var chatList = document.querySelector('[data-field="chat-list"]');
  if (patientsGrid || chatList) {
    getJson('/api/psicologo/pacientes').then(function (r) {
      if (!r.ok) return;
      var pacientes = r.data.pacientes;

      if (patientsGrid) {
        var patientsEmpty = document.querySelector('[data-field="patients-empty"]');
        if (pacientes.length === 0) {
          if (patientsEmpty) patientsEmpty.style.display = '';
        } else {
          if (patientsEmpty) patientsEmpty.style.display = 'none';
          patientsGrid.innerHTML = pacientes.map(function (p) {
            var statusText = p.next_appointment ? 'Ativo' : 'Inativo';
            var statusClass = p.next_appointment ? '' : 'inactive';
            var next = p.next_appointment ? p.next_appointment.replace(' ', ' às ') : 'Sem consulta';
            return '' +
              '<div class="patient-card">' +
                '<div class="patient-card-head">' +
                  '<span class="avatar-circle">🙂</span>' +
                  '<div><strong>' + p.full_name + '</strong><span class="pt-status ' + statusClass + '">' + statusText + '</span></div>' +
                '</div>' +
                '<div class="patient-meta"><span>Próxima consulta</span><span>' + next + '</span></div>' +
                '<div class="patient-meta"><span>Última interação</span><span>' + (p.last_interaction || '—') + '</span></div>' +
                '<a href="mensagens.html" class="btn btn-primary btn-block">Abrir chat</a>' +
              '</div>';
          }).join('');
        }
      }

      if (chatList) {
        var chatEmpty = document.querySelector('[data-field="chat-empty"]');
        if (pacientes.length === 0) {
          if (chatEmpty) chatEmpty.style.display = '';
        } else {
          if (chatEmpty) chatEmpty.style.display = 'none';
          // TODO (backend): substituir "Toque para abrir a conversa" pela
          // última mensagem real assim que existir GET /api/conversas.
          chatList.innerHTML = pacientes.map(function (p) {
            return '' +
              '<a href="#" class="chat-row">' +
                '<span class="avatar-circle">🙂</span>' +
                '<div class="who"><strong>' + p.full_name + '</strong><p>Toque para abrir a conversa</p></div>' +
                '<div class="meta"><time>' + (p.last_interaction || '') + '</time></div>' +
              '</a>';
          }).join('');
        }
      }
    });
  }

  /* ---------------------------------------------------------
     5) Disponibilidade (disponibilidade.html)
  --------------------------------------------------------- */
  var availDaysEl = document.querySelector('[data-field="avail-days"]');
  if (availDaysEl) {
    var exceptionsListEl = document.querySelector('[data-field="exceptions-list"]');
    var exceptionForm = document.querySelector('[data-field="exception-form"]');
    var saveBtn = document.querySelector('[data-field="save-availability"]');
    var savedNote = document.querySelector('[data-field="avail-saved"]');
    var state = { slots: [], exceptions: [] };
    var DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Segunda..Domingo

    function renderDays() {
      availDaysEl.innerHTML = DAY_ORDER.map(function (weekday) {
        var ranges = state.slots
          .map(function (s, idx) { return { s: s, idx: idx }; })
          .filter(function (x) { return x.s.weekday === weekday; });

        var rangesHtml = ranges.map(function (x) {
          return '<div class="avail-range-row">' +
            '<input type="time" value="' + x.s.start_time + '" data-slot-start="' + x.idx + '">' +
            '<span>—</span>' +
            '<input type="time" value="' + x.s.end_time + '" data-slot-end="' + x.idx + '">' +
            '<button type="button" class="avail-remove-btn" data-slot-remove="' + x.idx + '">✕</button>' +
            '</div>';
        }).join('') || '<p class="slot-note" style="margin:0;">Sem horários neste dia.</p>';

        return '<div class="avail-day">' +
          '<div class="day-label">' + WEEKDAY_LABELS[weekday] + '</div>' +
          '<div class="avail-ranges" data-weekday="' + weekday + '">' + rangesHtml +
          '<button type="button" class="btn btn-secondary avail-add-btn" data-slot-add="' + weekday + '">+ Adicionar</button>' +
          '</div></div>';
      }).join('');
    }

    function renderExceptions() {
      exceptionsListEl.innerHTML = state.exceptions.map(function (e, idx) {
        return '<div class="exception-row">' +
          '<span class="ex-date">' + e.date + '</span>' +
          '<span class="ex-reason">' + (e.reason || 'Indisponível') + '</span>' +
          '<button type="button" class="avail-remove-btn" data-exception-remove="' + idx + '">✕</button>' +
          '</div>';
      }).join('');
    }

    getJson('/api/psicologo/disponibilidade').then(function (r) {
      if (!r.ok) return;
      state.slots = r.data.slots.map(function (s) { return { weekday: s.weekday, start_time: s.start_time, end_time: s.end_time }; });
      state.exceptions = r.data.exceptions.map(function (e) { return { date: e.date, reason: e.reason }; });
      renderDays();
      renderExceptions();
    });

    availDaysEl.addEventListener('click', function (ev) {
      var addBtn = ev.target.closest('[data-slot-add]');
      if (addBtn) {
        state.slots.push({ weekday: Number(addBtn.getAttribute('data-slot-add')), start_time: '09:00', end_time: '18:00' });
        renderDays();
        return;
      }
      var removeBtn = ev.target.closest('[data-slot-remove]');
      if (removeBtn) {
        state.slots.splice(Number(removeBtn.getAttribute('data-slot-remove')), 1);
        renderDays();
      }
    });

    availDaysEl.addEventListener('change', function (ev) {
      var startInput = ev.target.closest('[data-slot-start]');
      var endInput = ev.target.closest('[data-slot-end]');
      if (startInput) state.slots[Number(startInput.getAttribute('data-slot-start'))].start_time = startInput.value;
      if (endInput) state.slots[Number(endInput.getAttribute('data-slot-end'))].end_time = endInput.value;
    });

    exceptionsListEl.addEventListener('click', function (ev) {
      var removeBtn = ev.target.closest('[data-exception-remove]');
      if (!removeBtn) return;
      state.exceptions.splice(Number(removeBtn.getAttribute('data-exception-remove')), 1);
      renderExceptions();
    });

    if (exceptionForm) {
      exceptionForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var date = exceptionForm.date.value;
        var reason = exceptionForm.reason.value;
        if (!date) return;
        state.exceptions.push({ date: date, reason: reason });
        exceptionForm.reset();
        renderExceptions();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        fetch('/api/psicologo/disponibilidade', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ slots: state.slots, exceptions: state.exceptions }),
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data.ok && savedNote) {
              savedNote.style.display = '';
              setTimeout(function () { savedNote.style.display = 'none'; }, 2500);
            }
          });
      });
    }
  }

});
