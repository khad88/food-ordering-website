// Constants
const API_BASE_URL = 'http://localhost:8080/api';
const ITEMS_PER_PAGE = 5;
const RELATED_ITEMS_PER_PAGE = 4;

// DOM Elements
const productImage = document.getElementById('product-image');
const productName = document.getElementById('product-name');
const productRating = document.getElementById('product-rating');
const productDescription = document.getElementById('product-description');
const productPrice = document.getElementById('product-price');
const productCategory = document.getElementById('product-category');
const quantityElement = document.getElementById('quantity');
const reviewsContainer = document.getElementById('reviews-container');
const reviewForm = document.getElementById('review-form');
const loginPrompt = document.getElementById('login-prompt');
const reviewsPagination = document.getElementById('reviews-pagination');
const relatedProductsGrid = document.getElementById('related-products-grid');
const loadingElement = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const messageToast = document.getElementById('message-toast');
const toastMessage = document.getElementById('toast-message');

// State
let currentProduct = null;
let currentReviewPage = 1;
let currentRelatedPage = 1;
let totalReviewPages = 1;
let totalRelatedPages = 1;
let quantity = 1;
let isAuthenticated = false;
let authToken = null;

// Kiểm tra xác thực khi trang tải
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    loadProductDetails();
    setupEventListeners();
});

// Kiểm tra trạng thái xác thực
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const staff = JSON.parse(localStorage.getItem('staff'));
    const loginBtn = document.querySelector('.login-btn');
    const cartCount = document.querySelector('.cart-count');

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
        
        // Hiển thị form đánh giá
        if (reviewForm) reviewForm.style.display = 'block';
        if (loginPrompt) loginPrompt.style.display = 'none';
        
        // Cập nhật số lượng giỏ hàng nếu có
        if (cartCount && user) {
            updateCartCount();
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
        
        // Ẩn form đánh giá
        if (reviewForm) reviewForm.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
        
        if (cartCount) cartCount.textContent = '0';
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

// Thiết lập các event listeners
function setupEventListeners() {
    // Quantity buttons
    document.getElementById('decrease-qty').addEventListener('click', () => updateQuantity(-1));
    document.getElementById('increase-qty').addEventListener('click', () => updateQuantity(1));

    // Add to cart button
    document.getElementById('add-to-cart').addEventListener('click', addToCart);

    // Buy now button
    document.getElementById('buy-now').addEventListener('click', buyNow);

    // Review form
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }

    // Reviews pagination
    document.getElementById('prev-reviews').addEventListener('click', () => changePage(-1));
    document.getElementById('next-reviews').addEventListener('click', () => changePage(1));
}

// Lấy ID sản phẩm từ URL
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Tải thông tin chi tiết sản phẩm
async function loadProductDetails() {
    const productId = getProductIdFromUrl();
    if (!productId) {
        showError('Không tìm thấy ID sản phẩm');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Không thể tải thông tin sản phẩm');
        
        const data = await response.json();
        currentProduct = data.product;
        
        // Cập nhật UI sản phẩm
        productImage.src = currentProduct.image_url || '/images/default-food.png';
        productName.textContent = currentProduct.name;
        productDescription.textContent = currentProduct.description;
        productPrice.innerHTML = `<strong>${formatPrice(currentProduct.price)} VND</strong>`;
        productCategory.textContent = `Danh mục: ${currentProduct.category?.category_name || 'Không xác định'}`;
        
        // Tải đánh giá và cập nhật rating
        await loadReviews(1);
        
        // Tải sản phẩm liên quan
        if (currentProduct.category_id) {
            await loadRelatedProducts(currentProduct.category_id);
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Error loading product details:', error);
    }
}

// Cập nhật giao diện sản phẩm
function updateProductUI(product) {
    productImage.src = product.image_url || '/images/default-food.png';
    productName.textContent = product.name;
    productDescription.textContent = product.description;
    productPrice.innerHTML = `<strong>${formatPrice(product.price)} VND</strong>`;
    productCategory.textContent = `Danh mục: ${product.category?.category_name || 'Không xác định'}`;
    updateProductRating(product.average_rating);
}

// Cập nhật hiển thị đánh giá sao
function updateProductRating(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) {
        productRating.textContent = '☆☆☆☆☆ (Chưa có đánh giá)';
        return;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    const fullStars = '★'.repeat(Math.floor(averageRating));
    const emptyStars = '☆'.repeat(5 - Math.floor(averageRating));
    productRating.textContent = `${fullStars}${emptyStars} (${averageRating.toFixed(1)} - ${reviews.length} đánh giá)`;
}

// Cập nhật giao diện đánh giá
function updateReviewsUI(reviewsData) {
    if (!reviewsData || !reviewsData.reviews) {
        reviewsContainer.innerHTML = '<p>Chưa có đánh giá nào.</p>';
        reviewsPagination.style.display = 'none';
        return;
    }

    const { reviews, totalPages, currentPage } = reviewsData;
    
    if (!Array.isArray(reviews) || reviews.length === 0) {
        reviewsContainer.innerHTML = '<p>Chưa có đánh giá nào.</p>';
        reviewsPagination.style.display = 'none';
        return;
    }

    // Chỉ hiển thị tối đa 5 đánh giá
    const displayedReviews = reviews.slice(0, ITEMS_PER_PAGE);

    reviewsContainer.innerHTML = displayedReviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <span class="review-author">${review.user?.name || 'Người dùng ẩn danh'}</span>
                <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span>
            </div>
            <p class="review-comment">${review.comment || ''}</p>
            <span class="review-date">${formatDate(review.review_time)}</span>
        </div>
    `).join('');

    updatePagination(totalPages, currentPage);
}

// Thêm hàm format ngày tháng
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Cập nhật phân trang đánh giá
function updatePagination(totalPages, currentPage) {
    if (!totalPages || totalPages <= 1) {
        reviewsPagination.style.display = 'none';
        return;
    }

    reviewsPagination.style.display = 'flex';
    document.getElementById('reviews-page-info').textContent = `Trang ${currentPage || 1} / ${totalPages}`;
    document.getElementById('prev-reviews').disabled = !currentPage || currentPage <= 1;
    document.getElementById('next-reviews').disabled = !currentPage || currentPage >= totalPages;
}

// Thay đổi trang đánh giá
async function changePage(delta) {
    const newPage = currentReviewPage + delta;
    if (newPage >= 1 && newPage <= totalReviewPages) {
        await loadReviews(newPage);
    }
}

// Tải đánh giá
async function loadReviews(page) {
    try {
        const productId = getProductIdFromUrl();
        
        // Tải tất cả đánh giá để tính rating trung bình
        const allReviewsResponse = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (allReviewsResponse.ok) {
            const allReviewsData = await allReviewsResponse.json();
            updateProductRating(allReviewsData.reviews || []);
        }
        
        // Tải đánh giá cho trang hiện tại
        const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews?page=${page}&size=${ITEMS_PER_PAGE}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Không thể tải đánh giá');
        
        const data = await response.json();
        currentReviewPage = page;
        totalReviewPages = data.totalPages || 1;
        
        const reviewsData = {
            reviews: data.reviews || [],
            totalPages: data.totalPages || 1,
            currentPage: page
        };
        
        updateReviewsUI(reviewsData);
    } catch (error) {
        console.error('Error loading reviews:', error);
        showError('Không thể tải đánh giá. Vui lòng thử lại sau.');
    }
}

// Xử lý gửi đánh giá
async function handleReviewSubmit(event) {
    event.preventDefault();
    
    if (!isAuthenticated) {
        showMessage('Vui lòng đăng nhập để gửi đánh giá');
        return;
    }

    const rating = document.getElementById('review-rating').value;
    const comment = document.getElementById('review-text').value;
    const productId = getProductIdFromUrl();

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': authToken
            },
            body: JSON.stringify({ rating: parseInt(rating), comment })
        });

        if (!response.ok) throw new Error('Không thể gửi đánh giá');

        showMessage('Đánh giá của bạn đã được gửi thành công');
        document.getElementById('review-text').value = '';
        await loadProductDetails();
    } catch (error) {
        showError('Không thể gửi đánh giá. Vui lòng thử lại sau.');
    }
}

// Tải sản phẩm liên quan
async function loadRelatedProducts(categoryId, page = 1) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/category/${categoryId}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Không thể tải sản phẩm liên quan');
        
        const data = await response.json();
        const currentProductId = getProductIdFromUrl();
        
        // Lọc bỏ sản phẩm hiện tại
        const allRelatedProducts = data.products.filter(p => p.product_id.toString() !== currentProductId);
        
        // Tính toán phân trang
        const startIndex = (page - 1) * 4;
        const endIndex = startIndex + 4;
        const productsForCurrentPage = allRelatedProducts.slice(startIndex, endIndex);
        
        // Cập nhật thông tin phân trang
        currentRelatedPage = page;
        totalRelatedPages = Math.ceil(allRelatedProducts.length / 4);
        
        updateRelatedProductsUI(productsForCurrentPage);
        updateRelatedPagination();
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm liên quan:', error);
    }
}

// Cập nhật giao diện sản phẩm liên quan
function updateRelatedProductsUI(products) {
    if (products.length === 0) {
        relatedProductsGrid.innerHTML = '<p class="no-products">Không có sản phẩm liên quan.</p>';
        return;
    }
    
    relatedProductsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image_url || '/images/default-food.png'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p class="price">${formatPrice(product.price)} VND</p>
            <a href="/pages/product.html?id=${product.product_id}" class="view-product-btn">Xem chi tiết</a>
        </div>
    `).join('');
}

// Cập nhật phân trang sản phẩm liên quan
function updateRelatedPagination() {
    const paginationElement = document.getElementById('related-pagination');
    if (!paginationElement) {
        // Tạo element phân trang nếu chưa có
        const paginationHTML = `
            <div id="related-pagination" class="pagination">
                <button id="prev-related" class="pagination-btn">Trước</button>
                <span id="related-page-info">Trang ${currentRelatedPage} / ${totalRelatedPages}</span>
                <button id="next-related" class="pagination-btn">Sau</button>
            </div>
        `;
        relatedProductsGrid.insertAdjacentHTML('afterend', paginationHTML);
        
        // Thêm event listeners
        document.getElementById('prev-related').addEventListener('click', () => changeRelatedPage(-1));
        document.getElementById('next-related').addEventListener('click', () => changeRelatedPage(1));
    } else {
        // Cập nhật thông tin phân trang
        document.getElementById('related-page-info').textContent = `Trang ${currentRelatedPage} / ${totalRelatedPages}`;
        document.getElementById('prev-related').disabled = currentRelatedPage <= 1;
        document.getElementById('next-related').disabled = currentRelatedPage >= totalRelatedPages;
    }
    
    // Ẩn/hiện phân trang
    const paginationContainer = document.getElementById('related-pagination');
    if (paginationContainer) {
        paginationContainer.style.display = totalRelatedPages > 1 ? 'flex' : 'none';
    }
}

// Thay đổi trang sản phẩm liên quan
async function changeRelatedPage(delta) {
    const newPage = currentRelatedPage + delta;
    if (newPage >= 1 && newPage <= totalRelatedPages) {
        await loadRelatedProducts(currentProduct.category_id, newPage);
    }
}

// Cập nhật số lượng
function updateQuantity(delta) {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 99) {
        quantity = newQuantity;
        quantityElement.textContent = quantity;
    }
}

// Thêm vào giỏ hàng
async function addToCart() {
    if (!isAuthenticated) {
        showMessage('Vui lòng đăng nhập để thêm vào giỏ hàng', 'error');
        return;
    }
    
    if (!currentProduct) {
        showMessage('Không tìm thấy thông tin sản phẩm', 'error');
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/cart/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-access-token': authToken
            },
            body: JSON.stringify({
                product_id: currentProduct.product_id,
                quantity: quantity
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Không thể thêm vào giỏ hàng');
        }

        // Hiển thị thông báo thành công với chi tiết sản phẩm
        showMessage(`Đã thêm ${quantity} ${currentProduct.name} vào giỏ hàng!`, 'success');
        
        // Hiệu ứng thêm vào giỏ thành công
        const cartButton = document.querySelector('.cart');
        if (cartButton) {
            cartButton.classList.add('cart-added');
            setTimeout(() => {
                cartButton.classList.remove('cart-added');
            }, 1000);
        }

        updateCartCount();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Mua ngay
async function buyNow() {
    if (!isAuthenticated) {
        showMessage('Vui lòng đăng nhập để mua hàng', 'error');
        setTimeout(() => {
            window.location.href = 'login_register.html';
        }, 1000);
        return;
    }

    const productId = getProductIdFromUrl();
    window.location.href = `chart.html?buyNow=${productId}&quantity=${quantity}`;
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
            const cartCount = data.items?.length || 0;
            
            // Cập nhật UI số lượng trong giỏ hàng (nếu có element hiển thị)
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

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
}

function showLoading() {
    loadingElement.style.display = 'flex';
}

function hideLoading() {
    loadingElement.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function showMessage(message, type = 'info') {
    const toast = document.getElementById('message-toast');
    const toastMessage = document.getElementById('toast-message');
    
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
