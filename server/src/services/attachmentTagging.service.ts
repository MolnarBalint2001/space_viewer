import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatasetAttachmentUploadedEvent } from "../@types/event.type";
import { downloadObject } from "./minio.service";
import { extractTextFromPdf } from "./pdf.service";
import { generateAttachmentTags } from "./openai.service";
import {
  findDatasetAttachmentById,
} from "../repositories/datasetAttachment.repository";
import { upsertAttachmentGraph } from "./graph.service";
import { logger } from "../utils/logger";
import { sendAttachmentTaggingUpdate } from "./websocket.service";

function buildTempDir(): Promise<string> {
  const prefix = path.join(os.tmpdir(), "attachment-tags-");
  return fs.mkdtemp(prefix);
}

export async function processAttachmentTagging(
  event: DatasetAttachmentUploadedEvent,
): Promise<void> {
  const { attachmentId, datasetId, ownerId, originalFilename } = event.payload;
  const attachment = await findDatasetAttachmentById(attachmentId, true);
  if (!attachment || attachment.datasetId !== datasetId) {
    logger.warn("Nem található melléklet a címkézéshez", { attachmentId, datasetId });
    return;
  }

  await sendAttachmentTaggingUpdate(ownerId, {
    type: "attachment:tagging",
    datasetId,
    attachmentId,
    status: "processing",
    filename: attachment.originalFilename,
  });

  let tempDir: string | null = null;
  let localPath: string | null = null;

  try {
    tempDir = await buildTempDir();
    const extension = path.extname(attachment.originalFilename || "") || ".pdf";
    localPath = path.join(tempDir, `${attachment.id}${extension}`);

    await downloadObject(attachment.objectKey, localPath);
    const text = await extractTextFromPdf(localPath);

    const { tags } = await generateAttachmentTags({
      title: attachment.originalFilename,
      content: text || attachment.originalFilename,
    });

    await upsertAttachmentGraph({
      datasetId,
      datasetName: attachment.dataset?.name ?? null,
      attachmentId,
      attachmentName: attachment.originalFilename,
      ownerId,
      tags,
    });

    await sendAttachmentTaggingUpdate(ownerId, {
      type: "attachment:tagging",
      datasetId,
      attachmentId,
      status: "completed",
      filename: attachment.originalFilename,
      tags,
    });
  } catch (err) {
    logger.error("Melléklet taggelés sikertelen", { err, attachmentId, datasetId });
    await sendAttachmentTaggingUpdate(ownerId, {
      type: "attachment:tagging",
      datasetId,
      attachmentId,
      status: "failed",
      filename: attachment.originalFilename,
      error: err instanceof Error ? err.message : "Ismeretlen hiba",
    });
    throw err;
  } finally {
    if (localPath) {
      await fs.rm(localPath, { force: true }).catch(() => undefined);
    }
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
