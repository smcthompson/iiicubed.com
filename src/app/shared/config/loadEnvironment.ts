import dotenv from 'dotenv';

const allowedNodeEnvironments = new Set(['development', 'test', 'production']);

function loadDotenvFile(path: string, override = false): void {
  const result = dotenv.config({ path, override });

  if (result.error && result.error.code !== 'ENOENT') {
    throw result.error;
  }
}

loadDotenvFile('.env');

const nodeEnvironment = process.env.NODE_ENV;

if (nodeEnvironment) {
  if (!allowedNodeEnvironments.has(nodeEnvironment)) {
    throw new Error(`Unknown NODE_ENV: ${nodeEnvironment}`);
  }

  loadDotenvFile(`.env.${nodeEnvironment}`, true);
}

export const nodeEnv = nodeEnvironment;
