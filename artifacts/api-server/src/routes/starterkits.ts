import { Router, type IRouter } from "express";
import { db, starterKitsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListStarterKitsResponse, GetStarterKitResponse, GetStarterKitParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/starterkits", async (_req, res): Promise<void> => {
  const kits = await db.select().from(starterKitsTable).orderBy(starterKitsTable.name);
  res.json(ListStarterKitsResponse.parse(kits));
});

router.get("/starterkits/:starterKitId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.starterKitId) ? req.params.starterKitId[0] : req.params.starterKitId;
  const params = GetStarterKitParams.safeParse({ starterKitId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [kit] = await db.select().from(starterKitsTable).where(eq(starterKitsTable.id, params.data.starterKitId));
  if (!kit) {
    res.status(404).json({ error: "Starter kit not found" });
    return;
  }

  res.json(GetStarterKitResponse.parse(kit));
});

export default router;
