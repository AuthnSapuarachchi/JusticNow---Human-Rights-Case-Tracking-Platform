const jwt = require('jsonwebtoken');

// 1. Core Authentication: Only checks IF they have a valid token
const protectRoute = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Attach user data to request
            req.user = decoded;
            return next();
        } catch (error) {
            console.error('JWT Verification Failed:', error.message);
            return res.status(401).json({ error: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token provided.' });
    }
};

// 2. Dynamic Role Guard: Checks WHAT they are allowed to do
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user is provided by the protectRoute middleware above
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}` 
            });
        }
        next();
    };
};

module.exports = { protectRoute, authorizeRoles };