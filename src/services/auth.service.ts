import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
//  

export const registerUser = async (email: string, password: string,role:string,firstName:string,lastName:string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
    if (role !== Role.USER && role !== Role.LAWYER) {
    throw new Error("Invalid role selected");
  }

 return prisma.user.create({
  data: {
    email,
    role: role as Role,
    password: hashedPassword,
    firstName,
    lastName
  },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    createdAt: true
  }
});

};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Invalid password");


  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );


  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_SECRET!,
    { expiresIn: "7d" }
  );

  // Save refresh token in DB
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
};

//testing2
//testing