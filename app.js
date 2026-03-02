const loginForm = document.getElementById('loginForm');
const loginPage = document.getElementById('loginPage');
const homePage = document.getElementById('homePage');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const sidebarNavLinks = document.querySelectorAll('#sidebarNav .nav-link');

const demoCredentials = {
  email: 'officer@drms.org',
  password: 'password123'
};

const showDashboard = () => {
  loginPage.classList.add('d-none');
  homePage.classList.remove('d-none');
  homePage.classList.add('page-transition');
};

const showLogin = () => {
  homePage.classList.add('d-none');
  loginPage.classList.remove('d-none');
  loginPage.classList.add('page-transition');
};

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (email === demoCredentials.email && password === demoCredentials.password) {
    errorMessage.classList.add('d-none');
    showDashboard();
    return;
  }

  errorMessage.textContent = 'Invalid email or password. Try officer@drms.org / password123';
  errorMessage.classList.remove('d-none');
});

sidebarNavLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('data-target');

    if (!targetId) {
      return;
    }

    event.preventDefault();
    sidebarNavLinks.forEach((item) => item.classList.remove('active'));
    link.classList.add('active');

    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

logoutBtn.addEventListener('click', () => {
  loginForm.reset();
  showLogin();
});
