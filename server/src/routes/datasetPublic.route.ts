import { Router } from "express";
import * as DatasetController from "../controllers/dataset.controller";

const router = Router();

router.get("/public", DatasetController.listPublic);
router.get("/public/:datasetId", DatasetController.getPublic);
router.get(
  "/public/:datasetId/files/:fileId/download",
  DatasetController.getPublicFileDownloadUrl
);
router.get(
  "/public/:datasetId/files/:fileId/mbtiles",
  DatasetController.getPublicMbtilesUrl
);
router.get(
  "/public/:datasetId/attachments/:attachmentId/download",
  DatasetController.getPublicAttachmentDownloadUrl
);
router.get("/shared/:token", DatasetController.getShared);
router.get(
  "/shared/:token/files/:fileId/download",
  DatasetController.getSharedFileDownloadUrl
);
router.get(
  "/shared/:token/files/:fileId/mbtiles",
  DatasetController.getSharedMbtilesUrl
);
router.get(
  "/shared/:token/attachments/:attachmentId/download",
  DatasetController.getSharedAttachmentDownloadUrl
);
router.get("/getDefault", DatasetController.getDefault);

router.get("/search", DatasetController.search);

router.get("/getDatasetFile/:datasetId", DatasetController.getDatasetFile);

export default router;
