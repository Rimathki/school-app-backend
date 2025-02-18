import expressAsyncHandler from 'express-async-handler'
import { ApiError, handleError } from '../utils/customError.js';
import { LESSON_ATTRIBUTES, QUIZ_ATTRIBUTES } from '../utils/params.js';
import { formatQuery } from '../utils/format.js';
import paginate from '../utils/pagination.js';
import { INCLUDES } from '../utils/params.js';
import {
    Lesson,
    Topic,
    User,
    Quiz,
    StudentQuizzes
} from '../models/index.js'

export const getLessons = expressAsyncHandler(async (req, res) => {
    try {
        const select = req.query.select;
        const sort = req.query.sort;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        let attributes = undefined;
        let order = undefined;
        if (select) {
            attributes = select.split(" ");
        } else {
            attributes = LESSON_ATTRIBUTES;
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

        const pagination = await paginate(Lesson, page, limit, query);

        const lessons = await Lesson.findAll({
            order,
            where: query,
            attributes,
            offset: pagination.start - 1,
            limit,
            include: [
                INCLUDES.creator,
                INCLUDES.topics,
                INCLUDES.teachers,
            ],
        });
    
        res.json({
            success: true,
            lessons,
            pagination,
        });
    } catch (error) {
        console.error(error);
    
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching lessons",
            error: error.message,
        });
    }  
});

export const getLesson = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const lesson = await Lesson.findByPk(id, {
            include: [
                INCLUDES.creator,
                INCLUDES.topics,
            ],
        });

        if (!lesson) {
            throw ApiError.notFound("Lesson not found.");
        }

        res.status(200).json({
            success: true,
            lesson,
        });
    } catch (error) {
        handleError(error, res);
    }
});

export const createLesson = expressAsyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body;

        const newLesson = Lesson.build({
            title: title,
            description: description,
            created_by: req.userId,
            created_at: new Date(),
        });

        await newLesson.save();

        const lesson = await Lesson.findByPk(newLesson.id, {
            include: [
                INCLUDES.creator
            ]
        })

        res.status(200).json({
            success: true,
            lesson,
            message: 'Successfully created lesson',
        });
    } catch (error) {
        handleError(error, res);
    }
});

export const updateLesson = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        const lesson = await Lesson.findByPk(id);

        if (!lesson) {
            throw ApiError.notFound("Lesson not found.");
        }

        lesson.title = title || lesson.title;
        lesson.description = description || lesson.description;

        await lesson.save();

        res.status(200).json({
            success: true,
            lesson,
        });
    } catch (error) {
        handleError(error, res);
    }
});

export const deleteLesson = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const lesson = await Lesson.findByPk(id);

        if (!lesson) {
            throw ApiError.notFound("Lesson not found.");
        }

        await lesson.destroy();

        res.status(200).json({
            success: true,
            message: "Lesson successfully deleted.",
        });
    } catch (error) {
        handleError(error, res);
    }
});

export const getTopics = expressAsyncHandler(async (req, res) => {
    try {
        const { lessonId } = req.params;
        if (!lessonId) {
            throw ApiError.badRequest("Lesson ID is required.");
        }

        const topics = await Topic.findAll({
            where: { lesson_id: lessonId },
        });

        res.status(200).json({
            success: true,
            topics,
        });
    } catch (error) {
        console.log(error)
        handleError(error, res);
    }
});

export const getAllTopics = expressAsyncHandler(async (req, res) => {
    try {
        const topics = await Topic.findAll({
            include: INCLUDES.lesson,
        });

        res.status(200).json({
            success: true,
            topics,
        });
    } catch (error) {
        console.error("Error fetching topics:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching topics",
            error: error.message,
        });
    }
});

export const getTopic = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const topic = await Topic.findByPk(id);

        if (!topic) {
            throw ApiError.notFound("Topic not found.");
        }

        res.status(200).json({
            success: true,
            topic,
        });
    } catch (error) {
        handleError(error, res);
    }
});

export const createTopic = expressAsyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body;
        const { lessonId } = req.params
        const lesson = await Lesson.findByPk(lessonId);

        if (!lesson) {
            throw ApiError.badRequest("Lesson not found.");
        }

        const topic = await Topic.create({
            title,
            description,
            lesson_id: lessonId,
        });

        res.status(200).json({
            success: true,
            topic,
        });
    } catch (error) {
        handleError(error, res);
    }
});

export const updateTopic = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        console.log(req.params, req.body)
        const topic = await Topic.findByPk(id);

        if (!topic) {
            throw ApiError.notFound("Topic not found.");
        }

        topic.title = title || topic.title;
        topic.description = description || topic.description;

        await topic.save();

        res.status(200).json({
            success: true,
            topic,
        });
    } catch (error) {
        handleError(error, res);
    }
});

export const deleteTopic = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const topic = await Topic.findByPk(id);

        if (!topic) {
            throw ApiError.notFound("Topic not found.");
        }

        await topic.destroy();

        res.status(200).json({
            success: true,
            message: "Topic successfully deleted.",
        });
    } catch (error) {
        handleError(error, res);
    }
});

export const getLessonTeachers = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const lesson = await Lesson.findByPk(lessonId, {
            include: [
                INCLUDES.teachers
            ],
        });

        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        return res.status(200).json({ teachers: lesson.teachers });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to fetch teachers", error: error.message });
    }
};

export const addTeacherToLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { userId } = req.body;

        const lesson = await Lesson.findByPk(lessonId);
        const user = await User.findByPk(userId);

        if (!lesson || !user) {
            return res.status(404).json({ message: "Lesson or User not found" });
        }

        await lesson.addTeacher(user);

        return res.status(200).json({ message: "Teacher added to lesson successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to add teacher", error: error.message });
    }
};

export const removeTeacherFromLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { userId } = req.body;

        const lesson = await Lesson.findByPk(lessonId);
        const user = await User.findByPk(userId);

        if (!lesson || !user) {
            return res.status(404).json({ message: "Lesson or User not found" });
        }

        await lesson.removeTeacher(user);

        return res.status(200).json({ message: "Teacher removed from lesson successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to remove teacher", error: error.message });
    }
};

export const getQuizzes = expressAsyncHandler(async (req, res) => {
    try {
        const { topicId } = req.params;

        const topic = await Topic.findByPk(topicId, {
            include: [INCLUDES.quizzes],
        });
        console.log(topic)
        if (!topic) {
            throw ApiError.notFound("Topic not found.");
        }

        res.status(200).json({
            success: true,
            quizzes: topic.quizzes,
        });
    } catch (error) {
        handleError(error, res);
    }
});

export const saveQuiz = expressAsyncHandler(async (req, res) => {
    try {
        const { topicId } = req.params;
        const { duration, level, content } = req.body;
        const userId = req.userId;

        const topic = await Topic.findByPk(topicId, {
            include: {
                association: "lesson",
                include: {
                    association: "teachers",
                    include: {
                        association: "students",
                        attributes: ["id"],
                    },
                },
            },
        });

        if (!topic) {
            throw ApiError.notFound("Topic not found.");
        }

        // Create the quiz
        const quiz = await Quiz.create({
            topic_id: topicId,
            duration,
            level,
            content,
            created_by: userId,
        });

        const students = topic.lesson.teachers.flatMap((teacher) => teacher.students.map((student) => student.id));

        const studentQuizEntries = students.map((studentId) => ({
            student_id: studentId,
            quiz_id: quiz.id,
        }));

        console.log("Student quizzes:", studentQuizEntries, students);

        try {
            await StudentQuizzes.bulkCreate(studentQuizEntries);
        } catch (error) {
            console.log("Error saving student quizzes:", error);
        }        
        
        res.status(200).json({
            success: true,
            quiz,
            message: 'Quiz successfully created and assigned to students.',
        });
    } catch (error) {
        handleError(error, res);
    }
});

export const getAllQuizzes = expressAsyncHandler(async (req, res) => {
    try {
        const select = req.query.select;
        const sort = req.query.sort;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        let attributes = undefined;
        let order = undefined;

        if (select) {
            attributes = select.split(" ");
        } else {
            attributes = QUIZ_ATTRIBUTES;
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

        const pagination = await paginate(Quiz, page, limit, query);

        const quizzes = await Quiz.findAll({
            order,
            where: query,
            attributes,
            offset: pagination.start - 1,
            limit,
            include: INCLUDES.topics
        });

        res.json({
            success: true,
            quizzes,
            pagination,
        });
    } catch (error) {
        console.error(error);
    
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching quizzes",
            error: error.message,
        });
    }
});

export const updateQuiz = expressAsyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { duration, level, content } = req.body;

        const quiz = await Quiz.findByPk(id);

        if (!quiz) {
            throw ApiError.notFound("Quiz not found.");
        }

        if (duration !== undefined) quiz.duration = duration;
        if (level !== undefined) quiz.level = level;
        if (content !== undefined) {
            if (!Array.isArray(content)) {
                throw ApiError.badRequest("Content must be an array of questions");
            }

            content.forEach((item, index) => {
                if (!item.question || !item.options || !item.correct_answer) {
                    throw ApiError.badRequest(`Invalid question format at index ${index}`);
                }
                if (!Array.isArray(item.options)) {
                    throw ApiError.badRequest(`Options must be an array at question ${index}`);
                }
            });

            quiz.content = content;
        }

        quiz.updated_at = new Date();

        await quiz.save();

        res.status(200).json({
            success: true,
            quiz,
            message: 'Quiz successfully updated.',
        });
    } catch (error) {
        handleError(error, res);
    }
});


