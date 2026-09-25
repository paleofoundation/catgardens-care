import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('Records are temporarily unavailable. Please try again.');return env.DB}
export function bucket(){if(!env.BUCKET)throw new Error('File storage is temporarily unavailable.');return env.BUCKET}
