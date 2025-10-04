import { logger } from "../utils/logger"

/**
 * RabbitMQ Consumer függvények inicializálása
 */
export default async function initializeRabbitMqConsumers() {
    try {
        logger.info("Initializing RabbitMQ consumers…")

        const consumers = [
            
        ] as (()=>Promise<any>)[]
        await Promise.all(consumers.map((fn) => fn()))
    }
    catch (e) {
        logger.error("Consumer init failed", e)
        throw e;
    }

}
