// ===================================================
// YOHAKU RBAC — Seed Script
// ===================================================
//
// Run: npx ts-node scripts/seed-permissions.ts
// Or:  npx tsx scripts/seed-permissions.ts
// ===================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS_SEED = [
  { permission: "read_reports", label: "レポート閲覧", description: "通報・レポートの閲覧", category: "moderation" },
  { permission: "manage_reports", label: "レポート管理", description: "通報・レポートの対応・解決", category: "moderation" },
  { permission: "manage_users", label: "ユーザー管理", description: "ユーザー情報の編集・停止", category: "administration" },
  { permission: "manage_billing", label: "課金管理", description: "課金情報・プラン管理", category: "billing" },
  { permission: "manage_ai", label: "AI管理", description: "AIモデル・プロンプト管理", category: "ai" },
  { permission: "manage_roles", label: "ロール管理", description: "ロール・権限の割り当て", category: "system" },
  { permission: "view_analytics", label: "アナリティクス", description: "分析ダッシュボードの閲覧", category: "analytics" },
  { permission: "manage_system", label: "システム管理", description: "システム全体の管理操作", category: "system" },
];

const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  moderator: ["read_reports", "manage_reports"],
  admin: ["read_reports", "manage_reports", "manage_users", "manage_billing", "view_analytics"],
  owner: ["read_reports", "manage_reports", "manage_users", "manage_billing", "manage_ai", "manage_roles", "view_analytics", "manage_system"],
};

async function main() {
  console.log("🌱 Seeding permissions...");

  // Create permissions
  const createdPermissions: Record<string, string> = {};
  for (const perm of PERMISSIONS_SEED) {
    const created = await prisma.permission.upsert({
      where: { permission: perm.permission },
      update: {
        label: perm.label,
        description: perm.description,
        category: perm.category,
      },
      create: perm,
    });
    createdPermissions[perm.permission] = created.id;
    console.log(`  ✓ Permission: ${perm.permission}`);
  }

  // Create role-permission mappings
  console.log("\n🔗 Seeding role-permission mappings...");
  for (const [role, permissionKeys] of Object.entries(ROLE_PERMISSIONS_MAP)) {
    for (const permKey of permissionKeys) {
      const permissionId = createdPermissions[permKey];
      if (!permissionId) {
        console.warn(`  ⚠ Permission not found: ${permKey}, skipping for role ${role}`);
        continue;
      }
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role,
            permissionId,
          },
        },
        update: {},
        create: {
          role,
          permissionId,
        },
      });
      console.log(`  ✓ ${role} → ${permKey}`);
    }
  }

  // Assign default "owner" role to SUPER_ADMIN users (migration)
  console.log("\n👤 Assigning system roles to existing users...");
  const adminUsers = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
  });

  for (const user of adminUsers) {
    const role = user.role === "SUPER_ADMIN" ? "owner" : "admin";
    await prisma.systemRoleAssignment.upsert({
      where: {
        userId_role: {
          userId: user.id,
          role,
        },
      },
      update: {},
      create: {
        userId: user.id,
        role,
        assignedBy: "system",
      },
    });
    console.log(`  ✓ ${user.email || user.id} → ${role}`);
  }

  console.log("\n✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });