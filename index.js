require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const mysql = require('mysql2/promise');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');

// --- CLIENTE DISCORD ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // RECUERDA ACTIVAR ESTO EN EL PORTAL DE DISCORD
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// --- BASE DE DATOS ---
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const app = express();
const PORT = process.env.PORT || 3000;

// --- AUTH ---
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || `http://localhost:${PORT}/auth/discord/callback`,
    scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
}));

app.use(session({ secret: 'star_citizen_security_protocol', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// --- UTILS ---
function getSemanaActual() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
}

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// =========================================================
// 🎨 ESTILOS STAR CITIZEN (VISUAL)
// =========================================================
const cssStarCitizen = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap');
    
    :root {
        --sc-blue: #00dcff;
        --sc-dark-blue: #0b1a26;
        --sc-gold: #ffb400;
        --sc-alert: #ff3333;
        --glass-panel: rgba(11, 26, 38, 0.9);
    }

    body {
        margin: 0; padding: 0;
        background-color: #000;
        color: white;
        font-family: 'Rajdhani', sans-serif;
        background-image: 
            radial-gradient(circle at 50% 50%, rgba(0, 220, 255, 0.05) 0%, transparent 60%),
            linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)),
            url('https://robertsspaceindustries.com/media/jk100j5b8q8qor/source/SC_Alpha_3-18_Dashboard_Visual.jpg'); 
        background-size: cover;
        background-attachment: fixed;
        min-height: 100vh;
        overflow-x: hidden;
    }

    h1, h2, h3 { font-family: 'Orbitron', sans-serif; text-transform: uppercase; letter-spacing: 3px; }

    .hero-title {
        font-size: 4rem; margin: 0;
        color: var(--sc-blue);
        text-shadow: 0 0 20px var(--sc-blue);
    }

    .rewards-text {
        font-size: 1.5rem; color: var(--sc-gold); font-weight: bold; margin-top: 10px;
        border: 1px solid var(--sc-gold); padding: 10px 30px; border-radius: 4px;
        background: rgba(255, 180, 0, 0.1); display: inline-block;
    }

    .creators { color: #556677; font-size: 0.9rem; margin-top: 20px; letter-spacing: 2px; }

    .btn-quantum {
        display: inline-block; text-decoration: none; margin-top: 40px;
        padding: 15px 60px; font-size: 1.5rem; font-weight: bold;
        color: var(--sc-dark-blue); background: var(--sc-blue);
        clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
        transition: 0.3s; font-family: 'Orbitron', sans-serif;
        box-shadow: 0 0 30px rgba(0, 220, 255, 0.4);
    }
    .btn-quantum:hover {
        background: white; box-shadow: 0 0 50px white; transform: scale(1.05); cursor: pointer;
    }

    .btn-officer {
        color: #556677; font-size: 0.9rem; text-decoration:none; margin-top:30px;
        border: 1px solid #334455; padding: 10px 20px; border-radius: 4px; 
        transition: 0.3s; font-family: 'Orbitron', sans-serif; letter-spacing: 2px;
        background: rgba(0,0,0,0.5); display: inline-block;
    }
    .btn-officer:hover {
        border-color: var(--sc-alert); color: var(--sc-alert); box-shadow: 0 0 15px rgba(255, 51, 51, 0.3);
    }

    .features-grid {
        display: flex; gap: 30px; margin-top: 60px; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 1200px;
    }
    .feature-card {
        background: var(--glass-panel); border: 1px solid #334455;
        padding: 30px; width: 280px; text-align: center;
        border-top: 3px solid var(--sc-blue);
        transition: 0.3s;
    }
    .feature-card:hover { border-top-color: var(--sc-gold); transform: translateY(-10px); }
    .feature-card h3 { color: white; font-size: 1.2rem; margin-bottom: 10px; }
    .feature-card p { color: #8899aa; line-height: 1.6; }

    .container { max-width: 1100px; margin: 0 auto; padding: 40px 20px; }
    .server-panel {
        background: var(--glass-panel); border: 1px solid #334455;
        padding: 25px; margin-bottom: 30px;
        position: relative;
    }
    .server-panel::before {
        content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px;
        background: linear-gradient(90deg, var(--sc-blue), transparent);
    }

    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; color: var(--sc-blue); border-bottom: 1px solid #334455; padding: 10px; font-family: 'Orbitron'; font-size: 0.8em; }
    td { padding: 15px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #ccddee; }
    
    .status-badge { padding: 4px 10px; font-size: 0.8em; border: 1px solid; text-transform: uppercase; }
    .open { color: var(--sc-blue); border-color: var(--sc-blue); box-shadow: 0 0 10px rgba(0,220,255,0.2); }
    .closed { color: var(--sc-alert); border-color: var(--sc-alert); box-shadow: 0 0 10px rgba(255,51,51,0.2); }
</style>
`;

// --- RUTAS WEB ---

app.get('/login', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/admin'));
app.get('/logout', (req, res) => req.logout(() => res.redirect('/')));

// 1. LANDING PAGE
app.get('/', (req, res) => {
    console.log(`🌐 [WEB] Visita a la página de inicio`); 
    const inviteLink = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot`;
    res.send(`
    <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Star Citizen Clips</title>${cssStarCitizen}</head>
    <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 60px 20px;">
        <h3>DESARROLLADO POR KINGS & JOYFER</h3>
        <h1 class="hero-title">CITIZEN CLIPS</h1>
        <div class="rewards-text">🏆 SÉ EL TOP 1 Y GANA NAVES + REGALOS SORPRESA 🎁</div>
        <p style="color:#8899aa; max-width:600px; text-align:center; margin-top:20px; font-size:1.1rem;">
            Demuestra tus habilidades en el Verso. Sube tus mejores momentos. La comunidad vota.
        </p>
        <a href="${inviteLink}" class="btn-quantum">INICIAR SISTEMAS (INVITAR)</a>
        
        <a href="/admin" class="btn-officer">
            🔒 ACCESO DE MANDO: SOLO OFICIALES
        </a>

        <div class="features-grid">
            <div class="feature-card"><h3>🚀 SUBE TUS CLIPS</h3><p>Usa <code>$subir</code> en el canal designado. Tienes 2 intentos para impresionar.</p></div>
            <div class="feature-card"><h3>🥇 RANKING SEMANAL</h3><p>Los votos de la comunidad deciden quién merece las naves.</p></div>
            <div class="feature-card"><h3>📡 CANAL DEDICADO</h3><p>Usa <code>$setcanal</code> para configurar dónde escucha el bot.</p></div>
        </div>
    </body></html>`);
});

// 2. ADMIN DASHBOARD
app.get('/admin', checkAuth, async (req, res) => {
    console.log(`👤 [WEB] Acceso Admin: ${req.user.username}`);
    const semana = getSemanaActual();
    const misServers = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8 && client.guilds.cache.has(g.id));

    if (misServers.length === 0) return res.send(`<!DOCTYPE html><html><head>${cssStarCitizen}</head><body style="padding:50px; text-align:center;"><h1>🚫 SIN ACCESO</h1><p>No se detectan servidores activos.</p><a href="/" class="btn-quantum">REGRESAR</a></body></html>`);

    let html = `<!DOCTYPE html><html><head><title>Command Center</title>${cssStarCitizen}</head><body>
    <div class="container">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
            <h1 style="margin:0; font-size:2rem; color:white;">COMMAND CENTER // <span style="color:var(--sc-blue)">${req.user.username.toUpperCase()}</span></h1>
            <a href="/logout" style="color:var(--sc-alert); text-decoration:none; border:1px solid var(--sc-alert); padding:5px 15px;">LOGOUT</a>
        </div>
        <p style="color:#556677; border-bottom:1px solid #334455; padding-bottom:10px;">CYCLE: <strong style="color:var(--sc-gold)">${semana}</strong></p>`;

    for (const guild of misServers) {
        const [rowsCierres] = await pool.execute("SELECT * FROM cierres WHERE semana_id = ? AND guild_id = ?", [semana, guild.id]);
        const cerrada = rowsCierres.length > 0;

        const [usuariosDB] = await pool.execute("SELECT * FROM usuarios WHERE guild_id = ? ORDER BY puntos DESC", [guild.id]);
        const [videosDB] = await pool.execute("SELECT * FROM videos WHERE guild_id = ? ORDER BY id DESC LIMIT 10", [guild.id]);

        const videosProcesados = await Promise.all(videosDB.map(async (v) => {
            const userConocido = usuariosDB.find(u => u.user_id === v.user_id);
            if (userConocido && userConocido.username) return { ...v, nombreDisplay: userConocido.username };
            try {
                const uDisc = await client.users.fetch(v.user_id);
                pool.execute("INSERT INTO usuarios (user_id, guild_id, username, puntos) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE username = VALUES(username)", [v.user_id, guild.id, uDisc.username, uDisc.username]).catch(()=>{});
                return { ...v, nombreDisplay: uDisc.username };
            } catch (e) { return { ...v, nombreDisplay: "Unknown Pilot" }; }
        }));

        html += `
        <div class="server-panel">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h2 style="margin:0; font-size:1.5rem; color:white;">${guild.name}</h2>
                <span class="status-badge ${cerrada ? 'closed' : 'open'}">${cerrada ? '🔒 LOCKED' : '🟢 ACTIVE'}</span>
            </div>
            <h3 style="color:var(--sc-gold); margin-top:20px;">🏆 ACE PILOTS</h3>
            <table><thead><tr><th>PILOT</th><th>SCORE</th></tr></thead><tbody>
            ${usuariosDB.length ? usuariosDB.map(u => `<tr><td>${u.username}</td><td style="color:var(--sc-gold); font-size:1.2em;">${u.puntos}</td></tr>`).join('') : '<tr><td colspan="2">NO DATA</td></tr>'}
            </tbody></table>
            <h3 style="color:var(--sc-blue); margin-top:30px;">📹 TRANSMISSIONS</h3>
            <table><thead><tr><th>PILOT</th><th>STATUS</th><th>LINK</th></tr></thead><tbody>
            ${videosProcesados.length ? videosProcesados.map(v => `<tr>
                <td style="color:#8899aa;">${v.nombreDisplay}</td>
                <td style="font-weight:bold; color:${v.estado === 'aprobado' ? '#00dcff' : (v.estado === 'rechazado' ? '#ff3333' : '#ffb400')}">${v.estado.toUpperCase()}</td>
                <td><a href="${v.url}" target="_blank" style="color:white;">VIEW ↗</a></td>
            </tr>`).join('') : '<tr><td colspan="3">NO SIGNALS</td></tr>'}
            </tbody></table>
        </div>`;
    }
    res.send(html + "</div></body></html>");
});

// =========================================================
// 🤖 BOT LOGIC
// =========================================================

client.once('clientReady', async (c) => {
    console.log(`✅ [BOT] Sistemas ONLINE. Piloto: ${c.user.tag}`);
    console.log(`💻 [SYS] Desarrollado por: KINGS & JOYFER`);
    
    // Crear tabla de configuración de canales si no existe
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS config_canales (
            guild_id VARCHAR(255) PRIMARY KEY,
            channel_id VARCHAR(255)
        )
    `);
    
    app.listen(PORT, () => console.log(`🌍 [WEB] Dashboard activo en puerto ${PORT}`));
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const guild_id = message.guild.id;
    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 0. CONFIGURACIÓN DEL CANAL (SOLO ADMINS)
    if (command === '$setcanal') {
        if (!message.member.permissions.has('Administrator')) return message.reply("⛔ **ACCESO DENEGADO:** Solo oficiales (Admins) pueden configurar el canal.");
        
        await pool.execute(`INSERT INTO config_canales (guild_id, channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id)`, [guild_id, message.channel.id]);
        return message.channel.send(`✅ **CANAL CONFIGURADO.** A partir de ahora, solo procesaré clips y comandos en este canal: <#${message.channel.id}>.`);
    }

    // --- CHECK DE CANAL ---
    const [rowsConfig] = await pool.execute("SELECT channel_id FROM config_canales WHERE guild_id = ?", [guild_id]);
    
    if (rowsConfig.length > 0) {
        if (rowsConfig[0].channel_id !== message.channel.id) {
            return; // Ignorar otros canales
        }
    }

    // --- LÓGICA NORMAL ---
    const semana = getSemanaActual();
    const esVideo = message.attachments.size > 0 && message.attachments.first().contentType?.startsWith('video/');

    // 1. AYUDA
    if (command === '$comandos' || command === '$comando' || command === '$help') {
        let txt = "**🚀 PROTOCOLO DE COMANDOS**\n\n👤 **Pilotos:**\n`$subir` : Sube tu clip.\n`$puntos` : Ver tu reputación.\n";
        if (message.member.permissions.has('Administrator')) txt += "\n👮‍♂️ **Admins:**\n`$videos` : Iniciar votación.\n`$finalizarvotacion` : Cerrar semana.\n`$setcanal` : Fijar este chat como canal del bot.";
        return message.channel.send(txt);
    }

    // 2. SUBIR
    if ((esVideo) || command === '$subir') {
        let url = esVideo ? message.attachments.first().url : args[0];
        if (!url && command === '$subir') return message.reply("❌ **ERROR:** Falta video o enlace.");
        if (!url) return;

        console.log(`📤 [UPLOAD] Intento de: ${message.author.username}`);

        const [cierres] = await pool.execute("SELECT * FROM cierres WHERE semana_id = ? AND guild_id = ?", [semana, guild_id]);
        if (cierres.length) return message.channel.send("🔒 **SECTOR CERRADO:** Intenta en el próximo ciclo.");

        const [hist] = await pool.execute("SELECT * FROM videos WHERE user_id = ? AND semana_id = ? AND guild_id = ?", [message.author.id, semana, guild_id]);
        if (hist.some(v => v.estado !== 'rechazado')) return message.reply("⛔ **ALERTA:** Ya tienes una transmisión activa.");
        if (hist.length >= 2) return message.reply("⛔ **ALERTA:** Intentos agotados.");

        const msg = await message.reply(`📹 **TRANSMISIÓN RECIBIDA** (Intento ${hist.length + 1}/2). Procesando...`);
        await pool.execute("INSERT INTO videos (user_id, guild_id, url, semana_id, estado, upload_message_id) VALUES (?, ?, ?, ?, 'pendiente', ?)", [message.author.id, guild_id, url, semana, msg.id]);
        await pool.execute("INSERT INTO usuarios (user_id, guild_id, username, puntos) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE username = VALUES(username)", [message.author.id, guild_id, message.author.username]);
        await msg.react('✅'); await msg.react('❌');
    }

    // 3. PUNTOS
    if (command === '$puntos') {
        const [u] = await pool.execute("SELECT puntos FROM usuarios WHERE user_id = ? AND guild_id = ?", [message.author.id, guild_id]);
        return message.reply(`💳 Créditos: **${u.length ? u[0].puntos : 0}** Puntos.`);
    }

    // 4. VIDEOS
    if (command === '$videos') {
        if (!message.member.permissions.has('Administrator')) return;
        const [vids] = await pool.execute("SELECT * FROM videos WHERE semana_id = ? AND guild_id = ? AND estado = 'aprobado'", [semana, guild_id]);
        if (!vids.length) return message.reply("Sin transmisiones aprobadas.");
        
        message.channel.send("**🗳️ INICIANDO PROTOCOLO DE VOTACIÓN**");
        for (const v of vids) {
            const m = await message.channel.send(`🎬 CLIP DE <@${v.user_id}>\n${v.url}`);
            await pool.execute("UPDATE videos SET voting_message_id = ? WHERE id = ?", [m.id, v.id]);
            await m.react('🗳️');
        }
    }

    // 5. FINALIZAR
    if (command === '$finalizarvotacion') {
        if (!message.member.permissions.has('Administrator')) return;
        const [win] = await pool.execute(`SELECT video_id, COUNT(*) as t FROM votos WHERE semana_id = ? AND guild_id = ? GROUP BY video_id ORDER BY t DESC LIMIT 1`, [semana, guild_id]);
        if (!win.length) return message.reply("Nadie votó.");
        
        const [u] = await pool.execute("SELECT user_id FROM videos WHERE id = ?", [win[0].video_id]);
        await pool.execute("UPDATE usuarios SET puntos = puntos + 5 WHERE user_id = ? AND guild_id = ?", [u[0].user_id, guild_id]);
        await pool.execute("INSERT INTO cierres (semana_id, guild_id) VALUES (?, ?)", [semana, guild_id]);
        message.channel.send(`🏆 **TOP 1 DEL VERSO:** <@${u[0].user_id}> con ${win[0].t} votos.`);
    }
});

// REACCIONES
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    const guild_id = reaction.message.guildId;
    const semana = getSemanaActual();

    const [up] = await pool.execute("SELECT * FROM videos WHERE upload_message_id = ? AND guild_id = ?", [reaction.message.id, guild_id]);
    if (up.length) {
        const mem = await reaction.message.guild.members.fetch(user.id);
        if (!mem.permissions.has('Administrator')) return reaction.users.remove(user.id);
        
        const est = reaction.emoji.name === '✅' ? 'aprobado' : (reaction.emoji.name === '❌' ? 'rechazado' : null);
        if (est) {
            await pool.execute("UPDATE videos SET estado = ? WHERE id = ?", [est, up[0].id]);
            if (est === 'aprobado') await pool.execute("UPDATE usuarios SET puntos = puntos + 1 WHERE user_id = ? AND guild_id = ?", [up[0].user_id, guild_id]);
            reaction.message.edit(`${reaction.emoji.name} **${est.toUpperCase()}** por CMD <@${user.id}>`);
            reaction.message.reactions.removeAll();
        }
    }

    const [vot] = await pool.execute("SELECT * FROM videos WHERE voting_message_id = ? AND guild_id = ?", [reaction.message.id, guild_id]);
    if (vot.length && reaction.emoji.name === '🗳️') {
        const [cer] = await pool.execute("SELECT * FROM cierres WHERE semana_id = ? AND guild_id = ?", [semana, guild_id]);
        const [ya] = await pool.execute("SELECT * FROM votos WHERE voter_id = ? AND semana_id = ? AND guild_id = ?", [user.id, semana, guild_id]);
        
        if (cer.length || ya.length) return reaction.users.remove(user.id);
        
        await pool.execute("INSERT INTO votos (voter_id, video_id, semana_id, guild_id) VALUES (?, ?, ?, ?)", [user.id, vot[0].id, semana, guild_id]);
        await pool.execute("INSERT INTO usuarios (user_id, guild_id, username, puntos) VALUES (?, ?, ?, 0) ON DUPLICATE KEY UPDATE username = VALUES(username)", [user.id, guild_id, user.username]);
    }
});

client.login(process.env.BOT_TOKEN);