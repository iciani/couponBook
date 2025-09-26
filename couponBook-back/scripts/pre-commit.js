#!/usr/bin/env node

const {
  execSync,
} = require("child_process");
const path = require("path");

console.log(
  "🔧 Formateando migraciones..."
);

try {
  // Formatear migraciones
  execSync(
    "npm run format:migrations",
    {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    }
  );

  console.log(
    "Migraciones formateadas correctamente"
  );
} catch (error) {
  console.error(
    "Error formateando migraciones:",
    error.message
  );
  process.exit(1);
}
