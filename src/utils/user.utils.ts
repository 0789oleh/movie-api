import { UserPayload } from '../interfaces/user-payload';
import User from '../models/user.model';

export function toUserPayload(user: User): UserPayload {
  return {
    id: user.id,
    email: user.email,
    name: user.name
  };
}