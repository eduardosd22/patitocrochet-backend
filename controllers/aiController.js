const Groq = require('groq-sdk');
const SystemConfig = require('../models/SystemConfig');

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const generateQuote = async (req, res) => {
    try {
        const { userPrompt, description } = req.body;
        const query = userPrompt || description;

        if (!query) return res.status(400).json({ error: 'Describe tu pedido para obtener una cotizacion.' });

        if (!groq) {
            return res.status(500).json({ error: 'Configuracion de IA no disponible.' });
        }

        let config = await SystemConfig.findOne();
        if (!config) {
            config = { hourlyRate: 8, baseMaterialCost: 5 };
        }

        const systemPrompt = `
            Eres la asistente virtual de "Patito Crochet", una tienda artesanal de tejidos a crochet de Ecuador.
            Tu mision es cotizar pedidos personalizados de clientes.

            REGLAS ABSOLUTAS:
            1. TODOS los precios son en DOLARES AMERICANOS (USD). NUNCA menciones pesos, MXN ni ninguna otra moneda.
            2. Responde UNICAMENTE con un objeto JSON valido. Sin texto extra, sin markdown, sin explicaciones fuera del JSON.
            3. El "clientMessage" debe ser amigable, entusiasta y breve. NO menciones horas, tarifas ni costos de materiales. Solo describe lo que haras y da el precio final en USD.
            4. Para calcular internally: (horas_estimadas * ${config.hourlyRate}) + ${config.baseMaterialCost} + extraCost = recommendedPrice

            Estructura JSON requerida exacta:
            {
                "estimatedHours": numero,
                "extraCost": numero,
                "clientMessage": "Mensaje amigable. Describe lo que haremos. Termina mencionando el precio: Tu pedido tiene un precio de $XX.XX USD.",
                "recommendedPrice": numero
            }
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            max_tokens: 600,
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content;

        try {
            const jsonText = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonQuote = JSON.parse(jsonText);

            res.status(200).json({
                estimatedPrice: jsonQuote.recommendedPrice,
                estimatedHours: jsonQuote.estimatedHours,
                justification: jsonQuote.clientMessage,
                requiresAdminValidation: jsonQuote.estimatedHours > 8 || jsonQuote.recommendedPrice > 150
            });
        } catch (parseError) {
            console.error('Error parseando JSON de IA:', aiResponse);
            res.status(500).json({ error: 'Intenta reformular tu pedido con mas detalles.' });
        }

    } catch (error) {
        console.error('Error en generateQuote:', error);
        res.status(500).json({ error: 'Error interno al procesar la cotizacion.' });
    }
};

module.exports = { generateQuote };
