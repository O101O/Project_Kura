import path from 'path';

export const DEFAULT_CLIENT_URL = 'http://localhost:5173';
export const DEFAULT_PORT = 5000;

export const getClientUrl = () => process.env.CLIENT_URL || DEFAULT_CLIENT_URL;
export const getPort = () => Number(process.env.PORT || DEFAULT_PORT);
export const getUploadsDir = () => path.resolve(process.cwd(), 'uploads');
