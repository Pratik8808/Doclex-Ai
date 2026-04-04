import { Request, Response } from "express";
import { runAIReview } from "../services/ai.service";

export const aiReview = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Document ID must be a valid string",
      });
    }

    const result = await runAIReview(id);

    return res.status(200).json({

      result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "AI review failed",
    });
  }
};