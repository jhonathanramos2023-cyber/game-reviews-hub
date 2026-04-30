import { schedule } from "node-cron";
import { runAgente } from "./agente";
import { logger } from "../lib/logger";

export function startAgenteCron() {
  schedule("0 6 * * *", async () => {
    logger.info("Agente IA: inicio de ejecución programada (6am)");
    const result = await runAgente();
    logger.info(result, "Agente IA: ejecución programada completada");
  });

  logger.info("Agente IA: cron programado para las 6:00 AM UTC diariamente");
}
