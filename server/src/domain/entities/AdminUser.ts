import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "adminUsers" })
export class AdminUser {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true,type: "varchar" })
  username!: string;

  @Column({ unique: true ,type: "varchar"})
  email!: string;

  @Column({ name: "passwordHash" , type: "varchar"})
  passwordHash!: string;

  @Column({ type: "timestamp", nullable: true })
  lastLoginDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

}
