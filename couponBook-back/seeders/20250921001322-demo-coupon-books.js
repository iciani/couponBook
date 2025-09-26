"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "coupon_books",
      [
        {
          name: "Spring Sale 2024",
          code_pattern: "{BOOK_ID}-SPRING-####",
          total_codes: 1000,
          allow_multiple_redemptions_per_user: true,
          per_user_max_assigned_codes: 5,
          per_user_max_redemptions: 3,
          start_at: new Date(
            "2024-03-01"
          ),
          end_at: new Date(
            "2024-05-31"
          ),
          status: "ACTIVE",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: "Black Friday 2024",
          code_pattern: "{BOOK_ID}-BF2024-####",
          total_codes: 500,
          allow_multiple_redemptions_per_user: false,
          per_user_max_assigned_codes: 1,
          per_user_max_redemptions: 1,
          start_at: new Date(
            "2024-11-24"
          ),
          end_at: new Date(
            "2024-11-30"
          ),
          status: "ACTIVE",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: "Summer Promo",
          code_pattern: "{BOOK_ID}-SUMMER-####",
          total_codes: 200,
          allow_multiple_redemptions_per_user: true,
          per_user_max_assigned_codes: 3,
          per_user_max_redemptions: 2,
          start_at: new Date(
            "2024-06-01"
          ),
          end_at: new Date(
            "2024-08-31"
          ),
          status: "PAUSED",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: "Holiday Special",
          code_pattern: "{BOOK_ID}-HOLIDAY-####",
          total_codes: 300,
          allow_multiple_redemptions_per_user: false,
          per_user_max_assigned_codes: 2,
          per_user_max_redemptions: 1,
          start_at: new Date(
            "2024-12-01"
          ),
          end_at: new Date(
            "2024-12-31"
          ),
          status: "ARCHIVED",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(
    queryInterface,
    Sequelize
  ) {
    await queryInterface.bulkDelete(
      "coupon_books",
      null,
      {}
    );
  },
};
