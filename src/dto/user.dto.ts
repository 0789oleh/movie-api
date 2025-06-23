import { IsEmail, IsNotEmpty, IsString, Validate, validateSync, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

// Кастомный валидатор для проверки совпадения паролей
@ValidatorConstraint({ name: 'passwordMatch', async: false })
class PasswordMatchConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Passwords do not match';
  }
}

export class RegisterUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @Validate(PasswordMatchConstraint, ['password'], {
    message: 'Passwords do not match'
  })
  confirmPassword!: string;

  static validate(data: Partial<RegisterUserDto>) {
    const dto = Object.assign(new RegisterUserDto(), data);
    const errors = validateSync(dto);
    
    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      );
      throw new Error(errorMessages.join('; '));
    }
    
    return dto;
  }
}

export class LoginUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  static validate(data: Partial<LoginUserDto>) {
    const dto = Object.assign(new LoginUserDto(), data);
    const errors = validateSync(dto);
    
    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      );
      throw new Error(errorMessages.join('; '));
    }
    
    return dto;
  }
}
