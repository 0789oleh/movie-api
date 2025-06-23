import { Model, Column, DataType, Table, PrimaryKey, AutoIncrement, HasMany } from 'sequelize-typescript';
import RefreshToken from './refresh-token.model';


@Table({ tableName: 'users' })
class User extends Model<User> {

  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;
 
  @Column({
      type: DataType.STRING,
      allowNull: false,
      unique: true,
      validate: { notEmpty: true }
    })
  email!: string;


  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { notEmpty: true }
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
        notEmpty: true,
        len: [60, 60] 
      }
  })
  password!: string;

  @HasMany(() => RefreshToken)
  refreshTokens!: RefreshToken[];

}

export default User;