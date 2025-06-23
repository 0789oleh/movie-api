export interface JwtPayload {
  id: number;
  email?: string;
  name?: string;
}
  
export function isJwtPayload(payload: any): payload is JwtPayload {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.id === 'number' &&
    typeof payload.email === 'string' &&
    typeof payload.name === 'string'
  );
}