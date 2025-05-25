// Enhanced Menu.js with robust error handling and debugging

// ========== GLOBAL VARIABLES ==========
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';
let categories = [];

// API Configuration - Try different possible URLs
const API_CONFIGS = [
  
  'http://127.0.0.1:8080/api'
];

let API_BASE_URL = API_CONFIGS[0]; // Default
let serverAvailable = false;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Menu page loaded, initializing...');
    checkAuthentication();
    initializePage();
});

// Kiểm tra trạng thái xác thực
function checkAuthentication() {
    console.log('🔐 Checking authentication status...');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const staff = JSON.parse(localStorage.getItem('staff'));
    const loginBtn = document.querySelector('.login-btn');
    const cartCount = document.querySelector('.cart-count');

    if (token && (user || staff)) {
        // Người dùng đã đăng nhập
        console.log('✅ User is authenticated');
        const currentUser = user || staff;
        
        if (loginBtn) {
            loginBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>${currentUser.name}</span>
            `;
            loginBtn.href = 'user_profile.html';
            loginBtn.onclick = handleLogout;
        }
        
        // Cập nhật số lượng giỏ hàng nếu có
        if (cartCount && user) {
            updateCartCount();
        }
    } else {
        // Chưa đăng nhập
        console.log('❌ User is not authenticated');
        if (loginBtn) {
            loginBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>Đăng nhập</span>
            `;
            loginBtn.href = 'login_register.html';
            loginBtn.onclick = null;
        }
        if (cartCount) cartCount.textContent = '0';
    }
}

// Xử lý đăng xuất
function handleLogout(event) {
    event.preventDefault();
    console.log('🚪 Logging out...');
    
    // Xóa thông tin đăng nhập
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('staff');
    localStorage.removeItem('cart');
    
    // Cập nhật UI
    checkAuthentication();
    
    // Thông báo
    showMessage('Đăng xuất thành công!', 'success');
    
    // Chuyển hướng về trang chủ
    setTimeout(() => {
        window.location.href = 'home.html';
    }, 1000);
}

// Cập nhật số lượng giỏ hàng
async function updateCartCount() {
    console.log('🛒 Updating cart count...');
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: {
                'Accept': 'application/json',
                'x-access-token': token
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const cartCount = data.items?.length || 0;
            
            const cartCountElement = document.querySelector('.cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = cartCount;
                cartCountElement.style.display = cartCount > 0 ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('❌ Error updating cart count:', error);
    }
}

// Initialize the page
async function initializePage() {
    console.log('📋 Setting up page...');
    setupEventListeners();
    
    // Find working API URL
    await findWorkingAPI();
    
    if (serverAvailable) {
        await loadCategories();
        await loadProducts();
    } else {
        // Show fallback content
        showFallbackContent();
    }
}

// Find working API endpoint
async function findWorkingAPI() {
    console.log('🔍 Finding working API endpoint...');
    
    for (const apiUrl of API_CONFIGS) {
        try {
            console.log(`🔗 Testing: ${apiUrl}`);
            const response = await fetch(`${apiUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ API working at: ${apiUrl}`, data);
                API_BASE_URL = apiUrl;
                serverAvailable = true;
                return;
            }
        } catch (error) {
            console.log(`❌ Failed to connect to: ${apiUrl}`, error.message);
        }
    }
    
    // If all failed, try a simple products endpoint
    for (const apiUrl of API_CONFIGS) {
        try {
            console.log(`🔗 Testing products endpoint: ${apiUrl}`);
            const response = await fetch(`${apiUrl}/products?page=1&size=1`);
            
            if (response.ok) {
                console.log(`✅ Products endpoint working at: ${apiUrl}`);
                API_BASE_URL = apiUrl;
                serverAvailable = true;
                return;
            }
        } catch (error) {
            console.log(`❌ Products endpoint failed: ${apiUrl}`, error.message);
        }
    }
    
    console.error('❌ No working API endpoint found');
    serverAvailable = false;
}

// Show fallback content when server is unavailable
function showFallbackContent() {
    console.log('📋 Showing fallback content...');
    
    // Show fallback categories
    categories = [
        { category_id: 1, category_name: 'Ăn nhẹ' },
        { category_id: 2, category_name: 'Món chính' },
        { category_id: 3, category_name: 'Đồ uống' },
        { category_id: 4, category_name: 'Tráng miệng' }
    ];
    renderCategoryFilters();
    
    // Show fallback products
    const fallbackProducts = [
        {
            product_id: 1,
            name: 'Bánh mì thịt nướng',
            price: 25000,
            description: 'Bánh mì thơm ngon với thịt nướng',
            image_url: '/images/banh-mi.jpg',
            category: { category_name: 'Ăn nhẹ' },
            is_active: true
        },
        {
            product_id: 2,
            name: 'Phở bò',
            price: 45000,
            description: 'Phở bò truyền thống Hà Nội',
            image_url: '/images/pho-bo.jpg',
            category: { category_name: 'Món chính' },
            is_active: true
        },
        {
            product_id: 3,
            name: 'Cà phê sữa đá',
            price: 20000,
            description: 'Cà phê sữa đá truyền thống',
            image_url: '/images/ca-phe.jpg',
            category: { category_name: 'Đồ uống' },
            is_active: true
        },
        {
            product_id: 4,
            name: 'Chè đậu xanh',
            price: 15000,
            description: 'Chè đậu xanh mát lành',
            image_url: '/images/che.jpg',
            category: { category_name: 'Tráng miệng' },
            is_active: true
        }
    ];
    
    renderProducts(fallbackProducts);
    
    // Show warning about server connection
    showError('⚠️ Không thể kết nối đến server. Đang hiển thị dữ liệu mẫu.\n\nVui lòng kiểm tra:\n• Server có đang chạy không?\n• Đúng địa chỉ API không?\n• Có vấn đề về CORS không?');
}

// Setup event listeners
function setupEventListeners() {
    console.log('👂 Setting up event listeners...');
    
    // Search input Enter key
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('🔍 Search triggered by Enter key');
                searchProducts();
            }
        });
        console.log('✅ Search input listener added');
    } else {
        console.warn('⚠️ Search input not found');
    }
}

// ========== CATEGORY FUNCTIONS ==========

// Load categories from API
async function loadCategories() {
    if (!serverAvailable) {
        console.log('🔄 Server unavailable, using fallback categories');
        return;
    }
    
    console.log('📂 Loading categories...');
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        console.log('📂 Categories response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        categories = await response.json();
        console.log('📂 Categories loaded:', categories);
        renderCategoryFilters();
    } catch (error) {
        console.error('❌ Error loading categories:', error);
        console.log('🔄 Using fallback categories...');
        
        // Fallback categories if API fails
        categories = [
            { category_id: 1, category_name: 'Ăn nhẹ' },
            { category_id: 2, category_name: 'Món chính' },
            { category_id: 3, category_name: 'Đồ uống' },
            { category_id: 4, category_name: 'Tráng miệng' }
        ];
        renderCategoryFilters();
    }
}

// Render category filter buttons
function renderCategoryFilters() {
    console.log('🏷️ Rendering category filters...');
    const filtersContainer = document.getElementById('categoryFilters');
    if (!filtersContainer) {
        console.error('❌ Category filters container not found');
        return;
    }
    
    // Start with "Tất cả" button
    let filtersHTML = '<button class="active" onclick="filterByCategory(\'all\')">Tất cả</button>';
    
    // Add category buttons
    categories.forEach(category => {
        filtersHTML += `<button onclick="filterByCategory('${category.category_id}')">${category.category_name}</button>`;
    });
    
    filtersContainer.innerHTML = filtersHTML;
    console.log('✅ Category filters rendered');
}

// Filter products by category
function filterByCategory(categoryId) {
    console.log('🏷️ Filtering by category:', categoryId);
    currentCategory = categoryId;
    currentPage = 1;
    currentSearch = '';
    
    // Clear search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Update active filter button
    if (event && event.target) {
        updateActiveFilterButton(event.target);
    }
    
    // Load products for selected category
    loadProducts(currentPage, categoryId);
}

// Update active filter button
function updateActiveFilterButton(activeButton) {
    const filterButtons = document.querySelectorAll('.filters button');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// ========== PRODUCT FUNCTIONS ==========

// Load products from API
async function loadProducts(page = 1, categoryId = null, searchKeyword = null) {
    if (!serverAvailable) {
        console.log('🔄 Server unavailable, cannot load products');
        return;
    }
    
    console.log('🍽️ Loading products...', { page, categoryId, searchKeyword });
    showLoading(true);
    hideError();
    
    try {
        let url = `${API_BASE_URL}/products?page=${page}&size=8`;
        
        if (searchKeyword) {
            // Search products - replace spaces with hyphens for URL
            const encodedKeyword = encodeURIComponent(searchKeyword.replace(/\s+/g, '-'));
            url = `${API_BASE_URL}/products/search/${encodedKeyword}?page=${page}&size=8`;
            console.log('🔍 Search URL:', url);
        } else if (categoryId && categoryId !== 'all') {
            // Get products by category
            url = `${API_BASE_URL}/products/category/${categoryId}?page=${page}&size=8`;
            console.log('🏷️ Category URL:', url);
        } else {
            console.log('📋 All products URL:', url);
        }
        
        console.log('📡 Fetching from:', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📊 API Data received:', data);
        console.log('🍽️ Products count:', data.products?.length || 0);
        
        renderProducts(data.products || []);
        renderPagination(data);
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        console.error('🔍 Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        let errorMessage = 'Không thể tải danh sách sản phẩm. ';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Không thể kết nối đến server.\n\n';
            errorMessage += 'Vui lòng kiểm tra:\n';
            errorMessage += '• Server có đang chạy không?\n';
            errorMessage += '• Chạy lệnh: npm start hoặc node server.js\n';
            errorMessage += '• Kiểm tra port 8080 có khả dụng không?\n';
            errorMessage += '• Đảm bảo không có tường lửa chặn kết nối';
        } else if (error.message.includes('404')) {
            errorMessage += 'Endpoint API không tồn tại.';
        } else if (error.message.includes('500')) {
            errorMessage += 'Lỗi server nội bộ.';
        } else {
            errorMessage += error.message;
        }
        
        showError(errorMessage);
        renderProducts([]); // Show empty state
    } finally {
        showLoading(false);
    }
}

// Render products grid
function renderProducts(products) {
    console.log('🎨 Rendering products:', products.length);
    const menuGrid = document.getElementById('menuGrid');
    if (!menuGrid) {
        console.error('❌ Menu grid container not found');
        return;
    }
    
    if (products.length === 0) {
        console.log('📭 No products to display');
        menuGrid.innerHTML = `
            <div class="error" style="grid-column: 1 / -1;">
                <p>🍽️ Không tìm thấy sản phẩm nào.</p>
                <p>Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác.</p>
            </div>
        `;
        return;
    }
    
    let productsHTML = '';
    
    products.forEach((product, index) => {
        console.log(`🍽️ Rendering product ${index + 1}:`, product.name);
        const imageUrl = product.image_url || '/images/default-food.png';
        const categoryName = product.category ? product.category.category_name : 'Chưa phân loại';
        const description = product.description || 'Món ăn ngon và hấp dẫn';
        const stockStatus = product.is_active ? 'Còn hàng' : 'Hết hàng';
        
        productsHTML += `
            <div class="menu-item">
                <a href="product.html?id=${product.product_id}">
                    <div class="image-container">
                        <img src="${imageUrl}" alt="${product.name}" 
                             onerror="this.onerror=null; this.src='/images/default-food.png'"
                             loading="lazy">
                    </div>
                </a>
                <h3>${formatPrice(product.price)} VND</h3>
                <h2>${product.name}</h2>
                <p>${description}</p>
                <p>Danh mục: ${categoryName}</p>
                <p class="status-${product.is_active ? 'active' : 'inactive'}">${stockStatus}</p>
            </div>
        `;
    });
    
    menuGrid.innerHTML = productsHTML;
    console.log('✅ Products rendered successfully');
}

// ========== PAGINATION FUNCTIONS ==========

// Render pagination
function renderPagination(data) {
    console.log('📄 Rendering pagination:', data);
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        console.error('❌ Pagination container not found');
        return;
    }
    
    if (!data.totalPages || data.totalPages <= 1) {
        paginationContainer.style.display = 'none';
        console.log('📄 Pagination hidden (only 1 page or less)');
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button onclick="changePage(${data.currentPage - 1})" ${data.currentPage <= 1 ? 'disabled' : ''}>
            ‹ Trước
        </button>
    `;
    
    // Page numbers
    const startPage = Math.max(1, data.currentPage - 2);
    const endPage = Math.min(data.totalPages, data.currentPage + 2);
    
    // First page
    if (startPage > 1) {
        paginationHTML += `<button onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<button disabled>...</button>`;
        }
    }
    
    // Page numbers around current page
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})" ${i === data.currentPage ? 'class="active"' : ''}>
                ${i}
            </button>
        `;
    }
    
    // Last page
    if (endPage < data.totalPages) {
        if (endPage < data.totalPages - 1) {
            paginationHTML += `<button disabled>...</button>`;
        }
        paginationHTML += `<button onclick="changePage(${data.totalPages})">${data.totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button onclick="changePage(${data.currentPage + 1})" ${data.currentPage >= data.totalPages ? 'disabled' : ''}>
            Sau ›
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
    console.log('✅ Pagination rendered');
}

// Change page
function changePage(page) {
    console.log('📄 Changing to page:', page);
    if (page < 1) return;
    
    currentPage = page;
    
    // Scroll to top of menu
    const menuSection = document.querySelector('main');
    if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    if (currentSearch) {
        loadProducts(page, null, currentSearch);
    } else {
        loadProducts(page, currentCategory);
    }
}

// ========== SEARCH FUNCTIONS ==========

// Search products
function searchProducts() {
    console.log('🔍 Search function called');
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        console.error('❌ Search input not found');
        return;
    }
    
    const keyword = searchInput.value.trim();
    console.log('🔍 Search keyword:', keyword);
    
    if (keyword === '') {
        console.log('🔍 Empty search, showing all products');
        // If search is empty, show all products
        currentSearch = '';
        currentCategory = 'all';
        currentPage = 1;
        
        // Reset active filter
        resetActiveFilter();
        loadProducts();
        return;
    }
    
    currentSearch = keyword;
    currentCategory = 'all';
    currentPage = 1;
    
    // Reset active filter
    resetActiveFilter();
    loadProducts(currentPage, null, keyword);
}

// Reset active filter to "Tất cả"
function resetActiveFilter() {
    const filterButtons = document.querySelectorAll('.filters button');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    if (filterButtons.length > 0) {
        filterButtons[0].classList.add('active'); // "Tất cả" button
    }
}

// ========== UTILITY FUNCTIONS ==========

// Format price with Vietnamese number format
function formatPrice(price) {
    if (!price) return '0';
    return new Intl.NumberFormat('vi-VN').format(price);
}

// Show/hide loading state
function showLoading(show) {
    console.log(show ? '⏳ Showing loading...' : '✅ Hiding loading...');
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
}

// Show error message
function showError(message) {
    console.error('❌ Showing error:', message);
    const errorState = document.getElementById('errorState');
    if (errorState) {
        errorState.innerHTML = message.replace(/\n/g, '<br>');
        errorState.style.display = 'block';
    }
}

// Hide error message
function hideError() {
    const errorState = document.getElementById('errorState');
    if (errorState) {
        errorState.style.display = 'none';
    }
}

// ========== DEBUG FUNCTIONS ==========

// Manual debug function you can call from browser console
window.debugAPI = async function() {
    console.log('🔧 Debug API function called');
    console.log('🔧 Current API_BASE_URL:', API_BASE_URL);
    console.log('🔧 Server available:', serverAvailable);
    
    // Test all API configs
    for (const apiUrl of API_CONFIGS) {
        try {
            console.log(`🔧 Testing: ${apiUrl}`);
            const response = await fetch(`${apiUrl}/products?page=1&size=1`);
            console.log(`🔧 ${apiUrl} - Status:`, response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`🔧 ${apiUrl} - Data:`, data);
            }
        } catch (error) {
            console.log(`🔧 ${apiUrl} - Error:`, error.message);
        }
    }
};

// Quick server check function
window.checkServer = async function() {
    console.log('🔍 Checking server status...');
    await findWorkingAPI();
    console.log('✅ Server check complete. Available:', serverAvailable);
    return serverAvailable;
};

// ========== GLOBAL FUNCTIONS (called from HTML) ==========
// These functions need to be global to be called from onclick attributes

// Make functions globally available
window.filterByCategory = filterByCategory;
window.searchProducts = searchProducts;
window.changePage = changePage;

console.log('✅ Enhanced Menu.js loaded with robust error handling');

// DOM Elements
const messageToast = document.getElementById('message-toast');
const toastMessage = document.getElementById('toast-message');

// State
let isAuthenticated = false;
let authToken = null;

// Kiểm tra xác thực khi trang tải
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
});

// Kiểm tra trạng thái xác thực
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const staff = JSON.parse(localStorage.getItem('staff'));
    const loginBtn = document.querySelector('.login-btn');
    const cartCount = document.querySelector('.cart-count');
    const startBtn = document.querySelector('.primary-btn');
    const ctaBtn = document.querySelector('.cta-section .secondary-btn');

    if (token && (user || staff)) {
        // Người dùng đã đăng nhập
        isAuthenticated = true;
        authToken = token;
        const currentUser = user || staff;
        
        if (loginBtn) {
            loginBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>${currentUser.name}</span>
            `;
            loginBtn.href = 'user_profile.html';
            loginBtn.onclick = handleLogout;
        }
        
        // Cập nhật số lượng giỏ hàng nếu có
        if (cartCount && user) {
            updateCartCount();
        }

        // Cập nhật nút CTA
        if (startBtn) {
            startBtn.href = 'menu.html';
            startBtn.textContent = 'Đặt hàng ngay';
        }

        if (ctaBtn) {
            ctaBtn.href = 'menu.html';
            ctaBtn.textContent = 'Đặt hàng ngay';
        }
    } else {
        // Chưa đăng nhập
        isAuthenticated = false;
        authToken = null;
        
        if (loginBtn) {
            loginBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>Đăng nhập</span>
            `;
            loginBtn.href = 'login_register.html';
            loginBtn.onclick = null;
        }
        
        if (cartCount) cartCount.textContent = '0';

        // Reset nút CTA về trạng thái mặc định
        if (startBtn) {
            startBtn.href = 'login_register.html';
            startBtn.textContent = 'Bắt đầu';
        }

        if (ctaBtn) {
            ctaBtn.href = 'login_register.html';
            ctaBtn.textContent = 'Đăng nhập';
        }
    }
}

// Xử lý đăng xuất
function handleLogout(event) {
    event.preventDefault();
    
    // Xóa thông tin đăng nhập
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('staff');
    localStorage.removeItem('cart');
    
    // Cập nhật trạng thái và UI
    isAuthenticated = false;
    authToken = null;
    checkAuthentication();
    
    // Thông báo
    showMessage('Đăng xuất thành công!', 'success');
    
    // Chuyển hướng về trang chủ
    setTimeout(() => {
        window.location.href = 'home.html';
    }, 1000);
}

// Cập nhật số lượng sản phẩm trong giỏ hàng
async function updateCartCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: {
                'Accept': 'application/json',
                'x-access-token': authToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            const cartCount = data.cart?.cart_items?.length || 0;
            
            // Cập nhật UI số lượng trong giỏ hàng
            const cartCountElement = document.querySelector('.cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = cartCount;
                cartCountElement.style.display = cartCount > 0 ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Hiển thị thông báo
function showMessage(message, type = 'info') {
    const toast = document.getElementById('message-toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) {
        // Tạo element toast nếu chưa có
        const toastHTML = `
            <div id="message-toast" class="message-toast">
                <span id="toast-message"></span>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
    }
    
    // Thêm class cho kiểu thông báo
    toast.className = `message-toast ${type}`;
    toastMessage.textContent = message;
    
    // Hiển thị toast
    toast.style.display = 'block';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    // Animation hiển thị
    toast.style.animation = 'slideIn 0.5s ease-out';
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        // Animation ẩn
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-100%)';
        toast.style.animation = 'slideOut 0.5s ease-in';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 500);
    }, 3000);
} 