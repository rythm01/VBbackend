const express = require('express');
const { registerUser, brokerRegister, loginUser, logout, forgotPassGet,forgotPassPost,sendContactMail,resetPassGet,resetPassPost, getAllUser, getSingleUser, updateUserRole, deleteUser, sendMail,getApproval, rejectApproval,getAllBrokers, getSingleBroker, updateBroker,addReviews,deleteReview} = require('../controllers/userController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')
const router = express.Router();
const upload = require('../utils/multer');
const { addPayments, verifyPayment } = require('../controllers/razorPay');


router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logout);

router.route("/forgot-password").get(forgotPassGet).post(forgotPassPost);
router.route("/reset-password/:userId/:token").get(resetPassGet).post(resetPassPost);

router.route("/broker/:userId").get(getSingleBroker).put(upload.fields([{name: 'photo', maxCount: 5},{ name: 'a', maxCount: 5 }, { name: 'b', maxCount: 5 }, { name: 'c', maxCount: 5 }, { name: 'd', maxCount: 5 }, { name: 'e', maxCount: 5 }, { name: 'f', maxCount: 5 },]), brokerRegister);
router.route("/broker/approve/:userId").put(getApproval);
router.route("/broker/reject/:userId").put(rejectApproval);
router.route("/brokers").get(getAllBrokers);
router.route("/sendmail").post(sendContactMail);
router.route("/update/broker/:userId").put(upload.fields([{name: 'photo', maxCount: 5}]),updateBroker);
router.route("/:userId/reviewBroker/:brokerId").post(isAuthenticatedUser,addReviews).delete(isAuthenticatedUser,deleteReview);

router.route("/subscribe").post(addPayments);
router.route("/verify/payment/:userId/:price").post(verifyPayment);

router.route("/admin/users").get(getAllUser)
router.route("/admin/user/:id").get(isAuthenticatedUser,getSingleUser)
    .delete(isAuthenticatedUser, deleteUser)

module.exports = router;