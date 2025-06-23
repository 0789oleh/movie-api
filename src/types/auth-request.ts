export type AuthRequest = {
    req: { id: number; };
    method: string;
    url: string;
    headers: {
      authorization?: string;
      [key: string]: string | string[] | undefined;
    };
    user?: {
      id: number;
      email: string;
      name: string;
    };
}

export type SanitizedUser = {
  id: number;
  email: string;
  username?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};
