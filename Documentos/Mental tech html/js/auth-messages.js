// Mental Tech — auth form alerts
// Reads ?error= / ?registered= from the URL (set by the backend redirects
// in server/routes/auth.js) and displays them inside the [data-form-alert]
// box present on login.html, cadastro.html, login-profissional.html and
// cadastro-profissional.html.

document.addEventListener('DOMContentLoaded', function () {
  var alertBox = document.querySelector('[data-form-alert]');
  var params = new URLSearchParams(window.location.search);

  // Propaga o ?redirect= (setado pelo guard de login no backend) para o
  // formulário, para que o usuário volte à página que tentou acessar.
  var redirectField = document.querySelector('[data-redirect-field]');
  var redirect = params.get('redirect');
  if (redirectField && redirect && redirect.startsWith('/')) {
    redirectField.value = redirect;
  }

  if (!alertBox) return;

  var error = params.get('error');
  var registered = params.get('registered');
  var pending = params.get('pending');
  var reset = params.get('reset');

  if (error) {
    alertBox.textContent = error;
    alertBox.classList.add('form-error', 'visible');
  } else if (registered) {
    alertBox.textContent = 'Conta criada com sucesso! Faça login para continuar.';
    alertBox.classList.add('form-success', 'visible');
  } else if (pending) {
    alertBox.textContent = 'Seu cadastro foi recebido e está em análise. Avisaremos por e-mail assim que for aprovado.';
    alertBox.classList.add('form-success', 'visible');
  } else if (reset) {
    alertBox.textContent = 'Senha redefinida com sucesso! Faça login com a nova senha.';
    alertBox.classList.add('form-success', 'visible');
  }
});
