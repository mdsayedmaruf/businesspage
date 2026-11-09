const FAILURE = 'That did not send. Please call us instead, or try again in a minute.';
const DEMO = 'This is a demo site, so nothing was sent. On a live site, this request goes straight to the business inbox.';
const WAIT = 'Finishing a quick spam check. Please press send again in a moment.';
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

// Turnstile is heavy, so it loads only once a visitor starts using the form.
let turnstileRequested = false;
function loadTurnstile() {
  if (turnstileRequested) return;
  turnstileRequested = true;
  const script = document.createElement('script');
  script.src = TURNSTILE_URL;
  script.async = true;
  document.head.append(script);
}

document.querySelectorAll<HTMLFormElement>('form[data-quote-form]').forEach((form) => {
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const usesTurnstile = form.querySelector('.cf-turnstile') !== null;

  if (usesTurnstile) form.addEventListener('focusin', loadTurnstile, { once: true });

  const show = (message: string) => {
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (form.dataset.demo === 'true') {
      show(DEMO);
      return;
    }
    if (usesTurnstile) {
      loadTurnstile();
      const token = form.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]');
      if (!token?.value) {
        show(WAIT);
        return;
      }
    }
    if (button) button.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { accept: 'application/json' },
      });
      if (response.ok) {
        window.location.assign('/thanks/');
        return;
      }
      show(FAILURE);
    } catch {
      show(FAILURE);
    }
    // Each spam-check token works once, so a retry needs a fresh one.
    window.turnstile?.reset();
    if (button) button.disabled = false;
  });
});

export {};
