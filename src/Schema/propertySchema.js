const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
    broker_id: {
        type: String,
        unique: false,
        required: true
    },
    pName: {
        type: String,
        required: true,
    },
    desc:{
        type:String,
        required:true,
    },
    p_Images: [{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    Rooms:{
        type:Number,
        required: true
    },
    bedroom: {
        type: Number,
        required: true
    },
    bath: {
        type: Number,
        required: true
    },
    buildYear: {
        type: Number,
        required: true
    },
    garage: {
        type: Number,
        required: true
    },
    pSize: {
        type: Number,
        required: true
    },
    propertyType: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    //propery id same as id generated by mongodb
    price: {
        type: Number,
        required: true
    },
    Address: {
        type: String,
        required: true
    },
    ZipCode: {
        type: Number,
        required: true,
        minLength: 6,
        maxLength: 6
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    amenities: [{
        type: String,
    }],
    ratings: {
        type: Number,
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            userId: {
                type: mongoose.Schema.ObjectId,
                ref: "Users",
                required: true,
            },
            userName: {
                type: String,
                required: true,
            },
            rating: {
                type: Number,
                required: true,
            },
            comment: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now(),
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now(),
    },
})


module.exports = mongoose.model("Property", propertySchema);