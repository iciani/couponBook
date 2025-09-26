"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "coupon_codes",
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        book_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: "coupon_books",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        code: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        status: {
          type: Sequelize.ENUM(
            "AVAILABLE",
            "ASSIGNED",
            "TEMP_LOCKED",
            "REDEEMED",
            "DISABLED",
            "EXPIRED"
          ),
          allowNull: false,
          defaultValue: "AVAILABLE",
        },
        assigned_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        used_at: {
          type: Sequelize.DATE,
          allowNull: true,
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

    await queryInterface.addIndex("coupon_codes", ["code"], {
      unique: true,
    });
    await queryInterface.addIndex("coupon_codes", ["book_id", "status"]);
    await queryInterface.addIndex("coupon_codes", ["status"]);
    await queryInterface.addIndex("coupon_codes", ["book_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("coupon_codes");
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_coupon_codes_status";`
    );
  },
};
