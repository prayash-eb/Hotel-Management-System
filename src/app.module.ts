import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService, ConfigModule } from '@nestjs/config';
import databaseConfig from './configs/database.config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import fileUploadConfig from './auth/config/file-upload.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, fileUploadConfig]
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.getOrThrow("mongodb")
        return {
          uri: dbConfig.uri,
          dbname: dbConfig.dbName,
          connectTimeoutMS: dbConfig.connectTimeoutMS,
          socketTimeoutMS: dbConfig.socketTimeoutMS,
          connectionFactory: (connection) => {
            const logger = new Logger("MongoDB");
            connection.on("connected", () => {
              logger.log("Database Connected")
            })
            connection.on("error", (error: any) => {
              logger.error("Database connection error", error)
            })
            connection.on('disconnected', () => logger.warn('Database disconnected'));
            return connection;
          }
        }
      }
    }),
    JwtModule.registerAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory:(configService:ConfigService)=>{
        return {
          secret:configService.getOrThrow("JWT_ACCESS_TOKEN_SECRET"),
          signOptions:{
            expiresIn:parseInt(configService.getOrThrow("JWT_ACCESS_TOKEN_EXPIRY_MS"))
          }
        }
      }
    }),
    UserModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
