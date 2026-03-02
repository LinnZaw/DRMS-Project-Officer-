const loginForm = document.getElementById('loginForm');
const loginPage = document.getElementById('loginPage');
const homePage = document.getElementById('homePage');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');

const demoCredentials = {
  email: 'officer@drms.org',
  password: 'password123'
};

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (email === demoCredentials.email && password === demoCredentials.password) {
    errorMessage.classList.add('d-none');
    loginPage.classList.add('d-none');
    homePage.classList.remove('d-none');
    return;
  }

  errorMessage.textContent = 'Invalid email or password. Try officer@drms.org / password123';
  errorMessage.classList.remove('d-none');
});

logoutBtn.addEventListener('click', () => {
  loginForm.reset();
  homePage.classList.add('d-none');
  loginPage.classList.remove('d-none');
});
