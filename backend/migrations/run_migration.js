/**
 * Script para ejecutar la migración de campos de lectura en mensajes
 * Ejecutar con: node backend/migrations/run_migration.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;

  try {
    console.log('🔌 Conectando a la base de datos...');

    // Crear conexión
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Conectado a MySQL');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'add_mensaje_leido_fields.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Ejecutando migración...');

    // Ejecutar las queries
    await connection.query(sql);

    console.log('✅ Migración completada exitosamente');
    console.log('');
    console.log('Campos agregados:');
    console.log('  - mensajes.leido (BOOLEAN)');
    console.log('  - mensajes.fecha_leido (DATETIME)');
    console.log('  - Índice: idx_mensajes_leido');
    console.log('');
    console.log('Los mensajes salientes existentes han sido marcados como leídos.');
    console.log('Los mensajes entrantes quedan como no leídos por defecto.');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar migración
runMigration();
