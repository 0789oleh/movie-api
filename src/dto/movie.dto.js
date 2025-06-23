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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieListResponseDto = exports.MovieSearchDto = exports.MovieResponseDto = exports.UpdateMovieDto = exports.CreateMovieDto = void 0;
// src/dto/movie.dto.ts
var class_validator_1 = require("class-validator");
var movie_model_1 = __importDefault(require("../models/movie.model"));
// Movie creation
var CreateMovieDto = /** @class */ (function () {
    function CreateMovieDto() {
    }
    CreateMovieDto.validate = function (data) {
        var dto = Object.assign(new CreateMovieDto(), data);
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
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsNotEmpty)({ message: 'Title is required!' }),
        __metadata("design:type", String)
    ], CreateMovieDto.prototype, "title", void 0);
    __decorate([
        (0, class_validator_1.IsNumber)(),
        __metadata("design:type", Number)
    ], CreateMovieDto.prototype, "year", void 0);
    __decorate([
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsIn)([movie_model_1.default]),
        __metadata("design:type", String)
    ], CreateMovieDto.prototype, "format", void 0);
    return CreateMovieDto;
}());
exports.CreateMovieDto = CreateMovieDto;
// Movie update
var UpdateMovieDto = /** @class */ (function () {
    function UpdateMovieDto() {
    }
    UpdateMovieDto.validate = function (data) {
        var dto = Object.assign(new UpdateMovieDto(), data);
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
        (0, class_validator_1.IsString)(),
        __metadata("design:type", String)
    ], UpdateMovieDto.prototype, "title", void 0);
    __decorate([
        (0, class_validator_1.IsNumber)(),
        __metadata("design:type", Number)
    ], UpdateMovieDto.prototype, "year", void 0);
    __decorate([
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsIn)([movie_model_1.default]),
        __metadata("design:type", String)
    ], UpdateMovieDto.prototype, "format", void 0);
    return UpdateMovieDto;
}());
exports.UpdateMovieDto = UpdateMovieDto;
// Movie response
var MovieResponseDto = /** @class */ (function () {
    function MovieResponseDto() {
    }
    return MovieResponseDto;
}());
exports.MovieResponseDto = MovieResponseDto;
// Movie search
var MovieSearchDto = /** @class */ (function () {
    function MovieSearchDto() {
        this.sort = 'title';
        this.order = 'ASC';
        this.limit = 10;
        this.offset = 0;
    }
    __decorate([
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)(),
        __metadata("design:type", String)
    ], MovieSearchDto.prototype, "title", void 0);
    __decorate([
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)(),
        __metadata("design:type", String)
    ], MovieSearchDto.prototype, "actor", void 0);
    __decorate([
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)(),
        __metadata("design:type", String)
    ], MovieSearchDto.prototype, "search", void 0);
    __decorate([
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsIn)(['title', 'year', 'id', 'createdAt']),
        __metadata("design:type", String)
    ], MovieSearchDto.prototype, "sort", void 0);
    __decorate([
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsIn)(['ASC', 'DESC']),
        __metadata("design:type", String)
    ], MovieSearchDto.prototype, "order", void 0);
    __decorate([
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsNumber)(),
        __metadata("design:type", Number)
    ], MovieSearchDto.prototype, "limit", void 0);
    __decorate([
        (0, class_validator_1.IsOptional)(),
        (0, class_validator_1.IsNumber)(),
        __metadata("design:type", Number)
    ], MovieSearchDto.prototype, "offset", void 0);
    return MovieSearchDto;
}());
exports.MovieSearchDto = MovieSearchDto;
// Movie search response 
var MovieListResponseDto = /** @class */ (function () {
    function MovieListResponseDto() {
    }
    return MovieListResponseDto;
}());
exports.MovieListResponseDto = MovieListResponseDto;
