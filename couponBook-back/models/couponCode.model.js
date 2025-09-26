"use strict";

const { Op } = require("sequelize");

const tableName = "CouponCode";

module.exports = (sequelize, DataTypes) => {
  const CouponCode = sequelize.define(
    tableName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      book_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "coupon_books",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          notNull: true,
        },
        set(value) {
          const trimmedValue = typeof value === "string" ? value.trim().toUpperCase() : value;
          this.setDataValue("code", trimmedValue);
        }
      },
      status: {
        type: DataTypes.ENUM(
          "AVAILABLE",
          "ASSIGNED",
          "TEMP_LOCKED",
          "REDEEMED",
          "DISABLED",
          "EXPIRED"
        ),
        allowNull: false,
        defaultValue: "AVAILABLE",
        validate: {
          notEmpty: true,
          notNull: true,
        },
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: true,
        },
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: true,
        },
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        validate: {
          isDate: true,
        },
      },
    },
    {
      underscored: true,
      paranoid: true,
      defaultScope: {
        order: [["code", "ASC"]],
      },
      scopes: {
        available: {
          where: {
            status: "AVAILABLE",
          },
        },
        assigned: {
          where: {
            status: "ASSIGNED",
          },
        },
        tempLocked: {
          where: {
            status: "TEMP_LOCKED",
          },
        },
        redeemed: {
          where: {
            status: "REDEEMED",
          },
        },
        disabled: {
          where: {
            status: "DISABLED",
          },
        },
        expired: {
          where: {
            status: "EXPIRED",
          },
        },
        byBook(bookId) {
          return {
            where: {
              book_id: bookId,
            },
          };
        },
        byUser(userId) {
          return {
            where: {
            },
          };
        },
        withDeleted: {
          paranoid: false,
        },
      },
      indexes: [
        {
          unique: true,
          fields: ["code"],
        },
        {
          fields: ["book_id", "status"],
        },
        {
          fields: [],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  CouponCode.associate = (models) => {
    models.CouponCode.belongsTo(models.CouponBook, {
      foreignKey: "book_id",
      as: "book",
    });
    models.CouponCode.hasMany(models.CouponAssignment, {
      foreignKey: "coupon_id",
      as: "assignments",
    });
    models.CouponCode.hasMany(models.CouponRedemption, {
      foreignKey: "coupon_id",
      as: "redemptions",
    });
  };

  return CouponCode;
};
