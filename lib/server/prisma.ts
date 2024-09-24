import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();


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


export default prisma;