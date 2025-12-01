import { registerAs } from "@nestjs/config";

export default registerAs("mongodb", () => ({
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.DB_NAME || 'hotel-management-system',
    connectTimeoutMS: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
    socketTimeoutMS: Number(process.env.DB_SOCKET_TIMEOUT_MS) || 45000,
}))