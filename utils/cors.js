let whitelist;

whitelist =
    process.env.NODE_ENV !== "production"
        ? ["http://localhost:3000"]
        : ["https://school-app.com"];

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
