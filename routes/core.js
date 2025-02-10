import express from 'express';
import cors from 'cors';
import corsOptions from '../utils/cors.js';
import { 
    login,
    logout,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getRoles,
    refresh,
    getTeachers,
    saveUserRole,
    changePassword,
    getAllTeachers,
    getStudents,
    addStudentToTeacher,
    removeStudentFromTeacher,
    getStudentsByTeacher,
    getAllStudents
} from '../controller/core.js';
import { protect, authorize } from '../middleware/protect.js';
import { ROLE } from '../utils/params.js'

const notStudent = [ROLE.admin, ROLE.teacher];

const router = express.Router();
router.use(cors(corsOptions));
router
    .route('/login')
    .post(login);
router
    .route("/logout")
    .get(logout);

router.use(protect);
router.route("/refresh").post(refresh);
router
    .route("/user")
    .get(getUsers)
    .post(authorize(notStudent), createUser);
router
    .route("/user/:id")
    .delete(deleteUser)
    .put(authorize(notStudent), updateUser);
router
    .route("/roles")
    .get(getRoles)
router.post("/user-role", authorize(notStudent), saveUserRole);
router.route('/teachers').get(authorize(ROLE.admin), getTeachers);
router.route('/all-teachers').get(authorize(ROLE.admin), getAllTeachers);
router.post('/user/change-password', changePassword);
router.route('/all-students').get(authorize(ROLE.admin), getAllStudents);
router.route("/students").get(authorize(notStudent), getStudents);
router.route("/teachers/:id/students").get(authorize(notStudent), getStudentsByTeacher);
router.route("/add-student-to-teacher").post(authorize(notStudent), addStudentToTeacher);
router.route("/remove-student").post(authorize(notStudent), removeStudentFromTeacher);

export default router;