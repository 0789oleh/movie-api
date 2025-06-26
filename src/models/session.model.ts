import { Table, Model, Column, DataType, ForeignKey, Index, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import User from './user.model';
import { Optional } from 'sequelize';

interface SessionAttributes {
  id?: number;
  userId: number;
  refreshToken: string;
  expiresAt: Date;
  tokenHash: string;
  userAgent?: string | null;
}

export interface SessionCreationAttributes extends Omit<SessionAttributes, 'id'> {
  userAgent?: string | null;
}

@Table({
  tableName: 'sessions',
  timestamps: true,
  paranoid: true // Для мягкого удаления
})
export default class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => User)
  @Index('idx_sessions_user_id') // Индекс для userId
  @Column({
    type: DataType.INTEGER,
    onDelete: 'CASCADE'
  })
  userId!: number;

  @Column(DataType.TEXT)
  refreshToken!: string;

  @Index('idx_sessions_expires_at') // Индекс для expiresAt
  @Column(DataType.DATE)
  expiresAt!: Date;

  @Index({
    name: 'idx_sessions_token_hash', // Уникальное имя индекса
    unique: true
  })
  @Column(DataType.STRING(128)) // Увеличили длину для SHA-512
  tokenHash!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true
  })
  userAgent!: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false
  })
  isActive!: boolean;
}