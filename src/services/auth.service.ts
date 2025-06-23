import { Config } from '../config/env.config';
import * as bcrypt from 'bcrypt';
import UserService from './user.service';
import Session, { SessionCreationAttributes }  from '../models/session.model';
import { Op, UniqueConstraintError } from 'sequelize';
import { LoginUserDto, RegisterUserDto } from '../dto/user.dto';
import { toUserPayload } from '../utils/user.utils';
import { createModelWrapper } from '../models/model-utils';
import { 
  generateAccessToken, 
  generateRefreshToken,
  verifyToken
} from '../utils/jwt.utils';
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { User } from '../models';
import { SanitizedUser } from '../types/auth-request';
import RefreshToken from '../models/refresh-token.model';
import { sequelize } from '../config/database';

const sessionModel = createModelWrapper(Session);
const refreshTokenModel = createModelWrapper(RefreshToken);

// Кастомный тип для создания, исключая несовместимости
type SessionCreateInput = Omit<SessionCreationAttributes, 'id' | 'userAgent'> & {
  userAgent?: string; // Только string или undefined
};

export class AuthService {
  private userService: UserService;

  constructor(userService: UserService ) {
    this.userService = userService;
  }

  async register(registerDto: RegisterUserDto) {
    const { email, name, password, confirmPassword } = registerDto;

    if(password !== confirmPassword) {
      throw new Error("Password don't match");
    }
    
    // Нормализация email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Проверка существования пользователя
    const existingUser = await this.userService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Хеширование пароля
    const hashedPassword = await this.hashPassword(password);
    
    // Создание пользователя
    const user = await this.userService.createUser(
      normalizedEmail,
      name.trim(),
      hashedPassword
    );

    // Возвращаем пользователя без чувствительных данных
    return this.sanitizeUser(user);
  }

  // Аутентификация пользователя
  async login(dto: LoginUserDto) {
    const { email, password } = dto;
    
    // Нормализация email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Поиск пользователя
    const user = await this.userService.findByEmail(normalizedEmail);
    
    // Общая ошибка для безопасности (защита от перебора)
    const invalidError = new Error('Invalid email or password');
    
    if (!user) {
      // Задержка для защиты от timing-атак
      setTimeout( () => {}, 500 );
      throw invalidError;
    }
  
    // Безопасное сравнение паролей
    const isPasswordValid = await this.comparePasswords(
      password, 
      user.password
    );
    
    if (!isPasswordValid) {
      throw invalidError;
    }
  
    // Генерация токенов
    const tokens = await this.generateTokens(user);
    
    // Сохранение refreshToken в базу
    await this.saveRefreshToken(user.id, await tokens.refreshToken);
  
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }


    
  private async createSession(userId: number, userAgent?: string): Promise<Session> {
    const refreshToken = this.generateSecureToken();
    const tokenHash = this.createTokenHash(refreshToken);
    
    try {
      return await Session.create({
        userId,
        refreshToken,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: userAgent?.substring(0, 255) || null
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        // Редкий случай коллизии - генерируем новый токен
        return this.createSession(userId, userAgent);
      }
      throw error;
    }
  }

  private sanitizeUser(user: User): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      username: user.name,
      // Добавьте другие безопасные поля
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private async saveRefreshToken(userId: number, refreshToken: string) {
    // Хеширование токена перед сохранением
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    
    // Ограничение количества активных сессий
    const MAX_SESSIONS = 5;
    const sessionCount = await refreshTokenModel.count({ where: { userId } });
    
    if (sessionCount >= MAX_SESSIONS) {
      // Удаляем самые старые сессии
      await refreshTokenModel.destroy({where: {userId: sessionCount - MAX_SESSIONS + 1}});
    }
    
    // Сохранение токена
    await refreshTokenModel.create({
      token: hashedToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  }  



  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, Config.BCRYPT_SALT_ROUNDS);
  }

  private async invalidateSession(sessionId: number): Promise<void> {
    await sessionModel.update(
      { isActive: false },
      { where: { id: sessionId } }
    );
  }

  private async invalidateAllSessions(userId: number): Promise<void> {
    await sessionModel.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );
  }

  private async findValidSession(tokenHash: string): Promise<Session | null> {
    return sessionModel.findOne({
      where: {
        tokenHash,
        isActive: true,
        expiresAt: { [Op.gt]: new Date() }
      }
    });
  }

  private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private generateSecureToken(length = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }


  // ... в методе refreshToken ...
  async refreshTokens(refreshToken: string) {
    // 1. Поиск токена в базе с блокировкой для безопасности
    const storedToken = await RefreshToken.findOne({
      where: { token: refreshToken },
      lock: true // Блокировка записи для предотвращения гонок
    });

    if (!storedToken) {
      throw new Error('Refresh token not found');
    }
    
    // 2. Проверка срока действия
    const now = new Date();
    if (storedToken.expiresAt < now) {
      await this.invalidateToken(storedToken.id);
      throw new Error('Refresh token expired');
    }

    try {
      // 3. Верификация подписи
      const payload = await verifyToken(refreshToken, 'refresh');
      
      // 4. Проверка структуры payload
      if (typeof payload.userId !== 'number') {
        throw new Error('Invalid token payload: userId is missing or not a number');
      }
      
      // 5. Поиск пользователя
      const user = await User.findByPk(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // 6. Проверка соответствия пользователя
      if (user.id !== storedToken.userId) {
        await this.invalidateToken(storedToken.id);
        throw new Error('Token-user mismatch');
      }

      // 7. Генерация новых токенов
      const [newAccessToken, newRefreshToken] = await Promise.all([
        generateAccessToken(user.id),
        generateRefreshToken(user.id)
      ]);

      // 8. Ротация токенов в транзакции
      await this.rotateTokens({
        oldTokenId: storedToken.id,
        newRefreshToken,
        userId: user.id
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      // 9. Обработка ошибок с инвалидацией токена
      if (storedToken) {
        await this.invalidateToken(storedToken.id);
      }
      
      // // 10. Специфичные ошибки
      // if (error.message.includes('JWTExpired')) {
      //   throw new Error('Refresh token expired');
      // }
      
      // if (error.message.includes('JWSInvalid') || error.message.includes('JWTInvalid')) {
      //   throw new Error('Invalid token signature');
      // }
      
      throw new Error('Token refresh failed');
    }
  }

  private async invalidateToken(tokenId: number) {
    await RefreshToken.destroy({
      where: { id: tokenId },
      force: true // Немедленное удаление
    });
  }

  private async rotateTokens(params: {
    oldTokenId: number;
    newRefreshToken: string;
    userId: number;
  }) {
    const transaction = await sequelize.transaction();
    
    try {
      // Удаляем старый токен
      await RefreshToken.destroy({
        where: { id: params.oldTokenId },
        transaction
      });
      
      // Создаем новый токен
      await refreshTokenModel.create({
        token: params.newRefreshToken,
        userId: params.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }, { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Token rotation failed:', error);
      throw new Error('Token rotation error');
    }
  }

  

  private createTokenHash(token: string): string {
    return crypto.createHash('sha512').update(token).digest('hex');
  }


  // Метод для выхода из системы
  async logout(sessionId: number): Promise<void> {
    await this.invalidateSession(sessionId);
  }

  // Метод для выхода со всех устройств
  async logoutAll(userId: number): Promise<void> {
    await this.invalidateAllSessions(userId);
  }

  async generateTokens(user: User) {
    // Генерация accessToken
    const accessToken = generateAccessToken(user.id);
    
    // Генерация refreshToken
    const refreshToken =generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }


  // Получение активных сессий пользователя
  async getActiveSessions(userId: number): Promise<Session[]> {
    return sessionModel.findAll({
      where: {
        userId,
        isActive: true,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });
  }
}