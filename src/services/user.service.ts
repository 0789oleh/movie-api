import { createModelWrapper } from "../models/model-utils";
import User  from "../models/user.model";
import logger from "../config/logger";

const userModel = createModelWrapper(User);


export class UserService {
  updateUser(id: any, arg1: { refreshToken: any; }) {
    logger.warn('Trying to call unimplemented method udateUser');
    throw new Error('Method not implemented.');
  }

  async createUser(email: string, name: string, password: string ) {
    try {
      const user = await userModel.create({
        email,
        name,
        password
      });
      
      logger.info(`User ${name} is successsfuly created`);
      return user;
        
    } catch(error) {
      throw error;
    }
  }

  async findByEmail(email: string) {
    logger.info(`Searching for user by email ${email}`);
    return User.findOne({where : {email}})
  }

  async findById(id: number) {
    return User.findOne({where : {id}})
  }


}

export default UserService;