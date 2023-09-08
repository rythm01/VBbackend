const ErrorHandler = require('../utils/errorhandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const User = require("../Schema/userSchema");
const Razorpay = require("razorpay");
const CryptoJS = require('crypto-js');
const { sendMail } = require('../controllers/userController');


exports.addPayments = catchAsyncErrors(async (req, res, next) => {
    let instance = new Razorpay({ key_id: process.env.KEY_ID, key_secret: process.env.KEY_SECRET })

    var options = {
        amount: (req.body.price) * 100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
    };

    instance.orders.create(options, function (err, order) {
        if (err)
            return new ErrorHandler("Server error", 500);

        res.status(200).json({
            success: true,
            order,
        });
    });
})

exports.verifyPayment = catchAsyncErrors(async (req, res, next) => {
    const { userId, price } = req.params;

    const broker = await User.findOne({ _id: userId });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = CryptoJS.HmacSHA256(sign.toString(), process.env.KEY_SECRET).toString(CryptoJS.enc.Hex);

    if (expectedSignature === razorpay_signature) {
        broker.brokersDetails.paymentStatus = true;
        broker.brokersDetails.package = price;
        broker.save();

        const to = broker.email;
        const subject = 'Subsctiption';
        const html = `<h1>Congratulation!You have successfully accessed package of ₹${price}</h1>
        <h3>Now you can access dashboard to add properties</h3>`;

        await sendMail(to, subject, html);

        res.status(200).json({
            success: true,
            message: broker
        });
    }

    else {
        return new ErrorHandler("Inavlid payment", 500);
    }
})