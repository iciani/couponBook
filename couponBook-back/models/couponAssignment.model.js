"use strict";

const { Op } = require("sequelize");

const tableName = "CouponAssignment";

module.exports = (sequelize, DataTypes) => {
  const CouponAssignment = sequelize.define(
    tableName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      coupon_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "coupon_codes",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      assigned_at: {
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
        order: [["created_at", "DESC"]],
      },
      scopes: {
        byUser(userId) {
          return {
            where: { user_id: userId },
          };
        },
        byCode(codeId) {
          return {
            where: { coupon_id: codeId },
          };
        },
        withDeleted: {
          paranoid: false,
        },
      },
      indexes: [
        {
          fields: ["user_id"],
        },
        {
          fields: ["coupon_id"],
        },
      ],
    }
  );

  CouponAssignment.associate = (models) => {
    models.CouponAssignment.belongsTo(models.CouponCode, {
      foreignKey: "coupon_id",
      as: "code",
    });
    models.CouponAssignment.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    models.CouponAssignment.hasMany(models.CouponRedemption, {
      foreignKey: "assignment_id",
      as: "redemptions",
    });
  };

  return CouponAssignment;
};
