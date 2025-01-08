import express from "express";
import cors from 'cors';
import corsOptions from "../utils/cors.js";
import { 
    protect,
    authorize
} from '../middleware/protect.js';
import {
    getLessons,
    getLesson,
    createLesson,
    updateLesson,
    deleteLesson,
    getTopics,
    getTopic,
    createTopic,
    updateTopic,
    deleteTopic,
    getLessonTeachers,
    addTeacherToLesson,
    removeTeacherFromLesson,
    getQuizzes,
    saveQuiz,
    updateQuiz,
    getAllQuizzes
} from "../controller/lesson.js";
import { ROLE } from '../utils/params.js';

const notStudent = [ROLE.admin, ROLE.teacher];
const allRoles = [ROLE.admin, ROLE.teacher, ROLE.student];
const router = express.Router();

router.use(cors(corsOptions));

router.use(protect);
router.route("/lessons")
    .get(authorize(notStudent), getLessons)
    .post(authorize([ROLE.admin]), createLesson);

router.route("/lesson/:id")
    .get(authorize(notStudent), getLesson)
    .put(authorize([ROLE.admin]), updateLesson)
    .delete(authorize([ROLE.admin]), deleteLesson);

router.route("/lesson/:lessonId/topics")
    .get(authorize(notStudent), getTopics)
    .post(authorize([ROLE.admin]), createTopic);

router.route("/topic/:id")
    .get(getTopic)
    .put(authorize([ROLE.admin]), updateTopic)
    .delete(authorize([ROLE.admin]), deleteTopic);

router.route("/lesson/:lessonId/teachers")
    .get(authorize([ROLE.admin, ROLE.teacher]), getLessonTeachers)
    .post(authorize([ROLE.admin]), addTeacherToLesson)
    .delete(authorize([ROLE.admin]), removeTeacherFromLesson);

router
    .route("/topic/:topicId/quiz")
    .get(authorize(allRoles), getQuizzes)
    .post(authorize(notStudent), saveQuiz);

router
    .route('/quizzes')
    .get(authorize(notStudent), getAllQuizzes);

router
    .route("/quiz/:id")
    .put(authorize(notStudent), updateQuiz);

export default router;
