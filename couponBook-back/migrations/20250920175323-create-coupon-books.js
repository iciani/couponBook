"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "coupon_books",
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        code_pattern: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        total_codes: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        allow_multiple_redemptions_per_user: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        per_user_max_assigned_codes: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        per_user_max_redemptions: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        start_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        end_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM(
            "ACTIVE",
            "PAUSED",
            "ARCHIVED"
          ),
          allowNull: false,
          defaultValue: "ACTIVE",
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null,
        },
      }
    );

    await queryInterface.addIndex("coupon_books", ["status"]);
    await queryInterface.addIndex("coupon_books", ["start_at", "end_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("coupon_books");
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_coupon_books_status";`
    );
  },
};
