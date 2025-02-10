import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiError, handleError } from '../utils/customError.js';
import { 
    USER_ATTRIBUTES,
    INCLUDES,
    STATUS,
    ROLE,
    QUIZ_ATTRIBUTES
} from '../utils/params.js';
import {
    formatQuery
} from '../utils/format.js'
import { Op } from 'sequelize';
import paginate from '../utils/pagination.js';
import { User, Role, Permission, TeacherStudents } from '../models/index.js';

export const createJsonWebToken = (user) => {
    try {
        const expires = process.env.JWT_EXPIRESIN * 1000;

        const roleName = user.role.name;

        const token = jwt.sign(
            {
                id: user.id,
                role: roleName,
            },
            process.env.JWT_SECRET,
            { expiresIn: expires }
        );

        const refreshToken = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: expires }
        );

        return [token, refreshToken, expires];
    } catch (error) {
        console.error("Error creating JSON Web Token:", error);
        throw new Error("Could not generate token.");
    }
};

export const login = asyncHandler(async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const includes = [INCLUDES.role];
        
        const user = await User.findOne({
            where: { username },
            include: includes,
        });

        if (!user) {
            throw ApiError.badRequest("You are an unregistered user or the username is incorrect.");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw ApiError.badRequest("The password is incorrect.");
        }

        if (user.is_active === 0) {
            throw ApiError.internalError("The user status is inactive, please contact the administrator.");
        }

        if (user.role.name === ROLE.teacher) {
            includes.push( {
                association: 'lessons',
                include: [
                    {
                        association: 'topic',
                        attributes: ['id', 'title', 'description'],
                    },
                    {
                        association: 'creator',
                        attributes: ['id', 'lastname', 'firstname', 'email'],
                    },
                ],
            },);
        } else if (user.role.name === ROLE.student) {
            includes.push({
                ...INCLUDES.teachers,
                include:  {
                    association: 'lessons',
                    include: [
                        {
                            association: 'topic',
                            attributes: ['id', 'title', 'description'],
                        },
                        {
                            association: 'creator',
                            attributes: ['id', 'lastname', 'firstname', 'email'],
                        },
                    ],
                },
            });
            includes.push(INCLUDES.quizzes); 
        }

        console.log(includes)

        const userWithDetails = await User.findOne({
            where: { id: user.id },
            include: includes,
        });

        userWithDetails.last_login = new Date();
        userWithDetails.login_ip = req.socket.remoteAddress;
        await userWithDetails.save();

        const [token, refreshToken, expires] = createJsonWebToken(userWithDetails);

        const cookieOptions = {
            expires: new Date(Date.now() + expires),
            httpOnly: true,
        };

        res.cookie("token", token, cookieOptions).json({
            success: true,
            user: userWithDetails,
            expiresIn: expires,
            refreshToken,
        });
    } catch (error) {
        console.error(error);
        handleError(error, res);
    }
});

export const logout = asyncHandler(async (req, res, next) => {
    const cookieOptions = {
        expires: new Date(Date.now() - 60 * 60 * 1000),
        httpOnly: true,
    };
  
    res.cookie("token", null, cookieOptions).json({
        success: true,
    });
});

export const refresh = asyncHandler(async (req, res, next) => {
    const tokenObj = jwt.verify(req.body.refreshToken, process.env.JWT_SECRET);
  
    console.log(tokenObj);
  
    const expire_date = new Date(tokenObj.exp * 1000);
  
    if (expire_date > Date.now()) {
        const user = await User.findOne({
            attributes: USER_ATTRIBUTES,
            include: [INCLUDES.role],
            where: { username: tokenObj.username },
        });
        if (user) {
            const [token, refreshToken, expires] = createJsonWebToken(user);
            const cookieOptions = {
                expires: new Date(Date.now() + expires),
                httpOnly: true,
            };
            res.cookie("token", token, cookieOptions).json({
                success: true,
                user: user,
                expiresIn: expires,
                refreshToken,
            });
        } else {
            res.status(STATUS.notFound).json({ success: false });
        }
    } else
        res.status(STATUS.sessionExpired).json({
            success: false,
        });
});

export const checkRoleAndPermission = async (userId, requiredRole = null, requiredPermission = null) => {
    try {
        const user = await User.findByPk(userId, {
            include: [
                {
                    model: Role,
                    as: 'role',
                    include: [
                        {
                            model: Permission,
                            as: 'permissions',
                        },
                    ],
                },
            ],
        });

        if (!user) {
            throw new Error("User not found.");
        }

        const roleName = user.role.name;
        const permissions = user.role.permissions.map((perm) => perm.code);

        if (requiredRole && roleName !== requiredRole) {
            return false;
        }

        if (requiredPermission && !permissions.includes(requiredPermission)) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking role and permission:', error);
        throw new Error('Failed to check user role and permissions');
    }
};

export const getUsers = asyncHandler(async(req, res) => {
    try {
        console.log(req.query);
        const select = req.query.select;
        const sort = req.query.sort;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        let attributes = undefined;
        let order = undefined;
    
    
        if (select) {
            attributes = select.split(" ");
        } else {
            attributes = USER_ATTRIBUTES;
        }
    
        if (sort) {
            order = sort
                .split(" ")
                .map((el) => [
                    el.charAt(0) === "-" ? el.substring(1) : el,
                    el.charAt(0) === "-" ? "DESC" : "ASC",
                ]);
        } else {
            order = [["created_at", "DESC"]];
        }
    
        ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);
    
        const query = formatQuery(req.query);

        const pagination = await paginate(User, page, limit, query);

        const users = await User.findAll({
            order,
            where: query,
            attributes,
            offset: pagination.start - 1,
            limit,
            include: [INCLUDES.role]
        });
    
        res.json({
            success: true,
            users,
            pagination,
        });
    } catch (error) {
        console.error(error);
    
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching users",
            error: error.message,
        });
    }    
})


export const createUser = asyncHandler(async (req, res) => {
    try {
        const { username, firstname, lastname, email, phone, password, role_id } = req.body;

        const existingUser = await User.findOne({
            where: { [Op.or]: [{ email }, { username }] },
        });
    
        if (existingUser) {
            throw ApiError.badRequest("Email or username is already registered");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = User.build({
            username: username,
            firstname: firstname,
            lastname: lastname,
            email: email,
            phone: phone,
            created_at: new Date(),
            password: hashedPassword,
            role_id: role_id,
            is_active: 1,
        });

        await user.save();

        const newUser = await User.findByPk(user.id)

        res.status(200).json({
            user: newUser,
            success: true,
            message: 'User successfully registered.',
        });

    } catch (error) {
        console.log(error);
        handleError(error, res);
    }
});

export const updateUser = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { username, firstname, lastname, email, phone, is_active } = req.body;
        console.log('req param is:',req.params, 'req body is:',req.body)
        const user = await User.findByPk(id);

        if (!user) {
            throw ApiError.notFound("User not found");
        }

        if (username || email) {
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [{ username }, { email }],
                    id: { [Op.ne]: id },
                },
            });

            if (existingUser) {
                throw ApiError.badRequest("Email or username is already registered by another user");
            }
        }

        user.username = username || user.username;
        user.firstname = firstname || user.firstname;
        user.lastname = lastname || user.lastname;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.is_active = is_active !== undefined ? is_active : user.is_active;

        await user.save();

        res.status(200).json({
            success: true,
            user,
            message: "User updated successfully",
        });
    } catch (error) {
        console.error(error);
        handleError(error, res);
    }
});

export const deleteUser = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);

        if (!user) {
            throw ApiError.notFound("User not found");
        }

        await user.destroy();

        res.status(200).json({
            success: true,
            message: "User successfully deleted",
        });
    } catch (error) {
        console.log(error);
        handleError(error, res);
    }
});

export const changePassword = asyncHandler(async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            throw ApiError.badRequest("User ID and new password are required.");
        }

        const user = await User.findByPk(userId);

        if (!user) {
            throw ApiError.notFound("User not found.");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully.",
        });
    } catch (error) {
        console.error("Error updating password:", error);
        handleError(error, res);
    }
});


export const getRoles = asyncHandler(async (req, res) => {
    try {
        const roles = await Role.findAll({
            attributes: ["id", "name"],
            where: { is_active: true },
        });

        res.json({
            success: true,
            roles,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching roles",
            error: error.message,
        });
    }
});

export const saveUserRole = asyncHandler(async (req, res) => {
    try {
        const { userId, roleId } = req.body;

        if (!userId || !roleId) {
            throw ApiError.badRequest("User ID and Role ID are required.");
        }

        const user = await User.findByPk(userId);
        if (!user) {
            throw ApiError.badRequest("User not found.");
        }

        const role = await Role.findByPk(roleId);
        if (!role) {
            throw ApiError.badRequest("Role not found.");
        }

        user.role_id = roleId;
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: "Role assigned to user successfully.", 
            user 
        });
    } catch (error) {
        console.error("Error assigning role:", error);
        res.status(500).json({
            success: false,
            message: "Failed to assign role.",
            error: error.message,
        });
    }
});

export const getAllTeachers = asyncHandler(async (req, res) => {
    try {
        const roleName = "Teacher";
        const select = req.query.select;
        const sort = req.query.sort;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        let attributes = undefined;
        let order = undefined;

        if (select) {
            attributes = select.split(" ");
        } else {
            attributes = USER_ATTRIBUTES;
        }

        if (sort) {
            order = sort
                .split(" ")
                .map((el) => [
                    el.charAt(0) === "-" ? el.substring(1) : el,
                    el.charAt(0) === "-" ? "DESC" : "ASC",
                ]);
        } else {
            order = [["created_at", "DESC"]];
        }

        ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

        const query = formatQuery(req.query);

        const roleInclude = {
            ...INCLUDES.role,
            where: { name: roleName },
        };

        const pagination = await paginate(User, page, limit, query);

        const teachers = await User.findAll({
            where: query,
            order,
            attributes,
            offset: pagination.start - 1,
            limit,
            include: [
                roleInclude,
                INCLUDES.students,
                INCLUDES.teachers,
                {
                    association: 'lessons',
                    include: [
                        {
                            association: 'topic',
                            attributes: ['id', 'title', 'description'],
                        },
                        {
                            association: 'creator',
                            attributes: ['id', 'lastname', 'firstname', 'email'],
                        },
                    ],
                },
            ],
        });

        res.status(200).json({
            success: true,
            teachers,
            pagination,
        });
    } catch (error) {
        console.error("Error fetching teachers:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching teachers",
            error: error.message,
        });
    }
});

export const getTeachers = asyncHandler(async (req, res) => {
    try {
        const roleName = "Teacher";

        const roleInclude = {
            ...INCLUDES.role,
            where: { name: roleName },
        };

        const teachers = await User.findAll({
            include: [roleInclude],
            attributes: USER_ATTRIBUTES,
        });

        res.status(200).json({ success: true, teachers });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching teachers",
            error: error.message,
        });
    }
});

export const getStudentsByTeacher = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        console.log('teacher id is:', id)
        const teacher = await User.findByPk(id, {
            attributes: ["id", "firstname", "lastname", "email"],
            include: [INCLUDES.students],
        });

        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        res.status(200).json({ success: true, teacher, students: teacher.students });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching students",
            error: error.message,
        });
    }
});

export const getAllStudents = asyncHandler(async (req, res) => {
    try {
        const roleName = "Teacher";
        const select = req.query.select;
        const sort = req.query.sort;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        let attributes = undefined;
        let order = undefined;

        if (select) {
            attributes = select.split(" ");
        } else {
            attributes = USER_ATTRIBUTES;
        }

        if (sort) {
            order = sort
                .split(" ")
                .map((el) => [
                    el.charAt(0) === "-" ? el.substring(1) : el,
                    el.charAt(0) === "-" ? "DESC" : "ASC",
                ]);
        } else {
            order = [["created_at", "DESC"]];
        }

        ["select", "sort", "page", "limit"].forEach((el) => delete req.query[el]);

        const query = formatQuery(req.query);

        const roleInclude = {
            ...INCLUDES.role,
            where: { name: roleName },
        };

        const pagination = await paginate(User, page, limit, query);

        const teachers = await User.findAll({
            where: query,
            order,
            attributes,
            offset: pagination.start - 1,
            limit,
            include: [
                roleInclude,
                INCLUDES.students,
                INCLUDES.teachers,
                {
                    association: 'lessons',
                    include: [
                        {
                            association: 'topic',
                            attributes: ['id', 'title', 'description'],
                        },
                        {
                            association: 'creator',
                            attributes: ['id', 'lastname', 'firstname', 'email'],
                        },
                    ],
                },
            ],
        });

        res.status(200).json({
            success: true,
            teachers,
            pagination,
        });
    } catch (error) {
        console.error("Error fetching teachers:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching teachers",
            error: error.message,
        });
    }
});

export const getStudents = asyncHandler(async (req, res) => {
    try {
        const roleName = "Student";

        const roleInclude = {
            ...INCLUDES.role,
            where: { name: roleName },
        };

        const students = await User.findAll({
            include: [roleInclude],
            attributes: USER_ATTRIBUTES,
        });

        res.status(200).json({ success: true, students });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching students",
            error: error.message,
        });
    }
});

export const addStudentToTeacher = asyncHandler(async (req, res) => {
    const { teacherId, studentId } = req.body;

    if (!teacherId || !studentId) {
        throw ApiError.badRequest('Teacher ID and Student ID are required.');
    }

    const teacher = await User.findByPk(teacherId, {
        where: { role_id: 2 },
    });
    const student = await User.findByPk(studentId, {
        where: { role_id: 3 },
    });

    if (!teacher) throw ApiError.notFound('Teacher not found.');
    if (!student) throw ApiError.notFound('Student not found.');

    const existingAssignment = await TeacherStudents.findOne({
        where: { teacher_id: teacherId, student_id: studentId },
    });

    if (existingAssignment) {
        return res.status(200).json({
            success: true,
            message: 'Student is already assigned to this teacher.',
        });
    }

    await TeacherStudents.create({ teacher_id: teacherId, student_id: studentId });

    res.status(200).json({
        success: true,
        message: 'Student successfully assigned to teacher.',
    });
});

export const removeStudentFromTeacher = asyncHandler(async (req, res) => {
    const { teacherId, studentId } = req.body;

    try {
        const teacher = await User.findByPk(teacherId, {
            include: { association: "students" },
        });

        if (!teacher) {
            throw ApiError.notFound("Teacher not found");
        }

        const student = teacher.students.find((s) => s.id === studentId);

        if (!student) {
            throw ApiError.notFound("Student not assigned to this teacher");
        }

        await teacher.removeStudent(student);

        res.status(200).json({
            success: true,
            message: "Student successfully removed from the teacher.",
        });
    } catch (error) {
        console.error("Error removing student:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove student from teacher.",
            error: error.message,
        });
    }
});