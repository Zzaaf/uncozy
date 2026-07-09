export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  databaseUrl: string;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  databaseUrl: process.env.DATABASE_URL ?? '',
});
