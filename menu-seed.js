import { Menu, MenuPermission } from './models/core.js';

const navMain = [
    {
        title: "User list",
        url: "/system/user",
        icon: "User",
        isActive: true,
        type: 'core',
        items: [],
    },
    {
        title: "Lessons",
        url: "/system/lessons",
        icon: "NotebookText",
        isActive: true,
        type: 'core',
        items: [],
    },
    {
        title: "Generator",
        url: "#",
        icon: "SquareTerminal",
        isActive: true,
        type: 'system',
        items: [
            {
                title: "PDF generate",
                url: "#",
            },
            {
                title: "Quiz list",
                url: "#",
            },
            {
                title: "Allocate to class",
                url: "#",
            },
        ],
    },
];

async function seedMenus() {
    async function insertMenu(menu, parentId = null) {
        const createdMenu = await Menu.create({
        menu_code: menu.title.toLowerCase().replace(/ /g, "_"),
        menu_name: menu.title,
        parent_menu_id: parentId,
        route_path: menu.url,
        icon: menu.icon || null,
        display_order: 0,
        is_active: menu.isActive || true,
        type: menu.type, // Include the type field
        created_at: new Date(),
        });

        if (menu.items && menu.items.length > 0) {
        for (const subMenu of menu.items) {
            await insertMenu(subMenu, createdMenu.id);
        }
        }
    }

    try {
        await MenuPermission.destroy({ where: {} });

        await Menu.destroy({ where: {} });

        for (const mainMenu of navMain) {
        await insertMenu(mainMenu);
        }

        console.log('Menus seeded successfully!');
    } catch (error) {
        console.error('Error seeding menus:', error);
    }
}

seedMenus().catch(console.error);
