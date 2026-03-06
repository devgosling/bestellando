import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import morgan from "morgan";
import { VersioningType } from "@nestjs/common/enums/version-type.enum";
import { ValidationPipe } from "@nestjs/common/pipes/validation.pipe";
import { ValidationError } from "@nestjs/common/interfaces/external/validation-error.interface";
import { ConfigService } from "@nestjs/config/dist/config.service";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { BadRequestException } from "@nestjs/common/exceptions/bad-request.exception";

function matchesOriginPattern(origin: string, pattern: string): boolean {
  const normalizedPattern = pattern.trim();

  if (!normalizedPattern) {
    return false;
  }

  if (!normalizedPattern.includes("*")) {
    return origin === normalizedPattern;
  }

  const escaped = normalizedPattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped.replace(/\*/g, ".*")}$`);
  return regex.test(origin);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app.getHttpAdapter().getInstance().disable("etag");

  app.use(
    morgan(
      ':remote-addr [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :res[trace-id]',
    ),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  const configService = app.get(ConfigService);
  const configuredOriginValue =
    configService.get<string>("ORIGIN") ?? process.env.ORIGIN ?? "";

  const configuredOrigins = configuredOriginValue
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultDevOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://localhost:5173",
    "https://127.0.0.1:5173",
    "https://*.euw.devtunnels.ms",
    "https://iboys.data.vincentlge.dev",
  ];

  const allowedOriginPatterns =
    configuredOrigins.length > 0 ? configuredOrigins : defaultDevOrigins;

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed = allowedOriginPatterns.some((pattern) =>
        matchesOriginPattern(origin, pattern),
      );

      callback(null, isAllowed);
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["trace-id"],
    credentials: true,
  };

  app.enableCors(corsOptions);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: (errors: ValidationError[]) => validateErrors(errors),
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

function validateErrors(errors: ValidationError[]) {
  const errorMessages = errors.map((error) => {
    const details: string[] = [];

    if (error.constraints) {
      const detailsKeys = Object.keys(error.constraints);
      for (const key of detailsKeys) {
        if (key === "matches") {
          details.push(error.property + " is not valid");
        } else {
          details.push(error.constraints[key]);
        }
      }
    }

    function checkChildren(children: ValidationError[]) {
      if (children) {
        children.forEach((value) => {
          if (value.constraints) {
            const detailsKeys = Object.keys(value.constraints);
            for (const key of detailsKeys) {
              if (key === "matches") {
                details.push(value.property + " is not valid");
              } else {
                details.push(value.constraints[key]);
              }
            }
          }

          if (value.children) checkChildren(value.children);
        });
      }
    }

    if (error.children) checkChildren(error.children);

    return {
      property: error.property,
      details,
    };
  });

  return new BadRequestException(errorMessages);
}
