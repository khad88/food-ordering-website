// config/auth.config.js
module.exports = {
  secret: "khoafood-secret-key",
  jwtExpiration: 86400, // 24 giờ
  jwtRefreshExpiration: 604800, // 7 ngày
};