import { createModelWrapper } from "../models/model-utils";
import User  from "../models/user.model"

const userModel = createModelWrapper(User);


export class UserService {
  updateUser(id: any, arg1: { refreshToken: any; }) {
    throw new Error('Method not implemented.');
  }

  async createUser(email: string, name: string, password: string ) {
    try {
      const user = await userModel.create({
        email,
        name,
        password
      });
        
      return user;
        
    } catch(error) {
      throw error;
    }
  }

  async findByEmail(email: string) {
    return User.findOne({where : {email}})
  }

  async findById(id: number) {
    return User.findOne({where : {id}})
  }


}

export default UserService;