import { Router } from 'express';
import { getBuildStatus } from '@/services';
import { BuildStatus } from '@/partials';

const buildStatus = Router();

buildStatus.get('/build-status', async (req, res) => {
    const buildStatus = await getBuildStatus();

    res.send(BuildStatus(buildStatus));
}) as Router;

export { buildStatus };
