const XLSX = require('xlsx');

try {
    console.log('Iniciando extracción de datos...');

    // Leer archivo principal
    const workbook = XLSX.readFile('../Referencias/MANZANERO 2021.xlsx');
    console.log('Archivo leído, hojas:', workbook.SheetNames.length);

    const students = [];
    const teachers = [];
    const courses = new Set();

    workbook.SheetNames.forEach(name => {
        // Agregar maestro
        teachers.push({
            Nombre: name,
            Apellido: '',
            Email: name.toLowerCase().replace(/\s+/g, '.') + '@escuela.com',
            Telefono: ''
        });

        const data = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });

        // Procesar desde fila 3
        for (let i = 2; i < data.length; i++) {
            const row = data[i];
            if (!row || !row[1]) continue;

            const nombre = String(row[1]).trim();
            if (nombre.length < 3 || nombre.toUpperCase() === 'NOMBRE') continue;

            const partes = nombre.split(' ');
            const tel = row[2] ? String(row[2]).split('/')[0].trim() : '';
            const clase = row[3] ? String(row[3]).trim() : '';

            students.push({
                Nombre: partes[0] || '',
                Apellido: partes.slice(1).join(' ') || '',
                Telefono: tel,
                Clase: clase,
                Maestro: name
            });

            if (clase) courses.add(clase.toLowerCase());
        }
    });

    console.log('Alumnos encontrados:', students.length);
    console.log('Maestros encontrados:', teachers.length);
    console.log('Cursos encontrados:', courses.size);

    // Guardar ALUMNOS
    const wb1 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb1, XLSX.utils.json_to_sheet(students), 'Alumnos');
    XLSX.writeFile(wb1, '../Referencias/IMPORT_ALUMNOS.xlsx');
    console.log('✅ Guardado: IMPORT_ALUMNOS.xlsx');

    // Guardar MAESTROS
    const wb2 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb2, XLSX.utils.json_to_sheet(teachers), 'Maestros');
    XLSX.writeFile(wb2, '../Referencias/IMPORT_MAESTROS.xlsx');
    console.log('✅ Guardado: IMPORT_MAESTROS.xlsx');

    // Guardar CURSOS
    const coursesArr = Array.from(courses).map(c => ({
        Nombre: c.charAt(0).toUpperCase() + c.slice(1),
        Descripcion: 'Clase de ' + c
    }));
    const wb3 = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb3, XLSX.utils.json_to_sheet(coursesArr), 'Cursos');
    XLSX.writeFile(wb3, '../Referencias/IMPORT_CURSOS.xlsx');
    console.log('✅ Guardado: IMPORT_CURSOS.xlsx');

    console.log('\n🎉 ¡Todos los archivos generados exitosamente!');

} catch (e) {
    console.error('Error:', e.message);
}
