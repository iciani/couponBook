"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const bcrypt = require("bcryptjs");

    await queryInterface.bulkInsert(
      "users",
      [
        {
          id: 1,
          email: "admin@couponbook.com",
          name: "Admin User",
          password: await bcrypt.hash(
            "admin123",
            10
          ),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          email: "john.doe@example.com",
          name: "John Doe",
          password: await bcrypt.hash(
            "password123",
            10
          ),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 3,
          email:
            "jane.smith@example.com",
          name: "Jane Smith",
          password: await bcrypt.hash(
            "password123",
            10
          ),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 4,
          email:
            "mike.wilson@example.com",
          name: "Mike Wilson",
          password: await bcrypt.hash(
            "password123",
            10
          ),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 5,
          email:
            "sarah.jones@example.com",
          name: "Sarah Jones",
          password: await bcrypt.hash(
            "password123",
            10
          ),
          is_active: true,
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
      "users",
      null,
      {}
    );
  },
};
