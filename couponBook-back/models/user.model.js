"use strict";

const { Op } = require("sequelize");

const tableName = "User";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    tableName,
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
          notNull: true,
        },
        set(value) {
          const trimmedValue = typeof value === "string" ? value.trim().toLowerCase() : value;
          this.setDataValue("email", trimmedValue);
        }
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
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          notNull: true,
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        validate: {
          notEmpty: true,
        },
      },
      last_login_at: {
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
        order: [["name", "ASC"]],
      },
      scopes: {
        active: {
          where: {
            is_active: true,
          },
        },
        inactive: {
          where: {
            is_active: false,
          },
        },
        withDeleted: {
          paranoid: false,
        },
      },
      indexes: [
        {
          unique: true,
          fields: ["email"],
        }
      ],
    }
  );

  User.associate = (models) => {
    models.User.hasMany(models.CouponAssignment, { foreignKey: "user_id", as: "assignments" });
  };

  return User;
};
