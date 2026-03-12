const nodemailer = require('nodemailer');
const dns = require('dns');

// Forzar el uso de IPv4. Render gratuito a veces intenta usar IPv6 de salida hacia Google y falla con "ENETUNREACH".
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const STATUS_INFO = {
    pending:     { text: 'Recibido',       color: '#f59e0b', msg: 'Hemos recibido tu pedido y está siendo revisado. Te avisaremos pronto.' },
    accepted:    { text: 'Aceptado',        color: '#10b981', msg: 'Tu pedido fue aceptado. Procede con el pago y envíanos el comprobante por WhatsApp.' },
    in_progress: { text: 'En elaboración',  color: '#3b82f6', msg: 'Estamos tejiendo tu pedido con mucho cariño. Pronto estará listo.' },
    on_hold:     { text: 'En espera',       color: '#8b5cf6', msg: 'Tu pedido está en espera por disponibilidad de materiales. Te contactaremos pronto.' },
    completed:   { text: 'Completado',      color: '#10b981', msg: 'Tu pedido está listo. Coordinaremos la entrega contigo directamente.' },
    rejected:    { text: 'No disponible',   color: '#ef4444', msg: 'Lamentamos informarte que no podemos atender este pedido en este momento. Intenta más adelante.' },
};

const sendOrderEmail = async (clientEmail, clientName, orderCode, status, items = [], total = 0) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  EMAIL_USER o EMAIL_PASS no configurados. Correo no enviado.');
        return;
    }

    const info = STATUS_INFO[status] || STATUS_INFO.pending;
    const isPending = status === 'pending';
    const subject = isPending
        ? `✅ Pedido recibido — ${orderCode} | Patito Crochet`
        : `📦 Actualización de pedido ${orderCode} — ${info.text}`;

    const itemsHtml = items.map(i => `
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;">${i.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center;">${i.quantity || 1}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;">$${Number(i.price).toFixed(2)} USD</td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <div style="background:#2C2F3A;padding:28px 32px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">Patito Crochet</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;letter-spacing:1px;">TEJIDOS CON DISEÑO · VINCES, ECUADOR</div>
        </div>

        <!-- Estado badge -->
        <div style="background:${info.color}18;border-bottom:3px solid ${info.color};padding:20px 32px;text-align:center;">
          <div style="font-size:13px;color:${info.color};font-weight:700;letter-spacing:1px;text-transform:uppercase;">${info.text}</div>
          <div style="font-size:28px;font-weight:800;color:#2C2F3A;margin-top:4px;font-family:monospace;">${orderCode}</div>
        </div>

        <!-- Cuerpo -->
        <div style="padding:28px 32px;">
          <p style="font-size:15px;color:#374151;margin:0 0 8px;">Hola, <strong>${clientName}</strong> 👋</p>
          <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 24px;">${info.msg}</p>

          ${items.length > 0 ? `
          <div style="border:1px solid #f3f4f6;border-radius:10px;overflow:hidden;margin-bottom:20px;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 12px;font-size:11px;color:#9ca3af;text-align:left;font-weight:600;text-transform:uppercase;">Producto</th>
                  <th style="padding:10px 12px;font-size:11px;color:#9ca3af;text-align:center;font-weight:600;text-transform:uppercase;">Cant.</th>
                  <th style="padding:10px 12px;font-size:11px;color:#9ca3af;text-align:right;font-weight:600;text-transform:uppercase;">Precio</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot>
                <tr style="background:#f9fafb;">
                  <td colspan="2" style="padding:10px 12px;font-size:13px;font-weight:700;color:#374151;">Total</td>
                  <td style="padding:10px 12px;font-size:14px;font-weight:800;color:#2C2F3A;text-align:right;">$${Number(total).toFixed(2)} USD</td>
                </tr>
              </tfoot>
            </table>
          </div>
          ` : ''}

          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center;">
            <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Tu código de seguimiento</div>
            <div style="font-family:monospace;font-size:24px;font-weight:800;color:#2C2F3A;margin-bottom:12px;">${orderCode}</div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/rastrear?codigo=${orderCode}" style="display:inline-block;background:#d97706;color:white;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;font-size:14px;box-shadow:0 2px 4px rgba(217,119,6,0.2);">🔍 Rastrear mi pedido</a>
            <div style="font-size:12px;color:#b45309;margin-top:12px;">O ingrésalo manualmente en la sección "Rastrear" de nuestro sitio web.</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
          <div style="font-size:12px;color:#9ca3af;line-height:1.8;">
            Patito Crochet · Vinces, Ecuador<br>
            ¿Preguntas? Contáctanos por WhatsApp
          </div>
        </div>
      </div>
    </body>
    </html>`;

    try {
        await transporter.sendMail({
            from: `"Patito Crochet" <${process.env.EMAIL_USER}>`,
            to: clientEmail,
            subject,
            html
        });
        console.log(`✉️  Correo enviado a ${clientEmail} — Estado: ${status}`);
    } catch (error) {
        console.error('❌ Error enviando correo:', error.message);
    }
};

const sendAdminNotificationEmail = async (orderCode, items = [], total = 0, clientData) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

    const itemsHtml = items.map(i => `
        <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity || 1}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${Number(i.price).toFixed(2)}</td>
        </tr>
    `).join('');

    const html = `
    <div style="font-family: Arial, sans-serif; background: #fdfdfd; padding: 20px;">
        <h2 style="color: #2C2F3A;">Nuevo Pedido Recibido 🔔</h2>
        <p><strong>Código:</strong> ${orderCode}</p>
        <p><strong>Cliente:</strong> ${clientData.name} (${clientData.email})</p>
        <p><strong>Teléfono:</strong> ${clientData.phone}</p>
        ${clientData.address ? `<p><strong>Notas:</strong> ${clientData.address}</p>` : ''}
        
        <h3>Resumen del pedido</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background: #f4f4f4;">
                    <th style="padding: 8px; text-align: left;">Producto</th>
                    <th style="padding: 8px;">Cant.</th>
                    <th style="padding: 8px; text-align: right;">Precio</th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
                <tr>
                    <td colspan="2" style="padding: 8px; font-weight: bold;">Total</td>
                    <td style="padding: 8px; font-weight: bold; text-align: right;">$${Number(total).toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin" style="background: #10b981; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Ir al Panel de Administración</a></p>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Patito Crochet" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Se envía al mismo admin
            subject: `🔔 Nuevo Pedido: ${orderCode} de ${clientData.name}`,
            html
        });
        console.log(`✉️  Alerta de admin enviada para ${orderCode}`);
    } catch (error) {
        console.error('❌ Error enviando alerta de admin:', error.message);
    }
};

module.exports = { sendOrderEmail, sendAdminNotificationEmail };
