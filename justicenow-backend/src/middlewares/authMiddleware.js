const jwt = require('jsonwebtoken');

const protectOfficerRoute = (req, res, next) => {
    let token;

    // 1. Check if the token exists in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token (e.g., "Bearer eyJhbGciOi...")
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify the token using your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Role-Guard: Ensure the user is an OFFICER or ADMIN
            if (decoded.role !== 'OFFICER' && decoded.role !== 'ADMIN') {
                return res.status(403).json({ 
                    error: 'Access denied. Only authorized officers can perform this action.' 
                });
            }

            // 4. Attach the decoded user data to the request so the next function can use it
            req.user = decoded;
            next();

        } catch (error) {
            console.error('JWT Verification Failed:', error.message);
            return res.status(401).json({ error: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token provided.' });
    }
};

module.exports = { protectOfficerRoute };