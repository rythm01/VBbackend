require('dotenv').config();
const express = require('express');
require("./src/db/connection");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require("cors");
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;

// Handling uncaught exception
process.on("uncaughtException", (err) => {
    console.log(err);
    console.log(`Error : ${err.message}`);
    console.log(`Shutting down the server due to Uncaught Exception`);
    process.exit(1);
})
app.use(cookieParser());

const corsOptions = {
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify the allowed headers
    credentials: true, // Enable credentials (cookies, authorization headers, etc)
};


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'src' , 'views'));

app.set('view engine', 'ejs');

app.use(cors(corsOptions));

app.listen(port, () => {
    console.log(`connection is live at port no ${port}`);
});

app.get("/", async (req, res) => {
    res.send("Namaste GoAgrics");
});

const user = require("./src/Routes/userRoute");
const property = require("./src/Routes/propertyRoute")

app.use("/api",user);
app.use("/api",property);

// unhandled promise rejection
process.on("unhandledRejection",(err)=>{
    console.log(`Error : ${err.message}`);
    console.log(`Shutting down the server due to Unhandled Promise Rejection`);

    server.close(()=>{
        process.exit(1);
    })
})