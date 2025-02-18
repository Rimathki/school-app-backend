const USER_ATTRIBUTES = [
    "id",
    "username",
    "lastname",
    "firstname",
    "email",
    "role_id",
    "phone",
    "last_login",
    "login_ip",
    "created_at",
    "updated_at",
    "password"
];

const LESSON_ATTRIBUTES = [
    "id",
    "title",
    "description",
    "created_at",
    "created_by",
];

const TOPIC_ATTRIBUTES = [
    "id", 
    "title", 
    "description", 
    "lesson_id"
];

const QUIZ_ATTRIBUTES = [
    "id",
    "topic_id",
    "duration",
    "level",
    "content",
    "created_at",
    "updated_at",
    "created_by"
];
  
const INCLUDES = {
    user: {
        association: "user",
        attributes: USER_ATTRIBUTES,
    },
    role: {
        association: "role",
        attributes: ["id", "name", "description"],
        include: [
            {
                association: "permissions",
                attributes: ["id", "code", "description"],
            },
        ],
    },
    lesson: {
        association: "lesson",
        attributes: LESSON_ATTRIBUTES,
        include: [
            {
                association: "topic",
                attributes: TOPIC_ATTRIBUTES,
            },
        ],
    },
    students: {
        association: "students",
        attributes: USER_ATTRIBUTES,
        through: { attributes: [] },
    },
    teachers: {
        association: "teachers",
        attributes: USER_ATTRIBUTES,
        through: { attributes: [] },
        include: [
            {
                association: "lessons",
                attributes: LESSON_ATTRIBUTES,
                include: [
                    {
                        association: "topic",
                        attributes: TOPIC_ATTRIBUTES,
                    },
                ],
            },
        ],
    },
    topics: {
        association: "topic",
        attributes: ["id", "title"],
    },
    creator: {
        association: "creator",
        attributes: ["id", "lastname", "firstname", "email"],
    },
    quizzes: {
        association: "quizzes",
        attributes: ["id", "topic_id", "duration", "level", "content"],
        include: [
            {
                association: "topic",
                attributes: ["id", "title", "description"],
                include: [
                    {
                        association: "lesson",
                        attributes: ["id", "title", "description"],
                    },
                ],
            },
        ],
    },
    studentQuizzes: {
        association: "quizzes",
        attributes: QUIZ_ATTRIBUTES,
    },
};

const ROLE = {
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student'
}

const STATUS = {
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409,
    tooManyRequest: 429,
    sessionExpired: 440,
    serverError: 500,
};

export {
    INCLUDES,
    USER_ATTRIBUTES,
    ROLE,
    STATUS,
    LESSON_ATTRIBUTES,
    TOPIC_ATTRIBUTES,
    QUIZ_ATTRIBUTES
}