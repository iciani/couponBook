const jwt = require("jsonwebtoken");
const HttpError = require("../utils/HttpError");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-secret-key-change-in-production";

// Middleware para verificar JWT
const authenticateToken = (
  req,
  res,
  next
) => {
  const authHeader =
    req.headers["authorization"];
  const token =
    authHeader &&
    authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return next(
      new HttpError(
        401,
        "Access token required"
      )
    );
  }

  jwt.verify(
    token,
    JWT_SECRET,
    (err, user) => {
      if (err) {
        return next(
          new HttpError(
            403,
            "Invalid or expired token"
          )
        );
      }

      req.user = user;
      next();
    }
  );
};

// Middleware opcional para JWT (no falla si no hay token)
const optionalAuth = (
  req,
  res,
  next
) => {
  const authHeader =
    req.headers["authorization"];
  const token =
    authHeader &&
    authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(
    token,
    JWT_SECRET,
    (err, user) => {
      if (err) {
        req.user = null;
      } else {
        req.user = user;
      }
      next();
    }
  );
};

// Middleware para verificar roles (si implementas roles)
const requireRole = roles => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new HttpError(
          401,
          "Authentication required"
        )
      );
    }

    if (
      !roles.includes(req.user.role)
    ) {
      return next(
        new HttpError(
          403,
          "Insufficient permissions"
        )
      );
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  JWT_SECRET,
};
