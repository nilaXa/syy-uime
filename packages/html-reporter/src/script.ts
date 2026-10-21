export const inlineScript = `
(function () {
  const filters = document.querySelectorAll('.filter');
  const findings = document.querySelectorAll('.finding');

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      const dimension = button.getAttribute('data-filter');

      filters.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      findings.forEach((finding) => {
        const findingDimension = finding.getAttribute('data-dimension');
        if (dimension === 'all' || findingDimension === dimension) {
          finding.style.display = '';
        } else {
          finding.style.display = 'none';
        }
      });
    });
  });
})();
`;
