import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "manabi.mini@gmail.com";
  const password = "yohaku-admin";
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
    create: {
      email,
      name: "YOHAKU Admin",
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log("Admin account created/updated:");
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
