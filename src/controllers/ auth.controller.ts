import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";

  export const register = async (req: Request, res: Response) => {
    try {
      const { email, password ,role, firstName,
    lastName  } = req.body;
      const user = await registerUser(email, password,role,firstName,lastName);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};
