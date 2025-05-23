// Xử lý chuyển tab
document.querySelectorAll('.sidebar ul li a').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault();
        
        // Bỏ active ở tất cả link
        document.querySelectorAll('.sidebar ul li a').forEach(a => a.classList.remove('active'));
        this.classList.add('active');

        // Ẩn tất cả section
        document.querySelectorAll('main section').forEach(section => section.style.display = 'none');
        
        // Hiện section được chọn
        document.querySelector(this.getAttribute('href')).style.display = 'block';
    });
});

// Mặc định mở tab đơn hàng
document.querySelector('a[href="#orders"]').click();

// Xác nhận khi xóa đơn hàng
document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        if (confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
            event.target.closest('tr').remove(); // Xóa dòng đơn hàng
        }
    });
});
