const ErrorHandler = require('../utils/errorhandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const User = require("../Schema/userSchema");
const sendToken = require("../utils/jwtTokens");
const nodemailer = require("nodemailer");
const cloudinary = require("../utils/cloudinary");
const ApiFeatures = require("../utils/apiFeatures");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register a user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;

    if (email === 'admin@gmail.com' && password === 'abcd@123') {
        role = 'admin';
    }

    const user = await User.create({
        name,
        email,
        password,
        role
    });

    const token = user.getJWTToken();

    sendToken(user, 201, res);
})

// login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    // Checking if user has given password and email both
    if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const isPasswordMatched = user.comparePassword(password);

    if (await isPasswordMatched == false) {
        return next(new ErrorHandler("Invalid email or password", 401));
    }

    const token = user.getJWTToken();

    sendToken(user, 200, res);
})

//Logout user 
exports.logout = catchAsyncErrors(async (req, res, next) => {

    res.cookie("tokenjwt", null, {
        httponly: true,
        expires: new Date(Date.now()),
    });

    res.status(200).json({
        success: true,
        message: "Logged Out Successfully",
    })

})

//forgot password init
exports.forgotPassGet = catchAsyncErrors(async (req, res, next) => {
    res.render('forgot-password');
})

exports.forgotPassPost = catchAsyncErrors(async (req, res, next) => {

    try {
        const { email } = req.body;

        if (!email) {
            return next(new ErrorHandler("Please enter email", 400));
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 401));
        }

        const secret = process.env.JWT_SECRET + user.password;

        const payload = {
            email: user.email,
            id: user._id,
        }

        const token = jwt.sign(payload, secret, { expiresIn: '10m' });

        const link = `https://v-bbackend.vercel.app/api/reset-password/${user._id}/${token}`;
        console.log(link);

        const to = user.email;
        const subject = 'Reset Password';
        const html = `
          <h1>Password Reset Email</h1>
          <p>Hello,</p>
          <p>You have requested to reset your password. Click the link below to reset your password:</p>
          <a href="${link}">link</a>
          <b>#Note: This link is only valid for 10 minutes</b>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Best regards,<br>Team Varified Broker</p>
        `;
        await exports.sendMail(to, subject, html);

        res.send("Check your inbox password reset link has been sent successfully!");
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Unable to proceed ", 400));
    }

})

exports.resetPassGet = catchAsyncErrors(async (req, res, next) => {
    try {
        const { userId, token } = req.params;
        const user = await User.findOne({ _id: userId }).select("+password");

        if (user._id != userId) {
            return next(new ErrorHandler("Invalid User", 401));
        }

        const secret = process.env.JWT_SECRET + user.password;

        try {
            const payload = jwt.verify(token, secret);
            res.render('reset-password', { email: user.email });
        } catch (err) {
            console.log("Link Expired! ", err.message);
            res.send(err.message);
        }
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Unable to proceed ", 400));
    }

})

exports.resetPassPost = catchAsyncErrors(async (req, res, next) => {
    try {
        const { userId, token } = req.params;
        const { password, password2 } = req.body;
        const user = await User.findOne({ _id: userId }).select("+password");

        if (user._id != userId) {
            return next(new ErrorHandler("Invalid User", 401));
        }

        const secret = process.env.JWT_SECRET + user.password;

        try {
            const payload = jwt.verify(token, secret);

            if (password !== password2) {
                return next(new ErrorHandler("Passwords do not match", 400));
            }
            user.password = password;
            await user.save();

            res.status(200).json({ message: "Password Reset Successfully!" });
        } catch (err) {
            console.log("Link Expired! ", err.message);
            res.send(err.message);
        }
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Unable to proceed ", 400));
    }
})

exports.brokerRegister = catchAsyncErrors(async (req, res, next) => {
    try {
        const { phone, address, experience, about, reference } = req.body;

        const user = await User.findOne({ _id: req.params.userId });

        if (!user) {
            return res.status(401).send("User not found");
        }

        if (user.brokersDetails) {
            return res.status(401).send("You have already been registered");
        }

        const uploadAndCreateDocument = async (file) => {
            try {
                const type = file[0].mimetype.startsWith('image') ? 'image' : 'raw';
                const image = await cloudinary.uploader.upload(file[0].path, {
                    resource_type: type,
                    format: type === 'image' ? 'jpg' : 'pdf', // Set default format to 'jpg'
                    folder: 'documents'
                });
                return {
                    public_id: image.public_id,
                    url: image.url
                };
            } catch (error) {
                console.log(error);
                throw new ErrorHandler("Unable to upload(s) to Cloudinary", 401);
            }
        };

        const brokerDetails = {
            phone,
            address,
            experience,
            about,
            reference,
        };


        const documents = ['a', 'b', 'c', 'd', 'e', 'f', 'photo'];


        for (const doc of documents) {
            if (req.files[doc]) {
                brokerDetails[doc] = await uploadAndCreateDocument(req.files[doc]);
            }
        }

        user.brokersDetails = brokerDetails;

        await user.save();

        res.status(200).json({
            success: true,
            data: user
        });

        const to = user.email;
        const subject = 'Approval request';
        const html = `<h1>Your registration is under inspection wait for approval....</h1>`;

        await exports.sendMail(to, subject, html);

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler("Broker not registered", 401));
    }
});

exports.sendMail = async (to, subject, html) => {
    try {
        let transporter = await nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'Darshanpanchal9292@gmail.com', //mailId of admin
                pass: 'tzyutbeyqlcurvzx' //in the same email id generate custom password 
                //Reference ::: https://youtu.be/nuD6qNAurVM?si=OdrMi7iLS5RUkQTB
            }
        });

        await transporter.sendMail({
            from: 'Darshanpanchal9292@gmail.com', //Same email id used before
            to: to,
            subject: subject,
            html: html,
        });

    } catch (error) {
        console.log('Error sending email:', error);
    }
};

exports.getApproval = catchAsyncErrors(async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.params.userId });

        if (!user) {
            return next(new ErrorHandler("User not found", 400));
        }

        user.brokersDetails.isVerified = "true"
        user.role = "broker"

        await user.save();

        res.status(200).json({
            success: true,
            data: "Verified"
        });

        const to = user.email;
        const subject = 'Approval Status';
        const html = `<h1>Congratulations! You are approved as a broker</h1><br/>
        <h2>You can now proceed with the payment and log in to access your dashboard.</h2>`;

        await exports.sendMail(to, subject, html);


    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Unable to approve", 400));
    }
})

exports.rejectApproval = catchAsyncErrors(async (req, res, next) => {

    try {
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.params.userId },
            { $unset: { brokersDetails: 1 } },
            { new: true }
        );

        if (!updatedUser) {
            return next(new ErrorHandler("User not found", 400));
        }

        res.status(200).json({
            success: true,
            data: "Rejected"
        });

        const to = updatedUser.email;
        const subject = 'Approval Status';
        const html = `<h1>Your application to become a broker has been regretfully rejected</h1><br/>
        <h2>We appreciate your interest, but your application did not meet our current requirements for approval.</h2><br/>
        <h2>You are welcome to reapply after 7 days, ensuring all necessary documents are uploaded for verification.</h2>`;

        await exports.sendMail(to, subject, html);


    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Unable to Reject", 400));
    }
});

exports.updateBroker = catchAsyncErrors(async (req, res, next) => {
    try {

        const broker = await User.findOne({ _id: req.params.userId, role: "broker" });

        if (!broker) {
            return next(new ErrorHandler("Unable to find broker", 400));
        }

        const { name, phone, experience, about, reference, address } = req.body;


        if (req.files.photo != null) {
            const updatedPhoto = req.files.photo;

            let newPhoto;

            try {
                newPhoto = await cloudinary.uploader.upload(updatedPhoto[0].path, { folder: 'Avatar' });
            } catch (error) {
                console.log(error);
                return next(new ErrorHandler("Unable to upload in cloudinary", 400));
            }

            const photoDetails = {
                public_id: newPhoto.public_id,
                url: newPhoto.url
            }

            broker.brokersDetails.photo = photoDetails;

        }

        broker.name = name;
        broker.brokersDetails.phone = phone;
        broker.brokersDetails.experience = experience;
        broker.brokersDetails.about = about;
        broker.brokersDetails.reference = reference;
        broker.brokersDetails.address = address;


        await broker.save();


        res.status(200).send({
            success: true,
            data: broker
        });


    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Unable to update broker", 400));
    }
})

exports.getSingleBroker = catchAsyncErrors(async (req, res, next) => {
    try {

        const broker = await User.findOne({ _id: req.params.userId, role: "broker" });

        res.status(200).send({
            success: true,
            broker
        });

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Unable to find broker", 400));
    }
})

exports.getAllBrokers = catchAsyncErrors(async (req, res, next) => {
    try {
        const resultPerPage = 25;

        const apiFeatures = new ApiFeatures(User.find({ role: "broker" }), req.query)
            .search()
            .filter()
            .pagination(resultPerPage);

        const broker = await apiFeatures.query

        res.status(200).json({
            success: true,
            broker,
        });

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Property not found", 400))
    }
})

// Get user details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        user
    })
})

// Update user Password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched)
        return next(new ErrorHandler("old password is incorrect", 400));

    if (req.body.newPassword != req.body.confirmPassword)
        return next(new ErrorHandler("passwword does not matched", 400));

    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200, res);
})

// Update Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUser = {
        name: req.body.name,
        email: req.body.email
    }
    // Here avatar will add....
    const user = await User.findByIdAndUpdate(req.user.id, newUser, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
})

// Get All Users (Admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
    const resultPerPage = 10;

    const apiFeatures = new ApiFeatures(User.find(), req.query)
        .search()
        .filter()
        .pagination(resultPerPage);

    const users = await apiFeatures.query;

    res.status(200).json({
        success: true,
        users
    })
})

// Get Single User Detail (Admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user)
        return next(new ErrorHandler(`User does not exists with Id : ${req.params.id}`, 400));

    res.status(200).json({
        success: true,
        user
    })
})

// Delete user -- Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user)
        return next(new ErrorHandler(`User does not exists with Id : ${req.params.id}`, 400));

    await user.deleteOne();
    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    })
})

exports.addReviews = catchAsyncErrors(async (req, res, next) => {
    console.log(req.params.brokerId);
    try {
        const broker = await User.findOne({ _id: req.params.brokerId });

        if (!broker) {
            return next(new ErrorHandler('Unable to find broker', 400));
        }

        const user = await User.findOne({ _id: req.params.userId });

        console.log(user);

        if (!user) {
            return next(new ErrorHandler('Unable to find user', 400));
        } else {

            const existingReview = broker.brokersDetails.reviews.find(review => review.userId.equals(user._id));

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: "You have already added a review for this property",
                })
            }

            const newRating = req.body.rating;
            const newReview = {
                userId: user._id,
                userName: user.name,
                rating: newRating,
                comment: req.body.comment
            };

            broker.brokersDetails.reviews.push(newReview);

            const currentNumOfReviews = broker.brokersDetails.numOfReviews;
            broker.brokersDetails.numOfReviews = currentNumOfReviews + 1;

            const currentRatings = broker.brokersDetails.ratings;
            const allRatingsSum = broker.brokersDetails.reviews.reduce((sum, review) => sum + review.rating, 0);
            const newAverageRating = allRatingsSum / broker.brokersDetails.numOfReviews;

            broker.brokersDetails.ratings = newAverageRating;

            await broker.save();

            res.status(201).json({
                success: true,
                message: broker
            });
        }

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Failed to add review', 400));
    }
})


exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    try {
        const broker = await User.findOne({ _id: req.params.brokerId });

        if (!broker) {
            return next(new ErrorHandler('Unable to find property', 400));
        }

        const reviewIndex = broker.brokersDetails.reviews.findIndex(review => review.userId.equals(req.params.userId));

        if (reviewIndex === -1) {
            return next(new ErrorHandler('Unable to find user and Failed to delete review', 400));
        }

        broker.brokersDetails.reviews.splice(reviewIndex, 1);

        const currentNumOfReviews = broker.brokersDetails.numOfReviews;
        broker.brokersDetails.numOfReviews = currentNumOfReviews - 1;

        if (broker.brokersDetails.numOfReviews > 0) {
            const allRatingsSum = broker.brokersDetails.reviews.reduce((sum, review) => sum + review.rating, 0);
            const newAverageRating = allRatingsSum / broker.brokersDetails.numOfReviews;
            broker.brokersDetails.ratings = newAverageRating;
        } else {
            broker.brokersDetails.ratings = 0;
        }

        await broker.save();

        res.status(201).json({
            success: true,
            message: broker
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Failed to delete review', 400));
    }
})



exports.sendContactMail = catchAsyncErrors(async (req, res, next) => {
    // const { name, userMailId, brokerMailId, message } = req.body;

    try {

        //     let transporter = nodemailer.createTransport({
        //         host: 'smtp.gmail.com',
        //         port: 587,
        //         secure: false,
        //         requireTLS: true,
        //         auth: {
        //             user: userMailId,
        //             pass: userCustomPassword //in the same email id generate custom password 
        //             //Reference ::: https://youtu.be/nuD6qNAurVM?si=OdrMi7iLS5RUkQTB
        //         }
        //     });
        //     await transporter.sendMail({
        //         from: userMailId,
        //         to: brokerMailId,
        //         subject: 'FAQ',
        //         html: `<h1>${name}</h1></br><h1>${message}</h1>`,
        //     });

        res.status(200).send({
            success: true,
            message: "Email Sent Successfully"
        })

    } catch (error) {
        console.log('Error sending email:', error);
    }

})

