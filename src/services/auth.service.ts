import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export const registerUser = async (email: string, password: string,role:string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
    if (role !== Role.USER && role !== Role.LAWYER) {
    throw new Error("Invalid role selected");
  }

  return prisma.user.create({
    data: {
      email,
      role: role as Role,
      password: hashedPassword,
    },
  });
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Invalid password");

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  return { token };
};
//testing2
//testing