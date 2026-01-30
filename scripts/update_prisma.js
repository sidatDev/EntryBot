
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

console.log('Environment variables loaded successfully.');
console.log('DATABASE_URL found:', !!process.env.DATABASE_URL);

// Run prisma generate
const prisma = spawn('npx', ['prisma', 'generate'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
});

prisma.on('close', (code) => {
    console.log(`Prisma generate exited with code ${code}`);
    process.exit(code);
});
