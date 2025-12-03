import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService, ConfigModule } from '@nestjs/config';
import databaseConfig from './configs/database.config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import fileUploadConfig from './configs/file-upload.config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HotelModule } from './hotel/hotel.module';
import { MenuModule } from './menu/menu.module';
import { CommonModule } from './common/common.module';
import { ReviewModule } from './review/review.module';
import { LoggingModule } from './common/logging/logging.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, fileUploadConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.getOrThrow('mongodb');
        return {
          uri: dbConfig.uri,
          dbname: dbConfig.dbName,
          connectTimeoutMS: dbConfig.connectTimeoutMS,
          socketTimeoutMS: dbConfig.socketTimeoutMS,
          connectionFactory: (connection) => {
            const logger = new Logger('MongoDB');
            connection.on('connected', () => {
              logger.log('Database Connected');
            });
            connection.on('error', (error: any) => {
              logger.error('Database connection error', error);
            });
            connection.on('disconnected', () => logger.warn('Database disconnected'));
            return connection;
          },
        };
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
          signOptions: {
            expiresIn: parseInt(configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRY_MS')),
          },
        };
      },
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get<number>('MAIL_PORT'),
          secure: false, // true for 465, false for other ports
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: config.getOrThrow<string>('MAIL_FROM'),
        },
      }),
    }),
    UserModule,
    AuthModule,
    HotelModule,
    MenuModule,
    CommonModule,
    ReviewModule,
    LoggingModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
