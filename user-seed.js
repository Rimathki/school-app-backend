import { User, Role } from "./models/index.js";
import bcrypt from 'bcrypt';

export async function seedUser() {
    try {
        const [adminRole] = await Role.findOrCreate({
            where: { name: 'Admin' },
            defaults: {
                description: 'Full access to all resources',
                is_active: true,
            },
        });

        const password = "admin123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const [adminUser, created] = await User.findOrCreate({
            where: { email: 'admin@gmail.com' },
            defaults: {
                username: 'admin',
                firstname: 'System',
                lastname: 'Admin',
                phone: '1234567890',
                email: 'admin@gmail.com',
                password: hashedPassword,
                role_id: adminRole.id,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        if (!created) {
            adminUser.role_id = adminRole.id;
            adminUser.password = hashedPassword;
            await adminUser.save();
        }

        console.log('Default admin user created:', adminUser.username);
    } catch (error) {
        console.error('Error creating default admin user:', error);
    }
}