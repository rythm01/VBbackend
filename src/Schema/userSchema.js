const mongoose = require('mongoose');
const validator = require("validator");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const brokerSchema = new mongoose.Schema({
    photo: {
        public_id: {
            type: String,
            default: "Avatar/pyvclwz03vy0ty88cunf",
        },
        url: {
            type: String,
            default: "https://res.cloudinary.com/dijdjkiqv/image/upload/v1692686408/Avatar/pyvclwz03vy0ty88cunf.jpg",
        }
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
    package: {
        type: Number,
    },
    phone: {
        type: Number,
        // unique: [true, "Phone number already registered"],
        required: true,
        maxLength: [10, "Phone cannot exceed size 10 numbers"],
        minLength: [10, "Phone shold have 10 numbers"],
    },
    address: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    about: {
        type: String,
        required: true
    },
    reference: {
        type: String,
        required: true
    },
    a: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    b: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    c: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    d: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    e: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    f: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
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
    createdAt: { //date when broker registed first;
        type: Date,
        default: Date.now(),
    },
})

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        validate: [validator.isEmail, "Please enter a valid email"]
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [8, "Password should be more than 8 charachters"],
        select: true
    },
    role: {
        type: String,
        default: "user"
    },
    // registerdAt: { //date when user registed first;
    //     type: Date,
    //     default: Date.now(),
    // },
    resetPasswordToken: String,

    resetPasswordExpire: Date,

    brokersDetails: brokerSchema
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
})

// JWT token
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
};

// Generating Password Reset Token
// userSchema.methods.getResetPasswordToken = function () {
//     // Generating Token
//     const resetToken = Crypto.randomBytes(20).toString("hex");

//     // hasing and adding resetpasswordtoken o userSchema
//     this.resetPasswordToken = Crypto
//         .createHash("sha256")
//         .update(resetToken)
//         .digest("hex");

//     this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

//     return resetToken;
// }
module.exports = mongoose.model("Users", userSchema);