import "dotenv/config";
import pg from "pg";

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Production veritabanı bağlantısı bulunamadı.");
}

const client = new pg.Client({ connectionString });
await client.connect();
try {
  const result = await client.query(`
    UPDATE "_prisma_migrations"
    SET rolled_back_at = NOW()
    WHERE migration_name = '202608010002_project_number_by_destination'
      AND finished_at IS NULL
      AND rolled_back_at IS NULL
  `);
  if (result.rowCount) {
    console.log("Başarısız proje numarası migration kaydı yeniden denemek için hazırlandı.");
  }
} finally {
  await client.end();
}
