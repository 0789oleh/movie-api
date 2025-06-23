import { 
    Model, Table, Column, PrimaryKey, AutoIncrement, 
    ForeignKey, BelongsTo, DataType, 
    Unique
  } from 'sequelize-typescript';
  import User from './user.model';
  
  interface RefreshTokenAttributes {
    id?: number;
    userId: number;
    token: string;
    expiresAt: Date;
  }
  

  @Table({
    tableName: 'refresh_tokens',
    indexes: [{ fields: ['token'] }]
  })
  export default class RefreshToken extends Model<RefreshToken> implements RefreshTokenAttributes {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;
  
    @Unique
    @Column(DataType.TEXT) // TEXT для длинных JWT-токенов
    token!: string;
  
    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        onDelete: 'CASCADE'
    })
    userId!: number;
  
    @Column(DataType.DATE)
    expiresAt!: Date;
  
    // Связь с пользователем
    @BelongsTo(() => User)
    user!: User;
  }
  