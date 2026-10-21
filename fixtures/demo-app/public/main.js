document.addEventListener('DOMContentLoaded', () => {
  const working = document.getElementById('working-action');
  const broken = document.getElementById('broken-action');

  if (working) {
    working.addEventListener('click', () => {
      working.textContent = 'Clicked!';
    });
  }

  // Intentional functional defect: broken button has no handler
  if (broken) {
    // no-op
  }

  // Intentional runtime error: reference undefined function
  setTimeout(() => {
    triggerUndefinedError();
  }, 100);
});
