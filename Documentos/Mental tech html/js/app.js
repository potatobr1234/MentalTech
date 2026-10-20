// Mental Tech — logged-in app behaviour
// Loaded together with main.js on: psicologos.html, perfil-psicologo.html,
// agendar-consulta.html, agendamento-confirmado.html, dashboard.html,
// agenda.html and configuracoes.html.
//
// Everything here is front-end only (filtering/selecting what is already
// in the DOM). Real data fetching / persistence is left as TODO markers
// for the backend integration — see comments near each block.

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------------------
     1) "Encontre um profissional" (psicologos.html) foi movido para
     js/psicologos-busca.js, que busca de verdade em
     GET /api/psicologos?query=&especialidade= em vez de filtrar cards
     client-side.
  --------------------------------------------------------- */

  /* ---------------------------------------------------------
     1b) "Conteúdos" — search + category filter
     TODO (backend): once articles are loaded from
     GET /api/conteudos?query=&categoria=, this client-side
     filter can be removed (or kept as an instant local
     refinement layer on top of server results).
  --------------------------------------------------------- */
  var contentGrid = document.querySelector('[data-content-grid]');
  if (contentGrid) {
    var contentSearch = document.querySelector('[data-content-search]');
    var categoryChips = document.querySelectorAll('[data-category-chip]');
    var contentCards = Array.prototype.slice.call(contentGrid.querySelectorAll('.content-card'));
    var contentEmpty = document.querySelector('[data-content-empty]');
    var activeCategory = 'todos';

    function applyContentFilters() {
      var term = (contentSearch && contentSearch.value || '').trim().toLowerCase();
      var visibleCount = 0;

      contentCards.forEach(function (card) {
        var haystack = card.getAttribute('data-search') || '';
        var category = card.getAttribute('data-category') || '';

        var matchesTerm = !term || haystack.indexOf(term) !== -1;
        var matchesCategory = activeCategory === 'todos' || category === activeCategory;
        var show = matchesTerm && matchesCategory;

        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      if (contentEmpty) contentEmpty.classList.toggle('visible', visibleCount === 0);
    }

    if (contentSearch) contentSearch.addEventListener('input', applyContentFilters);

    if (categoryChips.length) {
      categoryChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          categoryChips.forEach(function (c) { c.classList.remove('active'); });
          chip.classList.add('active');
          activeCategory = chip.getAttribute('data-category-chip') || 'todos';
          applyContentFilters();
        });
      });
    }
  }

  /* ---------------------------------------------------------
     2) "Agende sua consulta" (agendar-consulta.html) foi movido para
     js/booking.js, que já busca os horários reais do profissional.
  --------------------------------------------------------- */

  /* ---------------------------------------------------------
     3) Agenda — Dia / Semana / Mês view toggle (visual only)
     TODO (backend): swap the rendered grid for the selected
     range using data from GET /api/agenda?view=&data=
  --------------------------------------------------------- */
  var viewButtons = document.querySelectorAll('[data-view-btn]');
  if (viewButtons.length) {
    viewButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        viewButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  }

});
