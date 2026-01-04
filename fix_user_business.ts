
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USER_EMAIL = "rubenoroz@gmail.com";
const BUSINESS_ID = "cmjygf2aw0002pv9mhvgzlaqb"; // Existing business ID

async function main() {
    console.log(`Checking user ${USER_EMAIL}...`);
    const user = await prisma.user.findUnique({
        where: { email: USER_EMAIL }
    });

    if (!user) {
        console.error("User not found!");
        process.exit(1);
    }

    console.log("Current user data:", user);

    if (user.businessId === BUSINESS_ID) {
        console.log("User already has the correct businessId. No changes needed.");
        return;
    }

    console.log(`Updating user to businessId: ${BUSINESS_ID}...`);
    const updatedUser = await prisma.user.update({
        where: { email: USER_EMAIL },
        data: {
            businessId: BUSINESS_ID,
            // Also ensure they have a branch if needed (optional, but good for safety)
            // We won't force a branchId here unless necessary, but the API creates often look for it.
            // Let's just fix the businessId first as that's the primary blocker.
        }
    });

    console.log("User updated successfully:", updatedUser);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
