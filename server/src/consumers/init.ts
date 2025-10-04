import { logger } from "../utils/logger"
import { registerDatasetProcessingConsumer } from "./datasetProcessing.consumer"

/**
 * RabbitMQ Consumer függvények inicializálása
 */
export default async function initializeRabbitMqConsumers() {
    try {
        logger.info("Initializing RabbitMQ consumers…")

        const consumers = [
            registerDatasetProcessingConsumer,
        ] as (()=>Promise<any>)[]
        await Promise.all(consumers.map((fn) => fn()))
    }
    catch (e) {
        logger.error("Consumer init failed", e)
        throw e;
    }

}
