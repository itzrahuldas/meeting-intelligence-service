const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'default-dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
  CANDIDATE_NAME: process.env.CANDIDATE_NAME || 'Rahul',
  CANDIDATE_EMAIL: process.env.CANDIDATE_EMAIL || 'rahul@example.com',
  REPOSITORY_URL: process.env.REPOSITORY_URL || '',
  DEPLOYED_URL: process.env.DEPLOYED_URL || '',
  FRONTEND_URL: process.env.FRONTEND_URL || '',   // Vercel deployment URL
} as const;


export default env;
