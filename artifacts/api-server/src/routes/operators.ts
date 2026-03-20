import { Router, type IRouter } from "express";
import { db, operatorsTable } from "@workspace/db";
import { ListOperatorsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/operators", async (_req, res): Promise<void> => {
  const operators = await db.select().from(operatorsTable).orderBy(operatorsTable.name);
  res.json(ListOperatorsResponse.parse(operators));
});

export default router;
