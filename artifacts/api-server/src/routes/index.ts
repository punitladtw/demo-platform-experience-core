import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import teamsRouter from "./teams";
import namespacesRouter from "./namespaces";
import starterKitsRouter from "./starterkits";
import deploymentsRouter from "./deployments";
import evidenceRouter from "./evidence";
import operatorsRouter from "./operators";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(teamsRouter);
router.use(namespacesRouter);
router.use(starterKitsRouter);
router.use(deploymentsRouter);
router.use(evidenceRouter);
router.use(operatorsRouter);
router.use(usersRouter);

export default router;
