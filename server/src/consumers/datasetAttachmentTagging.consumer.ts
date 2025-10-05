import { DatasetAttachmentUploadedEvent } from "../@types/event.type";
import { processAttachmentTagging } from "../services/attachmentTagging.service";
import { subscribe } from "../services/rabbitmq.service";
import { logger } from "../utils/logger";

const QUEUE_NAME = "dataset-attachment-tagging";
const ROUTING_KEY = "dataset.attachment.uploaded";

export async function registerDatasetAttachmentTaggingConsumer() {
  await subscribe(QUEUE_NAME, ROUTING_KEY, async (payload) => {
    const event = payload as DatasetAttachmentUploadedEvent;
    try {
      await processAttachmentTagging(event);
    } catch (err) {
      logger.error("Attachment tagging consumer error", {
        err,
        datasetId: event?.payload?.datasetId,
        attachmentId: event?.payload?.attachmentId,
      });
      throw err;
    }
  });
}

export default registerDatasetAttachmentTaggingConsumer;
