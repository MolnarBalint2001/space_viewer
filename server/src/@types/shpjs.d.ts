declare module 'shpjs' {
  import type { FeatureCollection } from 'geojson';

  interface ShpOptions {
    encoding?: string;
    targetCrs?: string;
  }

  function shp(input: ArrayBuffer | Uint8Array | Buffer | string, options?: ShpOptions): Promise<FeatureCollection>;

  export default shp;
}
