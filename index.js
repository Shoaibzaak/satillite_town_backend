require("dotenv").config();
var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var port = require("./config/config");
const connection = require("./connection/connection"); 
var app = express();
var server = require("http").createServer(app);
var response = require("./response/index");
const logger = require("./services/LoggerService");
const Message = require("./models/Message"); // You'll need to create this model
const User = require("./models/User"); // Assuming you have a User model
var api = require("./routes/routes");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.send("jusoor project ")
});
app.use(
  response.ok,
  response.fail,
  response.serverError,
  response.forbidden,
  response.notFound,
  response.badRequest
);
app.use(cors());
app.use("/api", api);
app.use(express.static(__dirname + '/public'));
const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  console.log(error);
  logger.error({
    statusCode: `${status}`,
    message: `${error.message}`,
    error: `${error}`,
    stackTrace: `${error.stack}`,
  });

  res.status(status).json({
    success: false,
    message: error.message,
  });
};
app.use(errorHandler);

connection.connect((dbSuccess) => {
  if (dbSuccess) {
    // Initialize Socket.IO after DB connection is established
    connection.initializeSocket(server);
    
    server.listen(port.port, () => {
      console.log(`Server is running on port ${port.port}`);
    });
  } else {
    console.error("Failed to connect to database");
    process.exit(1);
  }
});
