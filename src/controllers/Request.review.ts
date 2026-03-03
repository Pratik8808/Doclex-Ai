

import { Request, Response } from "express";

import { requestLawyerReview } from "../services/document.service";



export const requestReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    const updated = await requestLawyerReview(id as string );

    return res.status(200).json({
      message: "Review requested successfully",
      document: updated,
    });

  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};