const bcrypt = require('bcryptjs');

// Contraseña que quieres usar
const password = 'Admin123!';

// Genera el hash exactamente como en tu código
const salt = bcrypt.genSaltSync(12);
const hashedPassword = bcrypt.hashSync(password, salt);

console.log('=== DATOS PARA INSERTAR EN LA BD ===');
console.log('Contraseña en texto plano:', password);
console.log('Hash para la BD:', hashedPassword);
console.log('\n=== QUERY SQL ===');
console.log(`INSERT INTO usuarios (nombre, email, password, rol, estado) VALUES ('Admin', 'admin@jelcom.com', '${hashedPassword}', 'admin', 'activo');`);