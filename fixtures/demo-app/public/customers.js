document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('customer-form');
  const success = document.querySelector('[data-testid="success-message"]');

  if (form && success) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      // Intentional functional defect: never shows success message
      console.log('Customer form submitted but success state is not shown.');
    });
  }
});
