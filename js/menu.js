function searchMenu() {
    const searchValue = document.getElementById('search').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    const price = document.getElementById('price-range').value;
    const menuItems = document.querySelectorAll('.menu-item');

    const searchResults = Array.from(menuItems).filter(item => {
        const itemName = item.querySelector('h2').textContent.toLowerCase();
        const itemCategory = item.getAttribute('data-category');
        const itemPrice = parseInt(item.getAttribute('data-price'), 10);

        return itemName.includes(searchValue) && 
               (category === 'all' || itemCategory === category) && 
               itemPrice <= price;
    });

    displaySearchResults(searchResults);
}

function displaySearchResults(results) {
    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.classList.add('search-results');

    results.forEach(item => {
        searchResultsContainer.appendChild(item.cloneNode(true));
    });

    document.body.innerHTML = '';
    document.body.appendChild(searchResultsContainer);
}

function updatePriceValue(value) {
    document.getElementById('price-value').textContent = `${value} VND`;
}