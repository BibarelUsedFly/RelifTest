const KoaRouter = require('koa-router');
// Modelos de sequelize
const { Client, Message, Debt, sequelize } = require('./models');
const { Op } = require('sequelize');
const { OpenAI } = require('openai');

const chatbot = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const router = new KoaRouter();

// GET /clients
router.get('/clients', async ctx => {
  const clients = await Client.findAll({
    attributes: ['id', 'name', 'rut']
  });
  ctx.body = clients;
});

// GET /clients/<id>
router.get('/clients/:id', async ctx => {
  // Sacamos el id de la ruta como parámetro
  const { id } = ctx.params;

  const client = await Client.findByPk(id, {
    attributes: ['id', 'name', 'rut'],
    include: [
      {
        model: Message,
        as: 'Messages',
        attributes: ['id', 'text', 'sentAt', 'role']
      },
      {
        model: Debt,
        as: 'Debts',
        attributes: ['id', 'amount', 'institution', 'dueDate']
      }
    ]
  });

  if (!client) {
    ctx.status = 404;
    ctx.body = { error: 'No existe el cliente :(' };
    return;
  }

  /* Esto último es para que la respuesta use "messages"
     y "debts" en minúscula, como sale en el notion */
  const result = {
    id: client.id,
    name: client.name,
    rut: client.rut,
    messages: client.Messages,
    debts: client.Debts
  };
  ctx.body = result;
});

// GET /clients-to-do-follow-up
router.get('/clients-to-do-follow-up', async ctx => {
  // Fijamos una fecha 7 días atrás
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  const clients = await Client.findAll({
    attributes: ['id', 'name', 'rut'],
    include: [
      {
        model: Message,
        as: 'Messages',
        attributes: ['sentAt'],
        separate: true,
        order: [['sentAt', 'DESC']], // Mensaje más reciente
        limit: 1
      }
    ]
  });

  const filteredClients = clients
    .filter(client => {
      const lastMessage = client.Messages[0];
      // Hay mensaje & tiene más de una semana
      return lastMessage && new Date(lastMessage.sentAt) < lastWeek;
    })
    .map(client => ({
      id: client.id,
      name: client.name,
      rut: client.rut
    }));

  ctx.body = filteredClients;
});

// POST /clients
router.post('/clients', async ctx => {
  /* Sacamos del cuerpo de la request los campos para crear al cliente 
     y creamos una transacción para agrupar los cambios a las tablas
     de clientes, mensajes y deudas */
  const { name, rut, messages, debts } = ctx.request.body;
  const t = await sequelize.transaction();

  /* Nos aseguramos de que el cliente viene con nombre y rut al menos,
     para no quedar con campos "null" */
  if (!name || !rut) {
    ctx.status = 400;
    ctx.body = { error: 'Datos faltantes: se requiere nombre y rut.' };
    return;
  }

  try {
    const client = await Client.create({ name, rut }, { transaction: t });

    // Si hay mensajes
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        await Message.create({
          text: msg.text,
          role: msg.role,
          sentAt: msg.sentAt,
          clientId: client.id
        }, { transaction: t });
      }
    }

    // Si hay deudas
    if (Array.isArray(debts)) {
      for (const debt of debts) {
        await Debt.create({
          amount: debt.amount,
          institution: debt.institution,
          dueDate: debt.dueDate,
          clientId: client.id
        }, { transaction: t });
      }
    }

    await t.commit();

    // Retornamos el cliente entero recién creado
    const fullClient = await Client.findByPk(client.id, {
      attributes: ['id', 'name', 'rut'],
      include: [
        {
          model: Message,
          as: 'Messages',
          attributes: ['id', 'text', 'sentAt', 'role']
        },
        {
          model: Debt,
          as: 'Debts',
          attributes: ['id', 'amount', 'institution', 'dueDate']
        }
      ]
    });

    // Pasamos a minúsculas (iual que en e GET clients/<id>)
    ctx.status = 201;
    ctx.body = {
      id: fullClient.id,
      name: fullClient.name,
      rut: fullClient.rut,
      messages: fullClient.Messages,
      debts: fullClient.Debts
    };

  } catch (err) {
    await t.rollback();
    ctx.status = 500;
    ctx.body = { error: 'Algo salió mal :(' };
    console.error(err);
  }
});

// POST clients/<id>/message
router.post('/clients/:id/message', async ctx => {
  const { id } = ctx.params;
  const { text, role, sentAt } = ctx.request.body;

  // Verificamos que vengan los campos requeridos
  if (!text || !role || !sentAt) {
    ctx.status = 400;
    ctx.body = { error: 'Se requiere text, role, y sentAt' };
    return;
  }

  // Verificamos que exista el cliente
  const client = await Client.findByPk(id);
  if (!client) {
    ctx.status = 404;
    ctx.body = { error: 'No existe el cliente :(' };
    return;
  }

  // Creamos el mensaje
  const message = await Message.create({
    text,
    role,
    sentAt,
    clientId: client.id
  });

  ctx.status = 201;
  ctx.body = {
    id: message.id,
    text: message.text,
    sentAt: message.sentAt,
    role: message.role
  };
});

// GET clients/<id>/generateMessage --------------------
router.get('/clients/:id/generateMessage', async ctx => {
  const { id } = ctx.params;
  const client = await Client.findByPk(id);

  if (!client) {
    ctx.status = 404;
    ctx.body = { error: 'No existe el cliente :(' };
    return;
  }

  // Sacamos el historial de conversación con el cliente
  const messages = await Message.findAll({
    where: { clientId: client.id },
    order: [['sentAt', 'ASC']],
    attributes: ['role', 'text', 'sentAt']
  });

  // Vemos si el cliente es moroso
  const now = new Date();
  const debts = await Debt.findAll({
    where: {
      clientId: client.id,
      // Deudas con fecha de vencimiento anterior a la fecha actual
      dueDate: { [Op.lt]: now }  
    }
  });
  const isMorose = debts.length > 0;

  // Definimos el prompt para Rebeca, la asistente 100% humana no IA
  const chatHistory = [
    {
      role: 'system',
      content: `Tu nombre es Rebeca. Eres una asistente humana que trabaja en **Zeller**, una plataforma chilena de venta de autos nuevos.
Tu tarea es ayudar amablemente al cliente a encontrar el auto perfecto según sus necesidades.
Nunca digas que eres una inteligencia artificial. Actúa como una vendedora real de una sucursal de Zeller.

Ofreces vehículos nuevos de dos marcas ficticias:
- **Pegasus Motors**: modelos *Aether X1* y *Storm Vento*
- **Titan Carworks**: modelos *Cyclops GT* y *Midgard 3*

Zeller tiene tres sucursales:
- **Sucursal Santiago de Chile**
- **Sucursal Monte Olimpo**
- **Sucursal Río Estigia**

Si el cliente no tiene deudas morosas, puedes mencionar que hay opciones de financiamiento disponibles.
Si el cliente **tiene deudas vencidas**, debes avisarle educadamente y explicar que eso puede afectar las opciones de financiamiento.

Políticas de comportamiento que debes seguir como asesora humana:

- Si el cliente pide hablar con una persona real, responde que tú eres una asesora de Zeller y que estás aquí para ayudar personalmente.

- Si el cliente utiliza lenguaje ofensivo, responde con firmeza y profesionalismo. Establece que ese tipo de lenguaje no será tolerado y ofrece continuar solo si hay respeto.

- Si el cliente no responde o está siendo confuso, intenta retomar la conversación de forma educada.

- Si el cliente solo saluda o no expresa claramente lo que busca, responde de forma breve y amable, invitándolo a contar más sobre lo que necesita. No muestres listas de modelos, sucursales ni opciones hasta que el cliente exprese interés específico.

- Si el cliente no tiene deudas morosas, no menciones las deudas. En caso de que sea relevante, puedes simplemente mencionar que hay opciones de financiamiento.

El cliente se llama **${client.name}**.
Tiene deudas morosas: **${isMorose ? 'sí' : 'no'}**.

Redacta tu mensaje de forma cálida y profesional. Hazlo breve y directo.`
    },
    /* Pasamos el historial de mensajes 
       si son "client", lo pasamos a la api como "user"
       en caso contrario (si son "agent"),
       lo pasamos a la api como "assistant".
       Esto según lo documentado en
       https://platform.openai.com/docs/api-reference/chat/create */
    ...messages.map(msg => ({
      role: msg.role === 'client' ? 'user' : 'assistant',
      content: msg.text
    }))
  ];

  const completion = await chatbot.chat.completions.create({
    model: 'gpt-4o',
    messages: chatHistory
  });

  const generatedText = completion.choices[0].message.content;

  ctx.body = {
    text: generatedText
  };
});


module.exports = router;