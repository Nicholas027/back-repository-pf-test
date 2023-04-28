const allowedOrigins = require('./allowedOrigins')

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error(origin + ' Not allowed by CORS'))
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    secure: true
}

module.exports = corsOptions 
