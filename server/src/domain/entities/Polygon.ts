
import { Geometry } from 'geojson';
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('polygons')
export class Polygon {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({type:"varchar"})
    tilesetKey!:string

    @Column({ type: 'varchar', length: 255 })
    label: string;

    @Column({ name: 'creator_user_id', type: 'integer' })
    creatorUserId: number;

    @Column({ name: 'creator_user_name', type: 'varchar', length: 100 })
    creatorUserName: string;
    
    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;
    
    @Index({ spatial: true })
    @Column({
        type: 'geometry',
        spatialFeatureType: 'Polygon', 
        srid: 4326,
        nullable: false
    })
    geom: Object | Geometry;
}