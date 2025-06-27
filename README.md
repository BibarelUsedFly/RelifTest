# RelifTest
Prueba técnica para postulación a Relif
 
Este proyecto es un backend en Node.js que utiliza **Koa**, **Sequelize**, y **PostgreSQL**. Inluye una asistente virtual llamada **Rebeca** que funciona mediante la API de OpenAI.

---

## 🚀 Instrucciones de instalación

1. **Clonar el repo**
   ```bash
   git clone https://github.com/BibarelUsedFly/RelifTest.git

2. **Instalar dependencias**
    ```bash
    npm install
    ```
    Luego crea una base de datos en postgres

3. **Crear un archivo .env**
    Crea un archivo .env con las siguientes variables de entorno.
    ```bash
    OPENAI_API_KEY=<tu-api-key-de-openai>
    DB_USERNAME=<tu-usuario-de-postgres>
    DB_PASSWORD=<contraseña-de-postgres>
    DB_NAME=<nombre-de-la-base-de-datos>
    DB_HOST=127.0.0.1
    DB_DIALECT=postgres

4. **Crear tablas y datos de prueba**
    Puedes usar el CLI de Sequelize para correr las migraciones necesarias de la base de datos y crear unos cuantos datos de prueba.
    ```bash
    npx sequelize db:migrate
    npx sequelize db:seed:all

5. **Iniciar el servidor**
    ```bash
    npm start

## 🔌 API Endpoints
### GET /clients
Devuelve una lista con todos los clientes registrados.

### GET /clients/:id
Devuelve la información detallada de un cliente específico, incluyendo:

Mensajes asociados

Deudas asociadas

### GET /clients-to-do-follow-up
Devuelve los clientes cuyo último mensaje fue enviado hace más de 7 días.
(No incluye clientes sin mensajes.)

### POST /clients
Crea un nuevo cliente.
Se pueden incluir mensajes y deudas opcionales en la solicitud.

### POST /clients/:id/message
Agrega un nuevo mensaje al cliente indicado por su ID.

### GET /clients/:id/generateMessage
Genera una respuesta inteligente de Rebeca, la asistente 100% humana no IA, basada en el historial de mensajes del cliente y considerando si tiene deudas morosas.

## ✍🏻 Decisiones de diseño
Se eligió usar el modelo GPT-4o ya que es uno de los con mejor funcionamiento actualmente y tiene la capacidad de considerar todo el contexto. (Y, siendo honestos, porque disponemos de una api-key para usarlo).

Como es una aplicación de prueba, se decidió elegir la temática de mitología griega para poblar la base de datos. Tenemos clientes como Zeus (con muchas deudas), Hades (con mensajes previos del año pasado), Poseidón, etc.
El servicio cuenta con las marcas de auto:
- **Pegasus Motors**, con modelos *Aether X1* y *Storm Vento*
- **Titan Carworks**, con modelos *Cyclops GT* y *Midgard 3*

Existen tres sucursales:
- Sucursal Santiago de Chile
- Sucursal Monte Olimpo
- Sucursal Río Estigia

Para llegar al prompt actual se partió de un prompt algo más genérico como "Tu nombre es Rebeca. Eres una asistente humana que busca ayudar al cliente a encontrar su auto ideal. Redacta tu mensaje de forma cálida y profesional. Hazlo breve y directo.". Luego se incorporaron los datos dobre modelos y sucursales, así como los requisitos, como lo de que las opciones de financiamiento están disponibles solo para clientes sin deudas morosas. Después, se consultó con la misma IA cómo mejorar la IA (chatGPT). Después de probar un poco las respuestas se añadieron políticas algo más específicas de comportamiento para manejar casos borde, como un cliente solicitando hablar con un humano o supervisor, o un cliente siendo ofensivo. También se especificó no soltar toda la información si el cliente no ha demostrado interés aún, para evitar soltarle el catálogo entero a un usuario que solo ha dicho "hola".
