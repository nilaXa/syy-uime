export const inlineScript = `
(function () {
  const state = { dimension: 'all', severity: 'all' };
  const buttons = document.querySelectorAll('.filter');
  const findings = document.querySelectorAll('.finding');
  const emptyMessage = document.querySelector('.filtered-empty');

  function apply() {
    let visible = 0;
    findings.forEach((finding) => {
      const show =
        (state.dimension === 'all' || finding.dataset.dimension === state.dimension) &&
        (state.severity === 'all' || finding.dataset.severity === state.severity);
      finding.hidden = !show;
      if (show) visible++;
    });
    if (emptyMessage) emptyMessage.hidden = visible > 0 || findings.length === 0;
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.dataset.group;
      state[group] = button.dataset.filter;
      document.querySelectorAll('.filter[data-group="' + group + '"]').forEach((b) => b.classList.toggle('active', b === button));
      apply();
    });
  });
})();
`;
