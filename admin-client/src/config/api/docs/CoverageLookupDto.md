# CoverageLookupDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**polygonId** | **string** |  | [default to undefined]
**datasetId** | **string** |  | [default to undefined]
**hrsz** | **string** | Helyrajzi szám | [default to undefined]
**geometry** | [**MultiPolygonGeoJson**](MultiPolygonGeoJson.md) |  | [default to undefined]
**properties** | **{ [key: string]: any; }** | Eredeti shapefile attribútumok | [optional] [default to undefined]

## Example

```typescript
import { CoverageLookupDto } from './api';

const instance: CoverageLookupDto = {
    polygonId,
    datasetId,
    hrsz,
    geometry,
    properties,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
