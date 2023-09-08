const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then((data) => {
    console.log(`connection successful with server: ${data.connection.host}`);
}).catch((e) => {
    console.log(e);
})