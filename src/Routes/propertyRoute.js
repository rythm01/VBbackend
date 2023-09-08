const express = require("express");
const {isAuthenticatedUser} = require('../middleware/auth');
const { addProperties, addReviews, getSingleProperty, getAllProperty, getPropertiesOfBroker, deleteProperty, deleteReview, updateProperties, addAmenities, deleteAmenities, updateImages, getLatLng } = require("../controllers/propertyController");
const router = express.Router();
const upload = require('../utils/multer');

router.route("/add/property/:brokerId").post(isAuthenticatedUser,upload.fields([{ name: 'propertyPhotos', maxCount: 5 },]), addProperties);
router.route("/update/property/:propertyId").put(isAuthenticatedUser,updateProperties);
router.route("/update/images/:propertyId").put(isAuthenticatedUser,upload.fields([{ name: 'propertyPhotos', maxCount: 5 },]),updateImages);
router.route("/amenities/:propertyId").put(isAuthenticatedUser,addAmenities).delete(isAuthenticatedUser,deleteAmenities);
router.route("/:userId/review/:propertyId").post(isAuthenticatedUser,addReviews).delete(isAuthenticatedUser,deleteReview);
router.route("/property/:propertyId").get(getSingleProperty).delete(isAuthenticatedUser,deleteProperty);
router.route("/property").get(getAllProperty);
router.route("/properties/:brokerId").get(isAuthenticatedUser,getPropertiesOfBroker);
router.route("/latlng/:city").get(getLatLng);

module.exports = router;