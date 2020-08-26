export interface IPatchesConfig {
    top: number;
    left?: number;
    right?: number;
    bottom?: number;
}
declare const normalizePatchesConfig: (config: IPatchesConfig) => IPatchesConfig;
export { normalizePatchesConfig };
