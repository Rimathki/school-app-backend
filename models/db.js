import { Sequelize } from "sequelize";
import { env } from "node:process";
import dotenv from "dotenv";

dotenv.config({ path: "./config/config.env" });

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: env.DB_DIALECT,
    define: {
        freezeTableName: true,
    },
    pool: {
        max: 25,
        min: 0,
        acquire: 60000,
        idle: 10000,
    },
    operatorAlieses: false,
});

export default sequelize;