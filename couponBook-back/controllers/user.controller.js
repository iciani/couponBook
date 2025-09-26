"use strict";

const { User } = require("../models");
const asyncH = require("../utils/asyncH");
const HttpError = require("../utils/HttpError");

module.exports = {
  // POST /v1/users
  create: asyncH(async (req, res) => {
    const { email, name } = req.body;

    const user = await User.create({
      email,
      name,
    });

    res
      .status(201)
      .json({ data: user });
  }),

  // GET /v1/users
  getAll: asyncH(async (req, res) => {
    const users = await User.findAll({
      order: [["created_at", "DESC"]],
      attributes: {
        exclude: ["password"],
      },
    });

    res.json({
      data: users,
    });
  }),

  // GET /v1/users/:id
  getById: asyncH(async (req, res) => {
    const user = await User.findByPk(
      req.params.id,
      {
        attributes: {
          exclude: ["password"],
        },
      }
    );

    if (!user) {
      throw new HttpError(
        404,
        "User not found"
      );
    }

    res.json({ data: user });
  }),

  // PUT /v1/users/:id
  update: asyncH(async (req, res) => {
    const { email, name } = req.body;

    const user = await User.findByPk(
      req.params.id
    );

    if (!user) {
      throw new HttpError(
        404,
        "User not found"
      );
    }

    await user.update({ email, name });

    res.json({ data: user });
  }),

  // DELETE /v1/users/:id
  delete: asyncH(async (req, res) => {
    const user = await User.findByPk(
      req.params.id
    );

    if (!user) {
      throw new HttpError(
        404,
        "User not found"
      );
    }

    await user.destroy();

    res.status(204).send();
  }),
};
