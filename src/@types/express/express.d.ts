import "express";

declare global {
  namespace Express {
    interface User {
      user_id: string;
      account_id: string;
      role: "admin" | "member";
    }

    interface Request {
      user?: User;
    }
  }
}

export {};