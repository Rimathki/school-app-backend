import { 
    User, 
    Role, 
    Permission,
    RolePermission,
} from './core.js';
import {
    Lesson,
    Topic,
    UserLesson,
    TeacherStudents,
    Quiz,
    StudentQuizzes
} from './lesson.js'

User.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role',
});

Role.hasMany(User, {
    foreignKey: 'role_id',
    as: 'users',
});

User.belongsToMany(Lesson, {
    through: UserLesson,
    foreignKey: "user_id",
    as: "lessons",
});

User.belongsToMany(User, {
    through: TeacherStudents,
    as: "students",
    foreignKey: "teacher_id",
    onDelete: "CASCADE"
});
  
User.belongsToMany(User, {
    through: TeacherStudents,
    as: "teachers",
    foreignKey: "student_id",
    onDelete: "CASCADE"
});

Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'role_id',
    as: 'permissions',
});
Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permission_id',
    as: 'roles',
});

Lesson.hasMany(Topic, {
    foreignKey: "lesson_id",
    as: "topic",
});

Lesson.belongsToMany(User, {
    through: UserLesson,
    foreignKey: "lesson_id",
    as: "users",
});

Lesson.belongsToMany(User, {
    through: UserLesson,
    foreignKey: "lesson_id",
    as: "teachers",
});

Lesson.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator',
});

Topic.belongsTo(Lesson, {
    foreignKey: "lesson_id",
    as: "lesson",
});

Quiz.belongsTo(Topic, {
    foreignKey: "topic_id",
    as: "topic",
});

Topic.hasMany(Quiz, {
    foreignKey: "topic_id",
    as: "quizzes",
});

User.belongsToMany(Quiz, {
    through: StudentQuizzes,
    foreignKey: "student_id",
    as: "quizzes",
});

Quiz.belongsToMany(User, {
    through: StudentQuizzes,
    foreignKey: "quiz_id",
    as: "students",
});

export {
    User,
    Role,
    Permission,
    RolePermission,
    Lesson,
    Topic,
    UserLesson,
    TeacherStudents,
    Quiz,
    StudentQuizzes
};
