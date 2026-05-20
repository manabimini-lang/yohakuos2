import { prisma } from "@/lib/prisma";

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async updateRole(id: string, role: any) {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async updatePlan(id: string, plan: string) {
    return prisma.user.update({
      where: { id },
      data: { plan },
    });
  }
}

export const userRepository = new UserRepository();
