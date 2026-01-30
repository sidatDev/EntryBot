
const { execSync } = require('child_process');

try {
    console.log('Running prisma generate with explicit env...');
    execSync('npx prisma generate', {
        stdio: 'inherit',
        env: {
            ...process.env,
            DATABASE_URL: "postgresql://postgres:taAo0qbl3GsOaoPGubOqBpZxS6GIeUwOenIS7yDaujB13Lb3dgeitz98u8ByqNOI@178.18.252.45:5463/postgres"
        }
    });
    console.log('Success!');
} catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
}
