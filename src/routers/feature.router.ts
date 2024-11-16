// file ini untuk meletakkan route/jalur endpoint tiap feature

import { Router } from "express";

import { FeatureController } from "../controllers/feature.controller";

const featureController = new FeatureController();

const router = Router();

router.get("/feature", featureController.getFeatures.bind(featureController));

export default router;
