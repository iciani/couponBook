"use strict";

const { Op } = require("sequelize");

const tableName = "CouponRedemption";

module.exports = (sequelize, DataTypes) => {
  const CouponRedemption = sequelize.define(
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
      assignment_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: "coupon_assignments",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      redeemed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
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
        order: [["redeemed_at", "DESC"]],
      },
      scopes: {
        byUser(userId) {
          return {
            include: [{
              model: models.CouponAssignment,
              where: { user_id: userId }
            }]
          };
        },
        byBook(bookId) {
          return {
            include: [{
              model: models.CouponCode,
              where: { book_id: bookId }
            }]
          };
        },
        byCode(codeId) {
          return {
            where: { coupon_id: codeId },
          };
        },
        byAssignment(assignmentId) {
          return {
            where: { assignment_id: assignmentId },
          };
        },
        byDateRange(startDate, endDate) {
          return {
            where: {
              redeemed_at: {
                [Op.between]: [startDate, endDate],
              },
            },
          };
        },
        recent(days = 30) {
          const date = new Date();
          date.setDate(date.getDate() - days);
          return {
            where: {
              redeemed_at: {
                [Op.gte]: date,
              },
            },
          };
        },
        withDeleted: {
          paranoid: false,
        },
      },
      indexes: [
        {
          fields: ["coupon_id", "redeemed_at"],
        },
        {
          fields: ["assignment_id"],
        },
        {
          fields: ["redeemed_at"],
        },
      ],
    }
  );

  CouponRedemption.associate = (models) => {
    models.CouponRedemption.belongsTo(models.CouponCode, {
      foreignKey: "coupon_id",
      as: "couponCode",
    });
    models.CouponRedemption.belongsTo(models.CouponAssignment, {
      foreignKey: "assignment_id",
      as: "assignment",
    });
  };

  return CouponRedemption;
};
