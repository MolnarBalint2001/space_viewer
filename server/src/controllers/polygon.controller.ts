import { AppDataSource } from "../db/dataSource";
import { Polygon } from "../domain/entities/Polygon";
import { Request, Response } from "express";


// Interface a req.body-hoz (jobb típusbiztonság)
interface CreatePolygonRequest {
    label: string;
    tilesKey:string,
    geom: {
      type: 'Feature';
      properties?: any;
      geometry: {
        type: 'Polygon';
        coordinates: number[][][];  // [[[lng, lat], ...]]
      };
    };
  }

const repo = AppDataSource.getRepository(Polygon);

export const create = async (req: Request, res: Response):Promise<any> =>{
    const {label, geom, tilesKey} = req.body as CreatePolygonRequest;
    const polygon = await repo
    .create({label, geom:geom.geometry, creatorUserId:1, creatorUserName:"admin_mb", tilesetKey:tilesKey});
    await repo.save(polygon);
    return res.json({ polygon, message: "Sikeres polygon létrehozás" });
}

export const getAll = async (req:Request, res:Response):Promise<any> =>{

    const tileKey:any = req.query.tileKey;
    if (!tileKey)
        return res.json({message:"Tile kulcs nem található!"})

    const polygons = await repo.findBy({tilesetKey:tileKey});
    return res.json({polygons});

}
