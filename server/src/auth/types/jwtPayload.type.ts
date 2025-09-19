export type JwtPayload = {
  id: string;
  fullname: string,
  username: string,
  email: string;
  limitHit: number;
  ttl: number;
};
