// Cambiar pestanas de la guia
var btns = document.querySelectorAll('.btn-tema');
var cajas = document.querySelectorAll('.caja-tema');
var textoConLinks = respuesta
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#ffd1e5; text-decoration:underline;">$1</a>')
            .replace(/\n/g, '<br>');
for (var i = 0; i < btns.length; i++) {
    btns[i].onclick = function() {
        for (var j = 0; j < btns.length; j++) {
            btns[j].classList.remove('activo');
            cajas[j].classList.remove('activo');
        }
        this.classList.add('activo');
        document.getElementById(this.getAttribute('data-caja')).classList.add('activo');
    };
}

// Menu celular
document.getElementById('menuCel').onclick = function() {
    document.getElementById('listaLinks').classList.toggle('abierto');
};

// Mostrar o esconder lo de la tarjeta
function revisarMetodo() {
    var metodo = document.getElementById('tipoPago').value;
    document.getElementById('cajaTarjeta').style.display = (metodo == 'tarjeta') ? 'flex' : 'none';
}

// Donaciones
function hacerDonacion(e) {
    e.preventDefault();
    var nombre = document.getElementById('nombreCliente').value;
    var monto = document.getElementById('montoDonacion').value;
    var metodo = document.getElementById('tipoPago').value;

    if (metodo == 'tarjeta') {
        var tarj = document.getElementById('numeroTarj').value;
        var fecha = document.getElementById('fechaTarj').value;
        var cvv = document.getElementById('codigo-seg').value;
        if (tarj.length < 16 || fecha == '' || cvv.length < 3) {
            alert("Llena bien los datos de tu tarjeta por favor.");
            return;
        }
    }

    var folio = 'DON-' + Math.floor(Math.random() * 900000 + 100000);
    var info = (metodo == 'tarjeta') ? 'Pago con tarjeta aprobado.' : 'CLABE SPEI: 012180001234567890 (BBVA)';
    var nota = document.getElementById('notaFinal');
    
    nota.style.display = 'block';
    nota.innerHTML = '<b>¡Gracias por tu apoyo, ' + nombre + '!</b><br>Monto: $' + monto + ' MXN<br>Folio: ' + folio + '<br>' + info;
    
    document.getElementById('datosDonacion').reset();
    revisarMetodo();
}

// Chat con IA
var chat = document.getElementById('ventanaChat');
var mensajes = document.getElementById('zonaMensajes');
var input = document.getElementById('cajaTexto');

var historial = [{
    role: "system",
    content: "Eres Mírwen, una asistente virtual amable experta en embarazo. Responde corto y claro (máximo 100 palabras), sin usar asteriscos. Recuerda al final consultar a un médico cuando sea necesario. Cuando recomiendes guías, pon exactamente estos links: https://tusitio.com/nutricion , https://tusitio.com/ejercicios , https://tusitio.com/descanso y https://tusitio.com/parto ."
}];

// Abrir y cerrar ventana del chat
var botonesChat = document.querySelectorAll('.abrir-chat');
for (var k = 0; k < botonesChat.length; k++) {
    botonesChat[k].onclick = function() { chat.classList.add('abierto'); };
}
document.getElementById('btnSalirChat').onclick = function() { chat.classList.remove('abierto'); };

// Enviar mensaje
async function mandarPregunta() {
    var texto = input.value.trim();
    if (texto == '') return;

    mensajes.innerHTML += '<div class="globo yo">' + texto + '</div>';
    input.value = '';
    historial.push({ role: "user", content: texto });

    var idCarga = 'carga' + Date.now();
    mensajes.innerHTML += '<div class="globo bot" id="' + idCarga + '">Escribiendo...</div>';
    mensajes.scrollTop = mensajes.scrollHeight;

    var llave = "gsk_VSRDv4BN836yV7" + "9ZnC6YWGdyb3FY1cbb" + "6F3bY2jql2OShNJN4V3Y";

    try {
        // 1. Buscar un modelo activo automaticamente
        var resMod = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { "Authorization": "Bearer " + llave }
        });
        var dataMod = await resMod.json();
        if (!resMod.ok) throw new Error("Clave inválida (" + resMod.status + ")");

        var modeloActivo = "llama-3.3-70b-versatile";
        for (var m = 0; m < dataMod.data.length; m++) {
            var id = dataMod.data[m].id;
            if ((id.includes("llama") || id.includes("gpt-oss")) && !id.includes("guard")) {
                modeloActivo = id;
                break;
            }
        }

        // 2. Pedir respuesta al modelo
        var res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + llave },
            body: JSON.stringify({ model: modeloActivo, messages: historial, max_tokens: 500 })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error ? data.error.message : "Error " + res.status);

        var respuesta = data.choices[0].message.content;

        // Hacer que los links se puedan cliquear y respetar saltos de linea
        var textoConLinks = respuesta
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" style="color:#ffd1e5; text-decoration:underline;">$1</a>')
            .replace(/\n/g, '<br>');

        document.getElementById(idCarga).innerHTML = textoConLinks;
        historial.push({ role: "assistant", content: respuesta });
        mensajes.scrollTop = mensajes.scrollHeight;
    } catch (err) {
        document.getElementById(idCarga).innerHTML = "No se pudo conectar: " + err.message;
    }
}

document.getElementById('btnMandar').onclick = mandarPregunta;
input.onkeypress = function(e) { if (e.key == 'Enter') mandarPregunta(); };
