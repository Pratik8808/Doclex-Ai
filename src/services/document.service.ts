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




export const getAvailableDocuments = async () => {
  return prisma.document.findMany({
    where: {
      status: "REVIEW_REQUESTED",
      lawyerId: null, // Not yet assigned
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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

export const assignLawyer = async (
  documentId: string,
  lawyerId: string
) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.status !== "REVIEW_REQUESTED") {
    throw new Error("Document not available for assignment");
  }

  if (document.lawyerId) {
    throw new Error("Document already assigned");
  }

  return prisma.document.update({
    where: { id: documentId },
    data: {
      lawyerId,
    },
  });
};

// to get there own doucumets
export const getMyAssignedDocuments = async (lawyerId: string) => {
  return prisma.document.findMany({
    where: {
      lawyerId: lawyerId,
    },
    include: {
      user: {
    select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      aiResult: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};


// Both for user and Lawyer to get there own doucments
export const getDocumentById = async (
  documentId: string,
  userId: string,
  role: "USER" | "LAWYER"
) => {

  const document = await prisma.document.findMany({
    where: { id: userId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          email: true,
        },
      },
      aiResult: true,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // 🔐 Access Control
  console.log(document.userId)
  if (role === "USER" && document.userid !== userId) {
    throw new Error("Not authorized from userId");
  }

  if (role === "LAWYER" && document.lawyerid !== userId) {
    throw new Error("Not authorized");
  }

  return document;
};