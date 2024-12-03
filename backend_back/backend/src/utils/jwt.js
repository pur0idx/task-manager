import crypto from 'crypto'

// Base64URL encoding functions
const base64URLEncode = (str) => {
    return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};

const base64URLDecode = (str) => {
    // Add back padding
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return Buffer.from(str, 'base64').toString();
};

const jwtSign = async (payload, secret) => {
    try {
        const headers = {
            alg: 'HS256',
            typ: 'JWT'
        };

        const base64Headers = base64URLEncode(JSON.stringify(headers));
        const base64Payload = base64URLEncode(JSON.stringify(payload));

        const signature = crypto
            .createHmac('sha256', secret || '')
            .update(`${base64Headers}.${base64Payload}`)
            .digest('base64url');

        return `${base64Headers}.${base64Payload}.${signature}`;
    } catch (error) {
        console.error('JWT Sign Error:', error);
        throw new Error('Error creating JWT token');
    }
};

const jwtVerify = async (token, secret) => {
    try {
        const [base64Headers, base64Payload, signature] = token.split('.');

        if (!base64Headers || !base64Payload || !signature) {
            throw new Error('Invalid token format');
        }

        // Decode headers and payload
        const headers = JSON.parse(base64URLDecode(base64Headers));
        const payload = JSON.parse(base64URLDecode(base64Payload));

        // Verify signature
        const recreatedSignature = crypto
            .createHmac('sha256', secret || '')
            .update(`${base64Headers}.${base64Payload}`)
            .digest('base64url');

        if (recreatedSignature !== signature) {
            throw new Error('Invalid signature');
        }

        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            throw new Error('Token expired');
        }

        return payload;
    } catch (error) {
        console.error('JWT Verify Error:', error);
        throw new Error('Invalid token');
    }
};

// Middleware for Express
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const payload = await jwtVerify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

export { jwtSign, jwtVerify, authenticateToken };