import { PrismaClient } from '@prisma/client';

// Initialize prisma client
const prisma = new PrismaClient();

// Handle disconnect from database
const handleDisconnect = async () => {
	try {
		await prisma.$disconnect();
		console.log('Database connection closed');
	} catch (error) {
		console.error('Error during disconnection:', error);
	}

	process.exit(0);
};

process.on('beforeExit', () => handleDisconnect());
process.on('SIGINT', () => handleDisconnect());
process.on('SIGTERM', () => handleDisconnect());

// Make prisma client accessible from application
export default prisma;