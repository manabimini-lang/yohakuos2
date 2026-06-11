const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME || "Admin";

  if (!email || !password) {
    throw new Error(
      "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required to create the admin account.",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role: "ADMIN",
      plan: "premium",
    },
    create: {
      email,
      name,
      password: hashedPassword,
      role: "ADMIN",
      plan: "premium",
    },
  });

  await prisma.systemRoleAssignment.upsert({
    where: {
      userId_role: {
        userId: user.id,
        role: "admin",
      },
    },
    update: {
      assignedBy: "system",
    },
    create: {
      userId: user.id,
      role: "admin",
      assignedBy: "system",
    },
  });

  console.log(`Created/updated admin user: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
