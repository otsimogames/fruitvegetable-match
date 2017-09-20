import { AssetService, BuilderService } from './asset';
import { LocalizationService } from './i18n';
import { FileService } from './file';

const hostStaging = 'https://apis.otsimo.com'
const hostProd = 'https://apis.otsimo.com'

const host = process.env.NODE_ENV !== 'production' ? hostStaging : hostProd;

export const assetSvc = new AssetService(host);
export const builderSvc = new BuilderService(host);
export const fileMan = new FileService(host)
export const i18nSvc = new LocalizationService(hostProd);

