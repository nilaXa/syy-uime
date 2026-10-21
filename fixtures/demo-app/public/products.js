document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('[data-testid="search"]');
  const searchButton = document.querySelector('[data-testid="search-button"]');
  const results = document.querySelector('[data-testid="results"]');

  if (searchButton && results) {
    searchButton.addEventListener('click', () => {
      const query = searchInput?.value ?? '';
      results.innerHTML = query
        ? `<div class="card product-card"><h2>Results for "${query}"</h2><p>1 match found</p></div>`
        : '<div class="card product-card"><p>Enter a search term</p></div>';
    });
  }
});
