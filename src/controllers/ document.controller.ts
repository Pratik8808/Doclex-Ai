import { Request, Response } from "express";
import { PrismaClient, DocumentSource } from "@prisma/client";

const prisma = new PrismaClient();

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }
   console.log(req,"This is request")
    const { title } = req.body;
    const userId = req.user.id; // from auth middleware

    const document = await prisma.document.create({
      data: {
        title:req.file.filename,
        filePath: req.file.path,
        source: DocumentSource.UPLOAD,
        userId,
      },
    });

    return res.status(201).json({
      message: "Document uploaded successfully",
      document,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Upload failed",
    });
  }
};
