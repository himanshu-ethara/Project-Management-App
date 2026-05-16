/* auth.js — Login / Register UI logic */

const Auth = (() => {
  function init() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('go-register').addEventListener('click', (e) => {
      e.preventDefault();
      showRegister();
    });
    document.getElementById('go-login').addEventListener('click', (e) => {
      e.preventDefault();
      showLogin();
    });
  }

  function showLogin() {
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('register-view').classList.add('hidden');
  }

  function showRegister() {
    document.getElementById('register-view').classList.remove('hidden');
    document.getElementById('login-view').classList.add('hidden');
  }

  async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) return App.toast('Please fill all fields.', 'error');

    btn.disabled = true;
    btn.textContent = 'Signing in…';
    try {
      const { token, user } = await api.auth.login({ email, password });
      localStorage.setItem('tf_token', token);
      localStorage.setItem('tf_user', JSON.stringify(user));
      App.startApp(user);
    } catch (err) {
      App.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) return App.toast('Please fill all fields.', 'error');
    if (password.length < 6) return App.toast('Password must be at least 6 characters.', 'error');

    btn.disabled = true;
    btn.textContent = 'Creating account…';
    try {
      const { token, user } = await api.auth.register({ name, email, password });
      localStorage.setItem('tf_token', token);
      localStorage.setItem('tf_user', JSON.stringify(user));
      App.startApp(user);
    } catch (err) {
      App.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  }

  return { init, showLogin, showRegister };
})();
