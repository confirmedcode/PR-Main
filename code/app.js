// Load environment
require("./config/environment.js");

// Shared
const AppError = require("shared/error");
const Logger = require("shared/logger");

// Constants
const DOMAIN = process.env.PR_DOMAIN;
const NODE_ENV = process.env.NODE_ENV;
const ENVIRONMENT = process.env.ENVIRONMENT;

// Express and body parsers
const express = require("express");
const app = express();
app.use(express.json({
  extended: true
}));
app.use(express.urlencoded({
  extended: true
}));

// Main only logs errors
const expressWinston = require("express-winston");
expressWinston.requestWhitelist = ["url", "method", "httpVersion", "originalUrl"];
app.use(expressWinston.logger({
  winstonInstance: Logger,
  skip: function (request, response) {
    if (response.statusCode < 400) {
      return true;
    }
    return false;
  }
}));

// Log unhandled rejections
process.on("unhandledRejection", error => {
  Logger.error(`unhandledRejection:
    ${error.stack}`);
});

// Basic Security
app.use(require("helmet")());

app.engine(".hbs", require("express-handlebars")({
  defaultLayout: "main",
  extname: ".hbs",
  partialsDir: __dirname + "/views/partials/"
}));
app.set("view engine", ".hbs");
app.locals.DOMAIN = DOMAIN;
app.locals.RATING_COLOR = {
  "A": "#16C970",
  "B": "#CDE62C",
  "C": "#FFC107",
  "D": "#F7632F",
  "F": "#EB3540"
}
if (NODE_ENV === "production") {
  app.locals.S3_BUCKET = "https://privacyreview-site-assets.s3.amazonaws.com";
}
else {
  app.locals.S3_BUCKET = "/local-assets"
}
app.use(express.static("public"));

if (NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.get("/error-test", (request, response, next) => {
  next(new AppError(500, 999, "Test alerts", "Details here"));
});

app.get("/health", (request, response, next) => {
  response.status(200).json({
    message: "OK from " + DOMAIN
  });
});

app.get("/privacy", (request, response, next) => {
  response.render("privacy");
});

// Controllers
app.use("/", require("./controllers/pages-controller.js"));

// Log Errors
app.use(expressWinston.errorLogger({
  winstonInstance: Logger
}));

// Handle Errors
app.use((error, request, response, next) => {
  if (response.headersSent) {
    Logger.error("RESPONSE ALREADY SENT");
    return;
  }
  return response.format({
    json: () => {
      if (error.statusCode >= 200 && error.statusCode < 500) {
        response.status(error.statusCode).json({
          code: error.appCode,
          message: error.message
        });
      }
      else {
        response.status(500).json({
          code: -1,
          message: "Unknown Internal Error"
        });
      }
    },
    html: () => {
      if (error.statusCode >= 200 && error.statusCode < 500) {
        response.render("error", {
          message: "Error " + (error.appCode ? error.appCode : "") + " - " + error.message
        });
      }
      else {
        response.render("error", {
          message: "Unknown Internal Error"
        });
      }
    }
  });
});

// Handle 404 Not Found
app.use((request, response, next) => {
  Logger.info("404 NOT FOUND - " + request.originalUrl);
  return response.format({
    json: () => {
      response.status(404).json({
        code: 404,
        message: "Not Found"
      });
    },
    html: () => {
      response.render("error", {
        message: "The page you are looking for does not exist."
      });
    }
  });
});

module.exports = app;