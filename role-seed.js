import { Role, Permission, RolePermission } from './models/index.js';

export async function seedRolesAndPermissions() {
    try {
        const roles = [
            { name: 'Admin', description: 'Full access to all resources' },
            { name: 'Teacher', description: 'Can manage students, lessons, and topics' },
            { name: 'Student', description: 'Can view lessons and topics' },
        ];

        for (const role of roles) {
        await Role.findOrCreate({
            where: { name: role.name },
            defaults: {
            description: role.description,
            is_active: true,
            },
        });
        }

        const permissions = [
            { code: 'full_system', description: 'Full user management' },
            { code: 'add_students', description: 'Can add students' },
            { code: 'generate_quiz', description: 'Can generate quizzes' },
            { code: 'allocate_quiz', description: 'Can allocate quizzes' },
            { code: 'view_lessons', description: 'Can view lessons' },
        ];

        for (const permission of permissions) {
        await Permission.findOrCreate({
            where: { code: permission.code },
            defaults: {
            description: permission.description,
            is_active: true,
            },
        });
        }

        const adminRole = await Role.findOne({ where: { name: 'Admin' } });
        const teacherRole = await Role.findOne({ where: { name: 'Teacher' } });
        const studentRole = await Role.findOne({ where: { name: 'Student' } });
        const allPermissions = await Permission.findAll();

        const adminPermissions = allPermissions.map((p) => ({
            role_id: adminRole.id,
            permission_id: p.id,
            is_allowed: true,
        }));

        const teacherPermissions = allPermissions
        .filter((p) =>
            ['add_students', 'generate_quiz', 'allocate_quiz', 'view_lessons'].includes(p.code)
        )
        .map((p) => ({
            role_id: teacherRole.id,
            permission_id: p.id,
            is_allowed: true,
        }));

        const studentPermissions = allPermissions
        .filter((p) => ['view_lessons'].includes(p.code))
        .map((p) => ({
            role_id: studentRole.id,
            permission_id: p.id,
            is_allowed: true,
        }));

        await RolePermission.bulkCreate([...adminPermissions, ...teacherPermissions, ...studentPermissions], {
        ignoreDuplicates: true,
        });

        console.log('Roles, Permissions, and RolePermissions seeded successfully!');
    } catch (error) {
        console.error('Error seeding roles and permissions:', error);
    }
}
