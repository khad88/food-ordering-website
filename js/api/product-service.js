// Dịch vụ quản lý sản phẩm
const ProductService = {
    // Lấy tất cả sản phẩm
    getAllProducts: async () => {
        try {
            return await fetchAPI('/products');
        } catch (error) {
            throw error;
        }
    },
    
    // Lấy sản phẩm theo ID
    getProductById: async (id) => {
        try {
            return await fetchAPI(`/products/${id}`);
        } catch (error) {
            throw error;
        }
    },
    
    // Tạo sản phẩm mới
    createProduct: async (productData) => {
        try {
            return await fetchAPI('/products', 'POST', productData);
        } catch (error) {
            throw error;
        }
    },
    
    // Cập nhật sản phẩm
    updateProduct: async (id, productData) => {
        try {
            return await fetchAPI(`/products/${id}`, 'PUT', productData);
        } catch (error) {
            throw error;
        }
    },
    
    // Xóa sản phẩm
    deleteProduct: async (id) => {
        try {
            return await fetchAPI(`/products/${id}`, 'DELETE');
        } catch (error) {
            throw error;
        }
    },
    
    // Lấy tất cả danh mục
    getAllCategories: async () => {
        try {
            return await fetchAPI('/categories');
        } catch (error) {
            throw error;
        }
    },
    
    // Lấy sản phẩm theo danh mục
    getProductsByCategory: async (categoryId) => {
        try {
            return await fetchAPI(`/products/category/${categoryId}`);
        } catch (error) {
            throw error;
        }
    }
};