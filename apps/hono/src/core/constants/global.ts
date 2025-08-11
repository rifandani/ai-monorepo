import metadata from '../../../package.json' with { type: 'json' };

export const PORT = 3333;
export const SERVICE_NAME = metadata.name;
export const SERVICE_VERSION = metadata.version;
