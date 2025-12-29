
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("--- COMPARING LISTS ---");

    // 1. Get Employees
    const employees = await prisma.employee.findMany({
        select: { firstName: true, lastName: true, email: true, role: true }
    });
    console.log(`\nEMPLOYEES (${employees.length}):`);
    console.table(employees.map(e => ({ name: `${e.firstName} ${e.lastName}`, email: e.email, role: e.role })));

    // 2. Get Teachers (Users)
    const teachers = await prisma.user.findMany({
        where: { role: "TEACHER" },
        select: { name: true, email: true, role: true }
    });
    console.log(`\nTEACHERS (Users with role TEACHER) (${teachers.length}):`);
    console.table(teachers);

    // 3. Find missing
    const empEmails = new Set(employees.map(e => e.email));
    const teacherEmails = new Set(teachers.map(t => t.email));

    const teachersNotEmployees = teachers.filter(t => !empEmails.has(t.email));
    const employeesNotTeachers = employees.filter(e => e.role === "TEACHER" && !teacherEmails.has(e.email));

    console.log("\n--- DISCREPANCIES ---");
    if (teachersNotEmployees.length > 0) {
        console.log("Teachers (Users) who are NOT in Employee list:");
        console.table(teachersNotEmployees);
    } else {
        console.log("All Teachers have Employee records.");
    }

    if (employeesNotTeachers.length > 0) {
        console.log("Employees (Role: TEACHER) who are NOT in User list:");
        console.table(employeesNotTeachers);
    } else {
        console.log("All Employee Teachers have User records.");
    }
}

main();
