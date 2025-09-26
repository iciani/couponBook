"use strict";

const { Op } = require("sequelize");

const tableName = "CouponBook";

module.exports = (sequelize, DataTypes) => {
  const CouponBook = sequelize.define(
    tableName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          notNull: true,
        },
        set(value) {
          const trimmedValue = typeof value === "string" ? value.trim() : value;
          this.setDataValue("name", trimmedValue);
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      code_pattern: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value) {
          const trimmedValue = typeof value === "string" ? value.trim() : value;
          this.setDataValue("code_pattern", trimmedValue);
        }
      },
      total_codes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      allow_multiple_redemptions_per_user: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      per_user_max_assigned_codes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      per_user_max_redemptions: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      start_at: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: true,
        },
      },
      end_at: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: true,
        },
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "PAUSED", "ARCHIVED"),
        allowNull: false,
        defaultValue: "ACTIVE",
        validate: {
          notEmpty: true,
          notNull: true,
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
        order: [["name", "ASC"]],
      },
      scopes: {
        active: {
          where: {
            status: "ACTIVE",
          },
        },
        paused: {
          where: {
            status: "PAUSED",
          },
        },
        archived: {
          where: {
            status: "ARCHIVED",
          },
        },
        available: {
          where: {
            status: "ACTIVE",
            start_at: {
              [Op.lte]: new Date(),
            },
            end_at: {
              [Op.gte]: new Date(),
            },
          },
        },
        withDeleted: {
          paranoid: false,
        },
      },
      indexes: [
        {
          fields: ["status"],
        },
        {
          fields: ["start_at", "end_at"],
        },
      ],
    }
  );

  CouponBook.associate = (models) => {
    models.CouponBook.hasMany(models.CouponCode, {
      foreignKey: "book_id",
      as: "codes",
    });
  };

  return CouponBook;
};
