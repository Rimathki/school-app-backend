import { DataTypes, Op } from "sequelize";
import sequelize from "./db.js";
import argon2 from 'argon2';
import { TeacherStudents } from './index.js'

const User = sequelize.define(
    "users",
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        lastname: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        firstname: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: "email",
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        is_active: {
            type: DataTypes.TINYINT,
            allowNull: false,
        },
        role_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        login_ip: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
        },
        updated_at: {
            type: DataTypes.DATE,
        },
    },
    {
        sequelize,
        tableName: "users",
        hasTrigger: true,
        timestamps: false,
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [{ name: "id" }],
            },
            {
                name: "email",
                unique: true,
                using: "BTREE",
                fields: [{ name: "email" }],
            },
            {
                name: "username",
                unique: true,
                using: "BTREE",
                fields: [{ name: "username" }],
            },
        ],
    }
);

const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'roles',
    timestamps: false,
});

const Permission = sequelize.define('Permission', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'permissions',
    timestamps: false,
});

const RolePermission = sequelize.define('RolePermission', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
}, {
    tableName: 'role_permissions',
    timestamps: false,
});

User.beforeCreate(async (user, options) => {
    if (user?.password) {
        console.log('Hashing password for user:', user.password);
        try {
            const hashedPassword = await argon2.hash(user.password, {
                type: argon2.argon2id,
                memoryCost: 65536,
                timeCost: 3,
                parallelism: 4,
            });
            user.password = hashedPassword;
        } catch (error) {
            console.error('Error hashing password with argon2:', error);
            throw new Error('Password hashing failed');
        }
    }
});

User.beforeDestroy(async (user, options) => {
    await TeacherStudents.destroy({
        where: {
            [Op.or]: [
                { teacher_id: user.id },
                { student_id: user.id },
            ],
        },
    });
});

export { 
    User,  
    Role, 
    Permission,
    RolePermission,
};
