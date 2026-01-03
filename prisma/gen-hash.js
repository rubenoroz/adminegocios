const { hash } = require("bcryptjs");

async function run() {
    const h = await hash("Lum@show1", 12);
    console.log(h);
}

run();
