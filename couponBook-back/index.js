"use strict";

const app = require("./app");
const {
  sequelize,
} = require("./models");

// Inicializar worker de generación de códigos
require("./workers/codeGenerationWorker");

const PORT = process.env.PORT || 3009;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log(
      "Database connection established successfully"
    );

    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      await sequelize.sync({
        alter: true,
      });
      console.log(
        "Database models synchronized"
      );
    }

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
      console.log(
        `API Documentation: http://localhost:${PORT}`
      );
      console.log(
        `Health Check: http://localhost:${PORT}/health`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log(
    "\nShutting down server..."
  );
  await sequelize.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log(
    "\n Shutting down server..."
  );
  await sequelize.close();
  process.exit(0);
});

startServer();
