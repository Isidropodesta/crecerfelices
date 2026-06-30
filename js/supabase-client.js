const SUPABASE_URL  = 'https://eixjvwaneetpebcelgcb.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpeGp2d2FuZWV0cGViY2VsZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Nzg3MjcsImV4cCI6MjA5ODM1NDcyN30.lK9Uh6rgLSd1T4GzP_hn7lsQjJubKprIxMUoMNc82Dk';

const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

/* Verificación de conexión: intenta obtener la sesión actual.
   No requiere tablas — solo confirma que el cliente llega a Supabase. */
(async function testConexion() {
  try {
    const { error } = await db.auth.getSession();
    if (error) throw error;
    console.log('✅ Supabase conectado correctamente');
  } catch (e) {
    console.error('❌ Error al conectar con Supabase:', e.message);
  }
})();
