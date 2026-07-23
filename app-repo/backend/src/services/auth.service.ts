import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config';
import { RegisterInput, LoginInput } from '../validators/auth.validators';

const BCRYPT_COST = 12;

export class AuthService {
  /**
   * Register a new user. Returns JWT tokens.
   */
  static async register(input: RegisterInput) {
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const tokens = AuthService.generateTokens(user._id.toString(), user.email);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  /**
   * Authenticate user with email/password. Returns JWT tokens.
   */
  static async login(input: LoginInput) {
    const user = await User.findOne({ email: input.email });
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    const tokens = AuthService.generateTokens(user._id.toString(), user.email);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  /**
   * Refresh the access token using a valid refresh token.
   */
  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        userId: string;
        email: string;
      };

      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError('User not found.', 401);
      }

      const tokens = AuthService.generateTokens(user._id.toString(), user.email);
      return tokens;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired refresh token.', 401);
    }
  }

  /**
   * Get current user profile.
   */
  static async getProfile(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  private static generateTokens(userId: string, email: string) {
    const accessOpts: SignOptions = { expiresIn: config.jwt.expiresIn as string as any };
    const accessToken = jwt.sign(
      { userId, email },
      config.jwt.secret,
      accessOpts
    );

    const refreshOpts: SignOptions = { expiresIn: config.jwt.refreshExpiresIn as string as any };
    const refreshToken = jwt.sign(
      { userId, email },
      config.jwt.refreshSecret,
      refreshOpts
    );

    return { accessToken, refreshToken };
  }
}

/**
 * Application-specific error with HTTP status code.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
