export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  upload: {
    path: process.env.UPLOAD_PATH,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  },
  cors: {
    adminUrl: process.env.ADMIN_URL,
    publicUrl: process.env.PUBLIC_URL,
  },
});
