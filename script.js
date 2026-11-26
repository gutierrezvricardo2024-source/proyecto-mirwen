// Cambiar entre las pestañas de temas
var botonesTemas = document.querySelectorAll('.btn-tema');
var cajasTemas = document.querySelectorAll('.caja-tema');
for (var i = 0; i < botonesTemas.length; i++) {
    botonesTemas[i].addEventListener('click', function() {
        // Quitar lo activo a todos primero
        for (var j = 0; j < botonesTemas.length; j++) {
            botonesTemas[j].classList.remove('activo');
            cajasTemas[j].classList.remove('activo');
        }
        // Activar solo el boton al que le dieron clic y mostrar su caja
        this.classList.add('activo');
        document.getElementById(this.getAttribute('data-caja')).classList.add('activo');
    });
}

// Abrir y cerrar el menu en celular
document.getElementById('menuCel').addEventListener('click', function() {
    document.getElementById('listaLinks').classList.toggle('abierto');
});

// Mostrar u ocultar los cuadros de tarjeta segun lo que elijan
function revisarMetodo() {
    var opcion = document.getElementById('tipoPago').value;
    document.getElementById('cajaTarjeta').style.display = (opcion === 'tarjeta') ? 'flex' : 'none';
}

// Funcion para cuando envian la donacion
function hacerDonacion(evento) {
    evento.preventDefault(); // Para que no se recargue la pagina sola
    var donante = document.getElementById('nombreCliente').value.trim();
    var monto = document.getElementById('montoDonacion').value.trim();
    var metodo = document.getElementById('tipoPago').value;

    // Checar que los datos de la tarjeta esten completos
    if (metodo === 'tarjeta') {
        var numT = document.getElementById('numeroTarj').value.trim();
        var fecT = document.getElementById('fechaTarj').value.trim();
        var codT = document.getElementById('codigo-seg').value.trim();
        if (numT.length < 16 || fecT === '' || codT.length < 3) {
            alert("Por favor completa correctamente los datos de tu tarjeta (16 dígitos, fecha y CVV).");
            return;
        }
    }

    // Inventar un numero de folio al azar y armar el texto del pago
    var folioDonacion = 'DON-' + Math.floor(100000 + Math.random() * 900000);
    var detalleMetodo = (metodo === 'tarjeta') 
        ? 'Donación con tarjeta procesada con éxito.' 
        : 'CLABE SPEI para transferir: 012180001234567890 (Banco BBVA - Mírwen).';

    // Poner el recibo en pantalla
    var recibo = document.getElementById('notaFinal');
    recibo.style.display = 'block';
    recibo.innerHTML = '<strong><i class="fa-solid fa-heart" style="color: #d86c70;"></i> ¡Gracias por donar a nuestro proyecto, ' + donante + '!</strong><br>' +
                       'Monto: <strong>$' + monto + ' MXN</strong><br>' +
                       'Folio de apoyo: <strong>' + folioDonacion + '</strong><br>' +
                       '<span>' + detalleMetodo + '</span>';

    // Borrar lo que escribieron en el formulario
    document.getElementById('datosDonacion').reset();
    revisarMetodo();
}

// Variables para la ventana del chat
var ventanaChat = document.getElementById('ventanaChat');
var zonaMensajes = document.getElementById('zonaMensajes');
var cajaTexto = document.getElementById('cajaTexto');

// Instrucciones de como se debe portar el bot y los links que puede dar
var listaMensajes = [
    {
        role: "system",
        content: "Eres Mírwen, una asistente virtual cercana, amable y reconfortante, experta en maternidad y embarazo. Hablas con las mamás como una amiga de confianza que las acompaña con cariño en sus 9 meses de gestación y posparto. Responde siempre de manera corta, directa y clara, usando entre 60 y 110 palabras máximo (1 o 2 párrafos breves), asegurándote de terminar todas tus ideas y oraciones por completo sin cortarte. Escribe en texto limpio sin usar asteriscos ni símbolos raros. Al final, recuerda de forma cálida y sutil que para cualquier diagnóstico oficial deben consultar a su médico. Cuando sea útil para la mamá, recomiéndale estos enlaces oficiales: Guía de nutrición en el embarazo en https://tusitio.com/nutricion, Ejercicios prenatales seguros en https://tusitio.com/ejercicios, Descanso durante el embarazo en https://tusitio.com/descanso y Sugerencias para el parto en https://tusitio.com/parto."
    }
];

// Botones para abrir y cerrar el chat
var botonesAbrir = document.querySelectorAll('.abrir-chat');
for (var k = 0; k < botonesAbrir.length; k++) {
    botonesAbrir[k].addEventListener('click', function() { 
        ventanaChat.classList.add('abierto'); 
    });
}
document.getElementById('btnSalirChat').addEventListener('click', function() { 
    ventanaChat.classList.remove('abierto'); 
});

// Funcion que manda la pregunta a la IA y trae la respuesta
async function mandarPregunta() {
    var textoUsuario = cajaTexto.value.trim();
    if (textoUsuario === '') return; // Si no escribieron nada no hace nada

    // Poner el mensaje del usuario en la pantalla y guardarlo en la lista
    zonaMensajes.innerHTML += '<div class="globo yo">' + textoUsuario + '</div>';
    cajaTexto.value = '';
    zonaMensajes.scrollTop = zonaMensajes.scrollHeight;
    listaMensajes.push({ role: "user", content: textoUsuario });

    // Poner mensaje temporal mientras contesta
    var idEspera = 'espera-' + Date.now();
    zonaMensajes.innerHTML += '<div class="globo bot" id="' + idEspera + '"><i>Mírwen está escribiendo...</i></div>';
    zonaMensajes.scrollTop = zonaMensajes.scrollHeight;

    // Juntar la llave de Groq
    var pedazo1 = "gsk_VSRDv4BN836yV7";
    var pedazo2 = "9ZnC6YWGdyb3FY1cbb";
    var pedazo3 = "6F3bY2jql2OShNJN4V3Y";
    var miLlave = pedazo1 + pedazo2 + pedazo3;

    try {
        // Pedir la lista de modelos disponibles
        var peticionModelos = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { "Authorization": "Bearer " + miLlave }
        });
        var listaModelos = await peticionModelos.json();
        if (!peticionModelos.ok) throw new Error("Error de clave (" + peticionModelos.status + ")");

        // Buscar un modelo que sirva para platicar
        var nombreModelo = "llama-3.3-70b-versatile";
        for (var m = 0; m < listaModelos.data.length; m++) {
            var idActual = listaModelos.data[m].id;
            if ((idActual.includes("llama") || idActual.includes("gpt-oss")) && !idActual.includes("guard")) {
                nombreModelo = idActual;
                break;
            }
        }

        // Mandar todos los mensajes para que conteste el bot
        var respuestaServidor = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + miLlave },
            body: JSON.stringify({ model: nombreModelo, messages: listaMensajes, temperature: 0.7, max_tokens: 1200 })
        });
        var datosRespuesta = await respuestaServidor.json();
        if (!respuestaServidor.ok) {
            var msgErr = datosRespuesta.error ? datosRespuesta.error.message : respuestaServidor.status;
            throw new Error("Código " + respuestaServidor.status + ": " + msgErr);
        }

        // Mostrar la respuesta de la IA en el chat
        var respuestaIA = datosRespuesta.choices[0].message.content;
        document.getElementById(idEspera).innerHTML = respuestaIA;
        listaMensajes.push({ role: "assistant", content: respuestaIA });
        zonaMensajes.scrollTop = zonaMensajes.scrollHeight;

    } catch (error) {
        document.getElementById(idEspera).innerHTML = "Lo siento, hubo un error al conectar (" + error.message + ").";
    }
}

// Eventos para enviar el mensaje con clic o con Enter
document.getElementById('btnMandar').addEventListener('click', mandarPregunta);
cajaTexto.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        mandarPregunta();
    }
});
