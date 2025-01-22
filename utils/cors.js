let whitelist;

whitelist = ["http://localhost:3000"]
// whitelist = 'http://188.166.217.10:3000'

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    allowedHeaders: "Authorization, Content-Type, X-Requested-With, Accept, Origin",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
};

export default corsOptions;
