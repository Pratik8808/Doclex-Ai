import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(Role,"This is current role")
    if (!req.user) {
      console.log("unknowon role ther unauthroized")
      return res.status(401).json({ error: "Unauthorized" });
    }
 console.log(req.user.role,'from middleware')
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
  };
