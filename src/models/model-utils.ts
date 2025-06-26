import { 
  Model, 
  ModelStatic, 
  FindOptions,
  CreateOptions,
  CountOptions,
  FindAndCountOptions,
  UpdateOptions,
  DestroyOptions,
  Transaction,  
  BulkCreateOptions,
  CreationAttributes
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

  update(
    values: Partial<T>, 
    options: UpdateOptions
  ): Promise<[affectedCount: number]>;
  bulkCreate(records: ReadonlyArray<CreationAttributes<T>>, options: BulkCreateOptions): Promise<T[]>;
  destroy(
    options: DestroyOptions
  ): Promise<number>;
  
};

export function createModelWrapper<T extends Model>(modelClass: ModelStatic<T>): ModelWrapper<T> {
  
  return {
    create: (values, options) => {
      // Casting null into undefined for compatibility
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
    bulkCreate: (records, options) => modelClass.bulkCreate(records, options),
    destroy: (options) => modelClass.destroy(options),
    update: (values, options) => modelClass.update(values, options)
  };
}
