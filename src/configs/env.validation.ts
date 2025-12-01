export function validateEnvironment() {
    const requiredEnvVars = [
        'MONGO_URI',
        'JWT_ACCESS_TOKEN_SECRET',
        'JWT_ACCESS_TOKEN_EXPIRY_MS',
        'JWT_REFRESH_TOKEN_SECRET',
        'JWT_REFRESH_TOKEN_EXPIRY_MS',
        'TOKEN_HASH_SECRET',
    ];

    const missingVars: string[] = [];
    const invalidVars: string[] = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missingVars.push(envVar);
        }
    }

    // Validate TOKEN_HASH_SECRET length
    if (process.env.TOKEN_HASH_SECRET && process.env.TOKEN_HASH_SECRET.length < 32) {
        invalidVars.push('TOKEN_HASH_SECRET (must be at least 32 characters)');
    }

    // Validate JWT secrets length
    if (process.env.JWT_ACCESS_TOKEN_SECRET && process.env.JWT_ACCESS_TOKEN_SECRET.length < 32) {
        invalidVars.push('JWT_ACCESS_TOKEN_SECRET (must be at least 32 characters)');
    }

    if (process.env.JWT_REFRESH_TOKEN_SECRET && process.env.JWT_REFRESH_TOKEN_SECRET.length < 32) {
        invalidVars.push('JWT_REFRESH_TOKEN_SECRET (must be at least 32 characters)');
    }

    // Validate expiry times are numbers
    if (process.env.JWT_ACCESS_TOKEN_EXPIRY_MS && isNaN(parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRY_MS))) {
        invalidVars.push('JWT_ACCESS_TOKEN_EXPIRY_MS (must be a number)');
    }

    if (process.env.JWT_REFRESH_TOKEN_EXPIRY_MS && isNaN(parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY_MS))) {
        invalidVars.push('JWT_REFRESH_TOKEN_EXPIRY_MS (must be a number)');
    }

    if (missingVars.length > 0 || invalidVars.length > 0) {
        let errorMessage = '\n❌ Environment validation failed:\n\n';
        
        if (missingVars.length > 0) {
            errorMessage += '  Missing required environment variables:\n';
            missingVars.forEach(v => errorMessage += `    - ${v}\n`);
        }
        
        if (invalidVars.length > 0) {
            errorMessage += '\n  Invalid environment variables:\n';
            invalidVars.forEach(v => errorMessage += `    - ${v}\n`);
        }
        
        errorMessage += '\n  Please check your .env file and ensure all required variables are set.\n';
        
        throw new Error(errorMessage);
    }

    console.log('✅ Environment variables validated successfully');
}
