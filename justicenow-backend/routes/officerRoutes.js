const express = require("express");

const router = express.Router();

const {
    getOfficerDashboard,
    getOfficerCases,
    getCaseDetails
} = require("../controllers/officerController");


const {
    protectRoute,
    authorizeRoles
} = require("../middlewares/authMiddleware");



// Officer dashboard statistics
router.get(
    "/dashboard",
    protectRoute,
    authorizeRoles("OFFICER", "ADMIN"),
    getOfficerDashboard
);


// Officer case queue
router.get(
    "/cases",
    protectRoute,
    authorizeRoles("OFFICER", "ADMIN"),
    getOfficerCases
);


// Single case details
router.get(
    "/cases/:id",
    protectRoute,
    authorizeRoles("OFFICER", "ADMIN"),
    getCaseDetails
);



module.exports = router;