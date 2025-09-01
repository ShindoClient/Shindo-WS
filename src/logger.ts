const ts = () => new Date().toISOString();
export const log = {
    info: (m: string) => console.log(`${ts()} [info] ${m}`),
    warn: (m: string) => console.warn(`${ts()} [warn] ${m}`),
    error: (m: string) => console.error(`${ts()} [error] ${m}`),
};
