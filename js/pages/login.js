document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra nếu đã đăng nhập thì chuyển về trang chủ
    if (AuthService.isLoggedIn()) {
        const user = AuthService.getCurrentUser();
        if (AuthService.isAdmin()) {
            window.location.href = '/admin_dashboard.html';
        } else if (AuthService.isStaff()) {
            window.location.href = '/employee_dashboard.html';
        } else {
            window.location.href = '/home.html';
        }
        return;
    }
    
    // Form đăng nhập
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await AuthService.login(email, password);
                
                // Chuyển hướng người dùng dựa trên vai trò
                if (AuthService.isAdmin()) {
                    window.location.href = '/admin_dashboard.html';
                } else if (AuthService.isStaff()) {
                    window.location.href = '/employee_dashboard.html';
                } else {
                    window.location.href = '/home.html';
                }
            } catch (error) {
                showNotification('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!', 'error');
            }
        });
    }
    
    // Form đăng ký
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            // Kiểm tra mật khẩu xác nhận
            if (password !== confirmPassword) {
                showNotification('Mật khẩu xác nhận không khớp!', 'error');
                return;
            }
            
            try {
                await AuthService.register({
                    username,
                    email,
                    password
                });
                
                showNotification('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
                
                // Chuyển qua tab đăng nhập
                document.getElementById('login').click();
                
                // Reset form đăng ký
                registerForm.reset();
            } catch (error) {
                showNotification('Đăng ký thất bại: ' + error.message, 'error');
            }
        });
    }
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Xóa class "active" khỏi tất cả các tab và form
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            // Thêm class "active" vào tab được nhấn
            tab.classList.add('active');

            // Hiển thị form tương ứng với tab được nhấn
            const target = tab.getAttribute('data-tab');
            document.getElementById(`${target}-form`).classList.add('active');
        });
    });
});