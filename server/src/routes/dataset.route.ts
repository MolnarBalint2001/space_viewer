import { Router } from "express";
import multer from "multer";
import os from "os";
import { adminAuth } from "../middlewares/adminAuth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  DatasetCreateDto,
  DatasetListQueryDto,
  DatasetUpdateDto,
} from "../domain/dtos/dataset.dto";
import * as DatasetController from "../controllers/dataset.controller";


const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitized}`);
  },
});

const tifUpload = multer({
  storage,
  limits: { files: 10 },
});

const attachmentUpload = multer({
  storage,
  limits: { files: 10 },
});

router.use(adminAuth());

router.get(
  "/",
  validate(DatasetListQueryDto, "query"),
  DatasetController.listMine
);

router.post("/", validate(DatasetCreateDto), DatasetController.create);

router.get("/:datasetId", DatasetController.getOne);

router.patch(
  "/:datasetId",
  validate(DatasetUpdateDto),
  DatasetController.update
);

router.post(
  "/:datasetId/files",
  tifUpload.array("files", 10),
  DatasetController.uploadTifs
);

router.post(
  "/:datasetId/attachments",
  attachmentUpload.array("attachments", 10),
  DatasetController.uploadAttachments
);

router.post("/:datasetId/share", DatasetController.generateShareLink);

router.delete("/:datasetId/share", DatasetController.revokeShareLink);

router.get(
  "/:datasetId/files/:fileId/download",
  DatasetController.getFileDownloadUrl
);

router.get(
  "/:datasetId/files/:fileId/mbtiles",
  DatasetController.getFileMbtilesDownloadUrl
);

router.get(
  "/:datasetId/attachments/:attachmentId/download",
  DatasetController.getAttachmentDownloadUrl
);







export default router;

