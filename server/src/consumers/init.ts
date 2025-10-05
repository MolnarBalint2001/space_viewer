import { logger } from "../utils/logger"
import { registerDatasetProcessingConsumer } from "./datasetProcessing.consumer"
import { registerDatasetAttachmentTaggingConsumer } from "./datasetAttachmentTagging.consumer"

/**
 * RabbitMQ Consumer függvények inicializálása
 */
export default async function initializeRabbitMqConsumers() {
    try {
        logger.info("Initializing RabbitMQ consumers…")

        const consumers = [
            registerDatasetProcessingConsumer,
            registerDatasetAttachmentTaggingConsumer,
        ] as (()=>Promise<any>)[]
        await Promise.all(consumers.map((fn) => fn()))
    }
    catch (e) {
        logger.error("Consumer init failed", e)
        throw e;
    }

}
