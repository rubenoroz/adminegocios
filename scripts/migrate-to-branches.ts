import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting branch migration...');

    // Get all businesses
    const businesses = await prisma.business.findMany({
        include: {
            branches: true
        }
    });

    for (const business of businesses) {
        console.log(`\nProcessing business: ${business.name}`);

        // Get or create first branch
        let firstBranch = business.branches[0];

        if (!firstBranch) {
            console.log(`  No branches found, creating 'Principal' branch...`);
            firstBranch = await prisma.branch.create({
                data: {
                    name: 'Principal',
                    address: '',
                    businessId: business.id
                }
            });
            console.log(`  ✓ Created branch: ${firstBranch.name}`);
        } else {
            console.log(`  Using existing branch: ${firstBranch.name}`);
        }

        // Migrate Products (via InventoryItem)
        const productsWithoutBranch = await prisma.product.findMany({
            where: {
                businessId: business.id,
                inventory: {
                    none: {}
                }
            }
        });

        if (productsWithoutBranch.length > 0) {
            console.log(`  Migrating ${productsWithoutBranch.length} products...`);
            for (const product of productsWithoutBranch) {
                await prisma.inventoryItem.create({
                    data: {
                        productId: product.id,
                        branchId: firstBranch.id,
                        quantity: 0,
                        minStock: 5
                    }
                });
            }
            console.log(`  ✓ Migrated ${productsWithoutBranch.length} products`);
        }

        // Migrate Students
        const studentsCount = await prisma.student.updateMany({
            where: {
                businessId: business.id,
                branchId: null
            },
            data: {
                branchId: firstBranch.id
            }
        });
        if (studentsCount.count > 0) {
            console.log(`  ✓ Migrated ${studentsCount.count} students`);
        }

        // Migrate Employees
        const employeesCount = await prisma.employee.updateMany({
            where: {
                businessId: business.id,
                branchId: null
            },
            data: {
                branchId: firstBranch.id
            }
        });
        if (employeesCount.count > 0) {
            console.log(`  ✓ Migrated ${employeesCount.count} employees`);
        }

        // Migrate Courses
        const coursesCount = await prisma.course.updateMany({
            where: {
                businessId: business.id,
                branchId: null
            },
            data: {
                branchId: firstBranch.id
            }
        });
        if (coursesCount.count > 0) {
            console.log(`  ✓ Migrated ${coursesCount.count} courses`);
        }

        // Migrate Tables
        const tablesCount = await prisma.table.updateMany({
            where: {
                businessId: business.id,
                branchId: null
            },
            data: {
                branchId: firstBranch.id
            }
        });
        if (tablesCount.count > 0) {
            console.log(`  ✓ Migrated ${tablesCount.count} tables`);
        }

        // Migrate Orders
        const ordersCount = await prisma.order.updateMany({
            where: {
                businessId: business.id,
                branchId: null
            },
            data: {
                branchId: firstBranch.id
            }
        });
        if (ordersCount.count > 0) {
            console.log(`  ✓ Migrated ${ordersCount.count} orders`);
        }
    }

    console.log('\n✅ Migration completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
