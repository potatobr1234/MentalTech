// Mental Tech — psicologos.html
// Busca de verdade em GET /api/psicologos (só retorna profissionais com
// verification_status = "approved") e re-renderiza .pro-grid a cada mudança
// nos filtros. O filtro de "Atendimento" (online/presencial) é aplicado no
// cliente sobre o resultado já filtrado pelo servidor, já que é um campo de
// texto livre (modality) e não vale a pena ir ao servidor só por ele.

document.addEventListener('DOMContentLoaded', function () {
  var grid = document.querySelector('[data-pro-grid]');
  if (!grid) return;

  var searchInput = document.querySelector('[data-pro-search]');
  var specialtySelect = document.querySelector('[data-pro-specialty]');
  var modalitySelect = document.querySelector('[data-pro-modality]');
  var emptyBox = document.querySelector('[data-pro-empty]');
  var emptyText = document.querySelector('[data-pro-empty-text]');

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function renderCard(p) {
    var bio = p.bio
      ? escapeHtml(p.bio)
      : 'Este profissional ainda não preencheu sua biografia.';
    return '' +
      '<div class="pro-card" data-modality="' + escapeHtml((p.modality || '').toLowerCase()) + '">' +
        '<div class="pro-card-head">' +
          '<span class="avatar-circle">🧑‍⚕️</span>' +
          '<div class="who">' +
            '<strong>' + escapeHtml(p.full_name) + '</strong>' +
            '<span class="role">Psicólogo(a) · CRP ' + escapeHtml(p.crp_number) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="status-line"><span class="status-dot"></span> ' + escapeHtml(p.modality) + '</div>' +
        '<div class="pro-tags"><span class="tag">' + escapeHtml(p.specialty_label) + '</span></div>' +
        '<p class="desc">' + bio + '</p>' +
        '<a href="perfil-psicologo.html?id=' + p.id + '" class="btn btn-primary">Ver perfil</a>' +
      '</div>';
  }

  function applyModalityFilter() {
    var modality = (modalitySelect && modalitySelect.value) || '';
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.pro-card'));
    var visible = 0;
    cards.forEach(function (card) {
      var matches = !modality || (card.getAttribute('data-modality') || '').indexOf(modality) !== -1;
      card.style.display = matches ? '' : 'none';
      if (matches) visible++;
    });
    if (emptyBox) {
      emptyBox.classList.toggle('visible', visible === 0);
      if (visible === 0 && emptyText) {
        emptyText.textContent = cards.length === 0
          ? 'Ainda não há psicólogos disponíveis na plataforma. Assim que um profissional for aprovado, ele aparece aqui automaticamente.'
          : 'Nenhum psicólogo encontrado com esses filtros.';
      }
    }
  }

  var requestSeq = 0;
  function search() {
    var thisRequest = ++requestSeq;
    var params = new URLSearchParams();
    if (searchInput && searchInput.value.trim()) params.set('query', searchInput.value.trim());
    if (specialtySelect && specialtySelect.value) params.set('especialidade', specialtySelect.value);

    fetch('/api/psicologos?' + params.toString(), {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (thisRequest !== requestSeq) return; // resposta de uma busca antiga, ignora
        var psicologos = (data.ok && data.psicologos) || [];
        grid.innerHTML = psicologos.map(renderCard).join('');
        applyModalityFilter();
      });
  }

  var debounceTimer;
  function debouncedSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(search, 250);
  }

  if (searchInput) searchInput.addEventListener('input', debouncedSearch);
  if (specialtySelect) specialtySelect.addEventListener('change', search);
  if (modalitySelect) modalitySelect.addEventListener('change', applyModalityFilter);

  search();
});
