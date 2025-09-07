import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function recreateDatabase() {
  try {
    // Connect to PostgreSQL as superuser to create database
    console.log('🔗 Connecting to PostgreSQL to recreate database...');
    
    // Connect to default postgres database first
    const adminClient = postgres('postgresql://postgres:a@localhost:5432/postgres');
    
    try {
      // Drop database if exists
      console.log('🗑️ Dropping database reev_db if it exists...');
      await adminClient.unsafe('DROP DATABASE IF EXISTS reev_db;');
      
      // Create database
      console.log('🆕 Creating database reev_db...');
      await adminClient.unsafe('CREATE DATABASE reev_db;');
      
      console.log('✅ Database reev_db created successfully');
    } finally {
      await adminClient.end();
    }
    
    // Test connection to new database
    const testClient = postgres('postgresql://postgres:a@localhost:5432/reev_db');
    
    try {
      console.log('🧪 Testing connection to new database...');
      await testClient`SELECT 1`;
      console.log('✅ Connection to reev_db successful');
    } finally {
      await testClient.end();
    }
    
    console.log('🎉 Database recreation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error recreating database:', error);
    process.exit(1);
  }
}

recreateDatabase();
