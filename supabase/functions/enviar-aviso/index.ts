import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const DEST_EMAIL     = 'isidropodesta@gmail.com';
const FROM_EMAIL     = 'onboarding@resend.dev';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const payload = await req.json();
    const record  = payload.record;
    const tabla   = payload.table as string;

    let asunto = '';
    let cuerpo = '';

    if (tabla === 'voluntarios_inscripciones') {
      asunto = `Nuevo voluntario: ${record.nombre}`;
      cuerpo = `
        <h2>Nueva inscripción de voluntario</h2>
        <p><strong>Nombre:</strong> ${record.nombre}</p>
        <p><strong>Edad:</strong> ${record.edad ?? '—'}</p>
        <p><strong>Teléfono:</strong> ${record.telefono}</p>
        <p><strong>Email:</strong> ${record.email}</p>
        <p><strong>Disponibilidad:</strong> ${record.disponibilidad ?? '—'}</p>
        <p><strong>Mensaje:</strong> ${record.mensaje ?? '—'}</p>
        <hr>
        <p style="color:#888;font-size:12px;">Ver todos los mensajes en el <a href="https://crecerfelices.vercel.app/admin/panel.html">panel de administración</a>.</p>
      `;
    } else if (tabla === 'contacto_mensajes') {
      asunto = `Nuevo mensaje de contacto: ${record.asunto ?? record.nombre}`;
      cuerpo = `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${record.nombre}</p>
        <p><strong>Email:</strong> ${record.email}</p>
        <p><strong>Asunto:</strong> ${record.asunto ?? '—'}</p>
        <p><strong>Mensaje:</strong></p>
        <blockquote>${record.mensaje}</blockquote>
        <hr>
        <p style="color:#888;font-size:12px;">Ver todos los mensajes en el <a href="https://crecerfelices.vercel.app/admin/panel.html">panel de administración</a>.</p>
      `;
    } else {
      return new Response('Tabla no reconocida', { status: 400, headers: CORS });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to:   DEST_EMAIL,
        subject: asunto,
        html: cuerpo,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: CORS });
  } catch (e) {
    console.error('Error en enviar-aviso:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
});
