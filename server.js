const express = require("express");
const app = express();
require("dotenv").config();
const bodyParser = require("body-parser");
const dbConnect = require("./config/dbConnect");
const initRouter = require("./routes");
const cookieParser = require("cookie-parser");
const post = process.env.PORT || 5000;
const cors = require("cors");

const allowedOrigins = ["https://web-client-neon.vercel.app"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
dbConnect();
initRouter(app);

app.listen(post, () => {
  console.log(`Server is running  at PORT ${post}`);
});
