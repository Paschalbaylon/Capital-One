export interface RequestWithUser {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}
