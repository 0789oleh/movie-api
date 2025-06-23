import { 
  Model, 
  ModelStatic, 
  FindOptions,
  CreateOptions,
  CountOptions,
  FindAndCountOptions,
  UpdateOptions,
  DestroyOptions,
  Transaction  // Добавляем импорт
} from 'sequelize';

type ModelWrapper<T extends Model> = {
  create(values?: Partial<T>, options?: CreateOptions): Promise<T>;
  findAll(options?: FindOptions): Promise<T[]>;
  findOne(options?: FindOptions): Promise<T | null>;
  findByPk(id: number | string, options?: FindOptions): Promise<T | null>;
  count(options?: CountOptions): Promise<number>;
  findAndCountAll(options?: FindAndCountOptions): Promise<{ rows: T[]; count: number }>;
  findOrCreate(options: {
    where: FindOptions['where'];
    defaults: Partial<T>;
    transaction?: Transaction;
  }): Promise<[T, boolean]>;
  // Исправленный метод update
  update(
    values: Partial<T>, 
    options: UpdateOptions
  ): Promise<[affectedCount: number]>;
  destroy(
    options: DestroyOptions
  ): Promise<number>;
  
  // Добавьте другие методы по необходимости
};

export function createModelWrapper<T extends Model>(modelClass: ModelStatic<T>): ModelWrapper<T> {
  
  return {
    create: (values, options) => {
      // Преобразование null в undefined для совместимости
      const processedValues = Object.fromEntries(
        Object.entries(values || {}).map(([key, value]) => 
          [key, value === null ? undefined : value]
        )
      );
      return modelClass.create(processedValues as any, options);
    },
    findAll: (options) => modelClass.findAll(options),
    findOne: (options) => modelClass.findOne(options),
    findByPk: (id, options) => modelClass.findByPk(id, options),
    count: (options) => modelClass.count(options),
    findAndCountAll: (options) => modelClass.findAndCountAll(options),
    findOrCreate: async ({ where, defaults, transaction }) => {
      return modelClass.findOrCreate({
        where,
        defaults: defaults as any,
        transaction
      });
    },
    destroy: (options) => modelClass.destroy(options),
    // Исправленная реализация update
    update: (values, options) => modelClass.update(values, options)
  };
}
