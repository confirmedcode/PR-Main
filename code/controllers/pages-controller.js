// Shared
const AppError = require("shared/error");
const Logger = require("shared/logger");

// Middleware
const { oneOf, query, checkSchema } = require("express-validator/check");
const ValidateCheck = require("../middleware/validate-check.js");

// Models
const { Review } = require("shared/models");
const { Tracker } = require("shared/models");

const ALPHANUMERIC_DASH_UNDERSCORE_PATTERN = /^$|^[a-z0-9-_]+$/;

// Routes
const router = require("express").Router();

router.get("/",
[
  oneOf([
    query("filter").isAlphanumeric().withMessage("Invalid Tracker Filter"),
    query("filter").isEmpty()
  ]),
  ValidateCheck
],
(request, response, next) => {
  const filter = request.values.filter;
  
  var trackers = [];
  var trackerDisplayName = '';
  return Tracker.getAll()
    .then(results => {
      trackers = results;
      if (filter) {
        for (var index in trackers) {
          if (trackers[index].name == filter) {
            trackerDisplayName = trackers[index].displayName;
            break;
          }
        }
        if (trackerDisplayName == '') {
          throw new AppError(400, 99, `Tracker not found: ${filter}`);
        }
        return Review.getAllUsingTracker(filter);
      }
      else {
        return Review.getAll();
      }
    })
    .then(reviews => {
      response.render("index", {
        reviews: reviews,
        trackers: trackers,
        filteredTrackerDisplayName: trackerDisplayName
      })
    })
  .catch( error => next(error) );
});

router.get("/:review",
[
  checkSchema({
    review: {
      in: ["params"],
      customSanitizer: {
        options: (value, { request, location, path }) => {
          if (value) {
            return value.toLowerCase();
          }
          return null;
        }
      },
      matches: {
        options: ALPHANUMERIC_DASH_UNDERSCORE_PATTERN
      },
      errorMessage: "Invalid Review"
    }
  }),
  ValidateCheck
],
(request, response, next) => {
  const review = request.values.review;
  return Review.getWithName(review)
    .then(reviewItem => {
      return response.render("review", {
        review: reviewItem
      });
    })
  .catch( error => next(error) );
});

module.exports = router;