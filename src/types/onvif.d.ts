declare module "onvif" {
  namespace onvif {
    class Cam {
      constructor(config: Record<string, unknown>);

      _requestPart2: (...args: unknown[]) => void;

      getCapabilities(callback: (err: Error | null) => void): void;
      getProfiles(callback: (err: Error | null) => void): void;

      readonly uri?: string;
      readonly profiles?: unknown;

      continuousMove(
        params: Record<string, unknown>,
        callback: (err: Error | null) => void,
      ): void;
      stop(
        params: Record<string, unknown>,
        callback: (err: Error | null) => void,
      ): void;
      absoluteMove(
        params: Record<string, unknown>,
        callback: (err: Error | null) => void,
      ): void;
      relativeMove(
        params: Record<string, unknown>,
        callback: (err: Error | null) => void,
      ): void;
      gotoPreset(
        params: Record<string, unknown>,
        callback: (err: Error | null) => void,
      ): void;
      setPreset(
        params: Record<string, unknown>,
        callback: (err: Error | null, result?: Record<string, unknown>) => void,
      ): void;
      getPresets(
        params: Record<string, unknown>,
        callback: (err: Error | null, presets?: unknown) => void,
      ): void;
      removePreset(
        params: Record<string, unknown>,
        callback: (err: Error | null) => void,
      ): void;
      gotoHomePosition(
        params: Record<string, unknown>,
        callback: (err: Error | null) => void,
      ): void;
      setHomePosition(
        params: Record<string, unknown>,
        callback: (err: Error | null) => void,
      ): void;
      getStatus(
        params: Record<string, unknown>,
        callback: (err: Error | null, status?: Record<string, unknown>) => void,
      ): void;
    }
  }

  export default onvif;
}
