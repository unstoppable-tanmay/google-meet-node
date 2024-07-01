import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export const validate =
  (schema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.body)
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      return res
        .status(400)
        .json({ data: error, success: false, message: "Post Data Error" });
    }
  };