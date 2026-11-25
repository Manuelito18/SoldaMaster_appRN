/**
 * `react-native-css-interop` (dependencia de NativeWind) remapea `ImageBackground`,
 * que RN 0.88 marca como deprecado. No es un componente de esta app: se filtra
 * únicamente ese mensaje exacto para no ocultar otros avisos reales.
 */
const FLAG = '__soldaMasterWarningsPatched';
const MESSAGE = 'ImageBackground is deprecated and will be removed';

const globalWithFlag = globalThis as typeof globalThis & {
  [FLAG]?: boolean;
};

if (!globalWithFlag[FLAG]) {
  globalWithFlag[FLAG] = true;
  const originalWarn = console.warn.bind(console);

  console.warn = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string' && first.includes(MESSAGE)) return;
    originalWarn(...(args as Parameters<typeof console.warn>));
  };
}
