"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "coupon_redemptions",
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        coupon_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: "coupon_codes",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        assignment_id: {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: "coupon_assignments",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        redeemed_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
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

    await queryInterface.addIndex("coupon_redemptions", ["coupon_id", "redeemed_at"]);
    await queryInterface.addIndex("coupon_redemptions", ["assignment_id"]);
    await queryInterface.addIndex("coupon_redemptions", ["redeemed_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("coupon_redemptions");
  },
};
