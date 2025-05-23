document.getElementById('review-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('reviewer-name').value;
    const text = document.getElementById('review-text').value;
    const rating = document.getElementById('review-rating').value;

    const newReview = document.createElement('div');
    newReview.classList.add('review-item');
    newReview.innerHTML = `
        <div class="review-header">
            <img src="/images/user_avatar.png" alt="${name}" class="avatar">
            <h3>${name}</h3>
        </div>
        <p>"${text}"</p>
        <div class="rating">${'⭐'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
        <div class="shop-reply">
            <div class="reply-header">
                <img src"/images/shop_avatar.jpg" alt="Shop" class="avatar">
                <strong>Phản hồi từ shop:</strong>
            </div>
            <p>Cảm ơn bạn đã đánh giá! Chúng tôi luôn cố gắng cải thiện dịch vụ.</p>
        </div>
    `;

    document.querySelector('.reviews-container').appendChild(newReview);


    document.getElementById('review-form').reset();
});