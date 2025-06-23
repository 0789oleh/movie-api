"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUserDto = exports.RegisterUserDto = void 0;
var class_validator_1 = require("class-validator");
// Кастомный валидатор для проверки совпадения паролей
var PasswordMatchConstraint = /** @class */ (function () {
    function PasswordMatchConstraint() {
    }
    PasswordMatchConstraint.prototype.validate = function (value, args) {
        var relatedPropertyName = args.constraints[0];
        var relatedValue = args.object[relatedPropertyName];
        return value === relatedValue;
    };
    PasswordMatchConstraint.prototype.defaultMessage = function (args) {
        return 'Passwords do not match';
    };
    PasswordMatchConstraint = __decorate([
        (0, class_validator_1.ValidatorConstraint)({ name: 'passwordMatch', async: false })
    ], PasswordMatchConstraint);
    return PasswordMatchConstraint;
}());
var RegisterUserDto = /** @class */ (function () {
    function RegisterUserDto() {
    }
    RegisterUserDto.validate = function (data) {
        var dto = Object.assign(new RegisterUserDto(), data);
        var errors = (0, class_validator_1.validateSync)(dto);
        if (errors.length > 0) {
            var errorMessages = errors.map(function (error) {
                return Object.values(error.constraints || {}).join(', ');
            });
            throw new Error(errorMessages.join('; '));
        }
        return dto;
    };
    __decorate([
        (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
        (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
        __metadata("design:type", String)
    ], RegisterUserDto.prototype, "email", void 0);
    __decorate([
        (0, class_validator_1.IsString)({ message: 'Name must be a string' }),
        (0, class_validator_1.IsNotEmpty)({ message: 'Name is required' }),
        __metadata("design:type", String)
    ], RegisterUserDto.prototype, "name", void 0);
    __decorate([
        (0, class_validator_1.IsString)({ message: 'Password must be a string' }),
        (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
        __metadata("design:type", String)
    ], RegisterUserDto.prototype, "password", void 0);
    __decorate([
        (0, class_validator_1.Validate)(PasswordMatchConstraint, ['password'], {
            message: 'Passwords do not match'
        }),
        __metadata("design:type", String)
    ], RegisterUserDto.prototype, "confirmPassword", void 0);
    return RegisterUserDto;
}());
exports.RegisterUserDto = RegisterUserDto;
var LoginUserDto = /** @class */ (function () {
    function LoginUserDto() {
    }
    LoginUserDto.validate = function (data) {
        var dto = Object.assign(new LoginUserDto(), data);
        var errors = (0, class_validator_1.validateSync)(dto);
        if (errors.length > 0) {
            var errorMessages = errors.map(function (error) {
                return Object.values(error.constraints || {}).join(', ');
            });
            throw new Error(errorMessages.join('; '));
        }
        return dto;
    };
    __decorate([
        (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
        (0, class_validator_1.IsNotEmpty)({ message: 'Email is required' }),
        __metadata("design:type", String)
    ], LoginUserDto.prototype, "email", void 0);
    __decorate([
        (0, class_validator_1.IsString)({ message: 'Password must be a string' }),
        (0, class_validator_1.IsNotEmpty)({ message: 'Password is required' }),
        __metadata("design:type", String)
    ], LoginUserDto.prototype, "password", void 0);
    return LoginUserDto;
}());
exports.LoginUserDto = LoginUserDto;
