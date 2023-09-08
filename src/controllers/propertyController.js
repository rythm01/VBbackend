const ErrorHandler = require('../utils/errorhandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const Property = require("../Schema/propertySchema")
const User = require("../Schema/userSchema");
const cloudinary = require("../utils/cloudinary");
const ApiFeatures = require("../utils/apiFeatures");

exports.addProperties = catchAsyncErrors(async (req, res, next) => {
    try {

        const propertyImages = req.files.propertyPhotos;

        const propertyToBeAdd = new Property(req.body);
        propertyToBeAdd.broker_id = req.params.brokerId;

        const propertyImagesArray = Array.isArray(propertyImages) ? propertyImages : [propertyImages];

        for (const photo of propertyImagesArray) {
            console.log(photo);
            try {
                const propertyImage = await cloudinary.uploader.upload(photo.path, { folder: 'Property' });
                const uploadImage = {
                    public_id: propertyImage.public_id,
                    url: propertyImage.url
                }
                propertyToBeAdd.p_Images.push(uploadImage);
            } catch (error) {
                console.error(error);
                return next(new ErrorHandler('Unable to upload images to Cloudinary', 400));
            }
        }

        await propertyToBeAdd.save();

        res.status(201).json({
            success: true,
            property: propertyToBeAdd,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Failed to add property', 400));
    }
});

exports.updateImages = catchAsyncErrors(async (req, res, next) => {
    try {

        const existProperty = await Property.find({ _id: req.params.propertyId });
        console.log(existProperty);

        const propertyImages = req.files.propertyPhotos;
        console.log(propertyImages);

        const propertyImagesArray = Array.isArray(propertyImages) ? propertyImages : [propertyImages];

        const updatedPhotos = [];

        for (let i = 0; i < existProperty[0].p_Images[0].length; i++) {
            await cloudinary.uploader.destroy(existProperty[0].p_Images[i].public_id);
        }


        for (const photo of propertyImagesArray) {
            try {
                const propertyImage = await cloudinary.uploader.upload(photo.path, { folder: 'Property' });
                const uploadImage = {
                    public_id: propertyImage.public_id,
                    url: propertyImage.url
                }
                updatedPhotos.push(uploadImage);
            } catch (error) {
                console.error(error);
                return next(new ErrorHandler('Unable to upload image(s) to Cloudinary', 400));
            }
        }

        existProperty[0].p_Images = updatedPhotos;

        await existProperty[0].save();

        res.status(200).json({
            success: true,
            data: "Updated Successfully",
        });


    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Failed to update property images', 400));
    }
})


exports.updateProperties = catchAsyncErrors(async (req, res, next) => {
    try {
        const propertyId = req.params.propertyId;
        const updatedData = req.body;

        const existingProperty = await Property.findById(propertyId);

        if (!existingProperty) {
            return next(new ErrorHandler('Unable to find property', 400));
        }

        Object.assign(existingProperty, updatedData);

        await existingProperty.save();

        res.status(200).json({
            success: true,
            property: existingProperty,
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Failed to update property', 400));
    }
});

exports.addAmenities = catchAsyncErrors(async (req, res, next) => {
    console.log(req.body);
    try {
        const existProperty = await Property.findOne({ _id: req.params.propertyId });

        // console.log(req.body.amenities);

        const amenitiesArray = req.body.amenities.split(',').map(item => item.trim());

        const existingAmenities = existProperty.amenities || [];

        const updatedAmenities = existingAmenities.concat(amenitiesArray);

        existProperty.amenities = updatedAmenities;

        await existProperty.save();

        res.status(200).json({
            success: true,
            message: 'Amenities added successfully',
            amenities: existProperty.amenities
        });

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Unable to find property', 400));
    }

})

exports.deleteAmenities = catchAsyncErrors(async (req, res, next) => {
    function arraysAreEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false;
        }

        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }
        return true;
    }
    try {
        const existProperty = await Property.findOne({ _id: req.params.propertyId });
        if (!existProperty) {
            return next(new ErrorHandler('Unable to find property', 400));
        }

        const amenitiesToDelete = req.body.amenities.split(',').map(item => item.trim());

        const existingAmenities = existProperty.amenities || [];

        const updatedAmenities = existingAmenities.filter(amenity => !amenitiesToDelete.includes(amenity));

        if (arraysAreEqual(updatedAmenities, existingAmenities)) {
            return res.status(400).json({
                message: "Selected Amenites not present!"
            })
        }
        existProperty.amenities = updatedAmenities;

        await existProperty.save();

        res.status(200).json({
            success: true,
            message: 'Amenities deleted successfully',
            amenities: existProperty.amenities
        });
    } catch (error) {
        console.log(error);
        return next(new ErrorHandler('Error deleting amenities', 500));
    }
});




exports.addReviews = catchAsyncErrors(async (req, res, next) => {
    try {
        const existProperty = await Property.findOne({ _id: req.params.propertyId });
        // console.log(existProperty);

        if (!existProperty) {
            return next(new ErrorHandler('Unable to find property', 400));
        }

        const user = await User.findOne({ _id: req.params.userId });
        // console.log(user);

        if (!user) {
            return next(new ErrorHandler('Unable to find user', 400));
        } else {

            const existingReview = existProperty.reviews.find(review => review.userId.equals(user._id));

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

            existProperty.reviews.push(newReview);

            const currentNumOfReviews = existProperty.numOfReviews;
            existProperty.numOfReviews = currentNumOfReviews + 1;

            const currentRatings = existProperty.ratings;
            const allRatingsSum = existProperty.reviews.reduce((sum, review) => sum + review.rating, 0);
            const newAverageRating = allRatingsSum / existProperty.numOfReviews;

            existProperty.ratings = newAverageRating;

            await existProperty.save();

            res.status(201).json({
                success: true,
                message: 'Review added successfully'
            });
        }

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Failed to add review', 400));
    }
})


exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    try {
        const existProperty = await Property.findOne({ _id: req.params.propertyId });

        if (!existProperty) {
            return next(new ErrorHandler('Unable to find property', 400));
        }

        const reviewIndex = existProperty.reviews.findIndex(review => review.userId.equals(req.params.userId));

        if (reviewIndex === -1) {
            return next(new ErrorHandler('Unable to find user and Failed to delete review', 400));
        }

        existProperty.reviews.splice(reviewIndex, 1);

        const currentNumOfReviews = existProperty.numOfReviews;
        existProperty.numOfReviews = currentNumOfReviews - 1;

        if (existProperty.numOfReviews > 0) {
            const allRatingsSum = existProperty.reviews.reduce((sum, review) => sum + review.rating, 0);
            const newAverageRating = allRatingsSum / existProperty.numOfReviews;
            existProperty.ratings = newAverageRating;
        } else {
            existProperty.ratings = 0;
        }

        await existProperty.save();

        res.status(201).json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error(error);
        return next(new ErrorHandler('Failed to delete review', 400));
    }
})

exports.getLatLng = catchAsyncErrors(async (req, res, next) => {
    const { city } = req.params;
    
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const latitude = parseFloat(data[0].lat);
                const longitude = parseFloat(data[0].lon);
                res.status(200).send({
                    success: true,
                    data: {
                        latitude,
                        longitude
                    }
                })
            } else {
                return next(new ErrorHandler(`No results found for ${city}`, 400));
            }
        })
        .catch(error => {
            return next(new ErrorHandler('Error fetching data', 400));
        });
})



exports.getSingleProperty = catchAsyncErrors(async (req, res, next) => {
    try {
        const existProperty = await Property.findOne({ _id: req.params.propertyId });
        res.status(200).send({
            success: true,
            data: existProperty
        })

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Property not found", 400))
    }
})

exports.getPropertiesOfBroker = catchAsyncErrors(async (req, res, next) => {
    try {
        const resultPerPage = 5;

        const apiFeatures = new ApiFeatures(Property.find({ broker_id: req.params.brokerId }), req.query)
            .search()
            .filter()
            .pagination(resultPerPage);

        const property = await apiFeatures.query;


        res.status(200).json({
            success: true,
            property,
        });

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Property not found", 400))
    }
})


exports.getAllProperty = catchAsyncErrors(async (req, res, next) => {
    try {
        const resultPerPage = 9;

        const apiFeatures = new ApiFeatures(Property.find(), req.query)
            .search()
            .filter()
            .pagination(resultPerPage);

        const property = await apiFeatures.query;

        res.status(200).json({
            success: true,
            property,
        });

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("Property not found", 400))
    }
})

exports.deleteProperty = catchAsyncErrors(async (req, res, next) => {
    try {
        
        await Property.findByIdAndDelete(req.params.propertyId);

        // for (let i = 0; i < Property[0].p_Images[0].length; i++) {
        //     await cloudinary.uploader.destroy(Property[0].p_Images[i].public_id);
        // }

        res.status(200).send({
            success: true,
            data: "Property deleted suceessfully"
        })

    } catch (error) {
        console.log(error);
        return next(new ErrorHandler("unable to delete property", 400))
    }
})