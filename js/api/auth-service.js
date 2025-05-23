// Dịch vụ xác thực người dùng
const AuthService = {
    // Đăng nhập
    login: async (username, password) => {
        try {
            const response = await fetchAPI('/auth/signin', 'POST', { email, password }, false);
            if (response.accessToken) {
                localStorage.setItem('token', response.accessToken);
                localStorage.setItem('user', JSON.stringify(response.user));
            }
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    // Đăng ký
    register: async (userData) => {
        try {
            return await fetchAPI('/auth/signup', 'POST', userData, false);
        } catch (error) {
            throw error;
        }
    },
    
    // Đăng xuất
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login_register.html';
    },
    
    // Lấy thông tin người dùng hiện tại
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    },
    
    // Kiểm tra đã đăng nhập chưa
    isLoggedIn: () => {
        return localStorage.getItem('token') !== null;
    },
    
    // Kiểm tra có phải admin không
    isAdmin: () => {
        const user = AuthService.getCurrentUser();
        return user && user.roles && user.roles.includes('ROLE_ADMIN');
    },
    
    // Kiểm tra có phải nhân viên không
    isStaff: () => {
        const user = AuthService.getCurrentUser();
        return user && user.roles && user.roles.includes('ROLE_STAFF');
    }
};