import { DatasetFileUploadedEvent } from "../@types/event.type";
import { processDatasetFile } from "../services/datasetProcessing.service";
import { subscribe } from "../services/rabbitmq.service";
import { logger } from "../utils/logger";

const QUEUE_NAME = "dataset-processing";
const ROUTING_KEY = "dataset.file.uploaded";

export async function registerDatasetProcessingConsumer() {
  await subscribe(QUEUE_NAME, ROUTING_KEY, async (payload) => {
    const event = payload as DatasetFileUploadedEvent;
    try {
      await processDatasetFile(event);
    } catch (err) {
      logger.error("Dataset processing consumer failed", {
        err,
        datasetFileId: event?.payload?.datasetFileId,
      });
      // hiba esetén a consumer már lekezelte (nack) -> subscribe nacked false? 
      // Itt hagyjuk, mert a subscribe wrapper ack-ol siker esetén, hiba esetén exception -> nack
      throw err;
    }
  });
}

export default registerDatasetProcessingConsumer;

