import { prisma } from "../prisma";

export const requestLawyerReview = async (documentId: string) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.status !== "AI_REVIEWED") {
    throw new Error("Document must be AI reviewed first");
  }

  return prisma.document.update({
    where: { id: documentId },
    data: {
      status: "REVIEW_REQUESTED",
    },
  });

};


// by the user to the lawayer is requested 
export const getReviewQueue = async () => {
  return prisma.document.findMany({
    where: {
      status: "REVIEW_REQUESTED",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      aiResult: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};


// Lawyer APi made for review check
export const lawyerDecision = async (
  documentId: string,
  decision: "APPROVED" | "REJECTED",
  lawyerId: string,
  feedback?: string
) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.status !== "REVIEW_REQUESTED") {
    throw new Error("Document not ready for lawyer decision");
  }

  return prisma.document.update({
    where: { id: documentId },
    data: {
      status: decision,
      lawyerId,
    },
  });
};