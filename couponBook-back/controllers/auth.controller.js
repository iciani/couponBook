const { User } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  authenticateToken,
  JWT_SECRET,
} = require("../middleware/auth");
const asyncH = require("../utils/asyncH");
const HttpError = require("../utils/HttpError");

const generateToken = user => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: "user",
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

module.exports = {
  // POST /v1/auth/login
  login: asyncH(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new HttpError(
        400,
        "Email and password are required"
      );
    }

    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'name', 'password', 'is_active'],
    });

    if (!user) {
      throw new HttpError(
        401,
        "Invalid credentials"
      );
    }

    if (!user.is_active) {
      throw new HttpError(
        401,
        "Account is inactive"
      );
    }


    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new HttpError(
        401,
        "Invalid credentials"
      );
    }

    const token = generateToken(user);
    await user.update({ last_login_at: new Date() });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  }),

  // GET /v1/auth/me
  me: asyncH(async (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }),

  // POST /v1/auth/refresh
  refresh: asyncH(async (req, res) => {
    const token = generateToken(
      req.user
    );

    res.json({
      message: "Token refreshed",
      token,
    });
  }),
};
