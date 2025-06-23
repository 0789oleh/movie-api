// auth.controller.ts
import { Request, Response } from 'express';
import { authService } from '../services/services';
import { LoginUserDto, RegisterUserDto } from '../dto/user.dto';
import { CookieOptions } from 'express';

interface CookieResponse extends Response {
  cookie: (name: string, value: any, options?: CookieOptions) => this;
  clearCookie: (name: string, options?: CookieOptions) => this;
}

export const login = async (req: Request, res: Response) => {
  try {
    // Явное извлечение данных
    const dto: LoginUserDto = {
      email: req.body.email,
      password: req.body.password
    };

    // Валидация DTO (если не используется глобальный middleware)
    LoginUserDto.validate(dto);

    const result = await authService.login(dto);
    const cookieRes = res as CookieResponse;

    
    // Устанавливаем refresh token в HTTP-only cookie
    cookieRes.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      sameSite: 'strict'
    });

    // Возвращаем только access token и данные пользователя
    res.json({
      token: result.accessToken,
      status: 1
    });
  } catch (error: any) {
    // Логирование ошибки
    console.error('Login error:', error);
    
    // Единое сообщение для безопасности
    res.status(401).json({ error: 'Invalid credentials' });
  }
};


export const register = async (req: Request, res: Response) => {
  try {
    const dto: RegisterUserDto = {
      email: req.body.email,
      name: req.body.name,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword
    };

    // Валидация DTO
    RegisterUserDto.validate(dto);

    const user = await authService.register(dto);
    
    // Статус 201 для успешного создания
    res.status(201).json(user);
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Разные статусы для разных ошибок
    const status = error.message.includes('already exists') ? 409 : 400;
    res.status(status).json({ error: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Получаем refresh token из cookie
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token missing' });
    }

    const result = await authService.refreshTokens(refreshToken);
    const cookieRes = res as CookieResponse;
    
    // Обновляем cookie
    cookieRes.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict'
    });

    res.json({ accessToken: result.accessToken });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// Метод для выхода
export const logout = (req: Request, res: Response) => {

  const cookieRes = res as CookieResponse;
  // Очищаем cookie
  cookieRes.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  res.json({ success: true });
};