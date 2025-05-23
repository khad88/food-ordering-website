// models/review.model.js
module.exports = (sequelize, Sequelize) => {
    const Review = sequelize.define("reviews", {
      review_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      product_id: {
        type: Sequelize.INTEGER
      },
      rating: {
        type: Sequelize.INTEGER,
        validate: {
          min: 1,
          max: 5
        }
      },
      comment: {
        type: Sequelize.TEXT
      },
      review_time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      timestamps: false
    });
  
    return Review;
  };