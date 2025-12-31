function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function formatStatus(kind, message) {
  const prefix = {
    info: 'Info',
    success: 'Ok',
    error: 'Erro'
  }[kind] || 'Info';
  return `${prefix}: ${message}`;
}

function assertElement(element, name) {
  if (!element) {
    throw new Error(`Missing ${name}`);
  }
  return element;
}

export function initUI() {
  const form = assertElement(document.getElementById('contact-form'), '#contact-form');
  const status = assertElement(document.getElementById('contact-status'), '#contact-status');
  const submitButton = assertElement(form.querySelector('button[type="submit"]'), 'contact submit button');

  const nameInput = assertElement(document.getElementById('contact-name'), '#contact-name');
  const emailInput = assertElement(document.getElementById('contact-email'), '#contact-email');
  const messageInput = assertElement(document.getElementById('contact-message'), '#contact-message');
  const honeypotInput = assertElement(document.getElementById('contact-company'), '#contact-company');

  const state = {
    csrfToken: '',
    csrfExpiresAt: 0,
    sending: false
  };

  const setStatus = (kind, message) => {
    status.textContent = formatStatus(kind, message);
  };

  const fetchCsrf = async () => {
    const now = Date.now();
    if (state.csrfToken && state.csrfExpiresAt - 5000 > now) {
      return state.csrfToken;
    }

    const response = await fetch('/api/csrf', {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error('csrf_failed');
    }

    const data = await response.json();
    state.csrfToken = data.token;
    state.csrfExpiresAt = data.expiresAt || 0;
    return state.csrfToken;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.sending) {
      return;
    }

    const payload = {
      name: normalizeWhitespace(nameInput.value),
      email: normalizeWhitespace(emailInput.value),
      message: messageInput.value.trim(),
      company: honeypotInput.value.trim()
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus('error', 'Preencha todos os campos obrigatorios.');
      return;
    }

    state.sending = true;
    submitButton.disabled = true;
    setStatus('info', 'Enviando...');

    try {
      const csrfToken = await fetchCsrf();
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });

      if (response.ok) {
        setStatus('success', 'Mensagem enviada com sucesso.');
        form.reset();
      } else if (response.status === 429) {
        setStatus('error', 'Limite de envios atingido. Tente mais tarde.');
      } else if (response.status === 403) {
        setStatus('error', 'Sessao expirada. Recarregue a pagina.');
      } else {
        setStatus('error', 'Nao foi possivel enviar agora.');
      }
    } catch (error) {
      setStatus('error', 'Falha de rede ao enviar.');
    } finally {
      state.sending = false;
      submitButton.disabled = false;
    }
  });

  return {
    setStatus
  };
}
