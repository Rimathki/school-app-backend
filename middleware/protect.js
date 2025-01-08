import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { checkRoleAndPermission } from "../controller/core.js";
import { ApiError } from "../utils/customError.js";

export const protect = asyncHandler(async (req, res, next) => {
    let token = null;

    if (req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies) {
        token = req.cookies["token"];
    }

    if (!token) {
        throw ApiError.unauthorized("Authentication token is missing!");
    }

    try {
        const tokenObj = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = tokenObj.id;
        req.userRole = tokenObj.role;

        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        throw ApiError.unauthorized("Invalid or expired token!");
    }
});

export const authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            throw ApiError.forbidden(
                "You do not have the required role to perform this action.",
            );
        }
        next();
    };
};

export const checkPermission = (permissionCode) => {
    return asyncHandler(async (req, res, next) => {
        const hasPermission = await checkRoleAndPermission(req.userId, null, permissionCode);

        if (!hasPermission) {
            throw ApiError.forbidden(
                `You do not have the required permission (${permissionCode}) to perform this action.`,
            );
        }

        next();
    });
};
