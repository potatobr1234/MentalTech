// Mental Tech — preenche o nome/perfil exibido no cabeçalho (".user-chip")
// e os campos de formulário da conta com os dados reais da sessão
// (GET /api/auth/me), em vez do texto fixo de exemplo que existia nessas
// páginas antes de haver um backend de verdade.
//
// Carregado em todas as páginas que exigem login: psicologos.html,
// perfil-psicologo.html, agendar-consulta.html, agendamento-confirmado.html,
// dashboard.html, agenda.html e configuracoes.html.

document.addEventListener('DOMContentLoaded', function () {
  var nameEls = document.querySelectorAll('[data-session-name]');
  var roleEls = document.querySelectorAll('[data-session-role]');
  var greetingEls = document.querySelectorAll('[data-session-first-name]');
  var fillEls = document.querySelectorAll('[data-session-fill]');

  if (!nameEls.length && !roleEls.length && !greetingEls.length && !fillEls.length) return;

  fetch('/api/auth/me', {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  })
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (data) {
      if (!data || !data.authenticated) {
        // O backend já bloqueia o acesso a estas páginas sem login (redireciona
        // para login.html), então isso só deve acontecer se a sessão expirou
        // entre o carregamento da página e esta checagem.
        window.location.href = '/login.html?error=' + encodeURIComponent('Sua sessão expirou. Faça login novamente.');
        return;
      }

      var account = data.account;
      var roleLabel = account.type === 'professional' ? 'Profissional' : 'Jovem';
      var firstName = (account.full_name || '').trim().split(' ')[0] || account.full_name;

      nameEls.forEach(function (el) { el.textContent = account.full_name; });
      roleEls.forEach(function (el) { el.textContent = roleLabel; });
      greetingEls.forEach(function (el) { el.textContent = firstName; });

      // Campos de formulário (ex: "Nome completo"/"E-mail" em configuracoes.html)
      fillEls.forEach(function (el) {
        var field = el.getAttribute('data-session-fill');
        if (field && account[field] !== undefined) {
          el.value = account[field];
        }
      });
    })
    .catch(function () {
      // Falha de rede: mantém o texto padrão ("Minha conta" etc.) em vez de travar a página.
    });
});
