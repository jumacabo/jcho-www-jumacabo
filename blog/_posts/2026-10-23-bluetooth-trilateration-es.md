---
title: "Mi casa sabe en qué rincón estoy"
description: "21 proxies Bluetooth, el modelo 3D de la casa y un motor propio: Home Assistant sabe dónde está cada uno con un margen de metro y medio, y sin Bermuda."
tags: [home-assistant, bluetooth, presence, esphome, 3d, ai]
cover: /blog/media/bluetooth-trilateration/cover.jpg
# Original en español de bluetooth-trilateration (la versión publicada es la inglesa). No se publica: solo se guarda como referencia.
published: false
---

**TL;DR:** Home Assistant ya no solo sabe en qué habitación está cada uno: sabe en qué punto, con un margen de metro y medio. Y yo lo veo en directo en la casa 3D.

- Con Bermuda, cuantos más proxies Bluetooth ponía, peor iba: la gente saltaba de una habitación a otra, y hasta de una planta a otra.
- Como ya tenía la casa en 3D, con cada pared, cada forjado y los 21 proxies en su sitio real, hice mi propio motor. Calcula qué señal debería oír cada proxy desde cada punto de la casa y la compara con la que oye de verdad.
- Se le puede enseñar: te quedas un rato en un sitio con el móvil y aprende cómo se oye allí.
- Lee el Bluetooth con una integración propia de Home Assistant. No depende de Bermuda para nada.
- Publica en Home Assistant el área, la planta, la confianza y las coordenadas X, Y, Z de cada persona, y la casa 3D las dibuja.
- Todo corre en casa, en Docker. La base la hice en dos días, con IA.

Mientras preparo las capturas de este artículo, estoy en el despacho, en el sótano. En la casa 3D, mi círculo está junto a la mesa, y de él salen unas líneas discontinuas hacia los proxies Bluetooth que más han pesado para situarme ahí: el Atom Echo del despacho, un 25 %; el enchufe de las estanterías de LEGO, un 14 %… Arriba, Ruth está en el salón. Si se levanta y va a la cocina, unos segundos después su círculo se desliza hasta allí.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/casa3d-ondas.webp" alt="Animated view of the office in the 3D house: blue waves pulse from the Bluetooth proxies and dashed lines link the person at his desk to the proxies that weigh most in locating him, with their percentage" loading="lazy"><figcaption>Mi despacho en la casa 3D, en directo, con las ondas de los proxies Bluetooth.</figcaption></figure>

## Saber la habitación no bastaba

En el [artículo de la casa 3D](/blog/home-assistant-3d-house/) conté que sabía en qué habitación estaba cada uno gracias a [Bermuda BLE Trilateration](https://github.com/agittins/bermuda), una integración de Home Assistant muy popular. Tres días después de publicarlo, eso dejó de ser verdad.

Bermuda escucha el Bluetooth de los móviles a través de los proxies de Home Assistant: aparatos repartidos por la casa que oyen las señales Bluetooth de alrededor y se las pasan. Yo empecé con cuatro [Atom Echo](https://docs.m5stack.com/en/atom/atomecho), unos ESP32 diminutos con ESPHome, y funcionaba razonablemente bien. La lógica decía que, con más proxies, iría mejor. Así que activé más.

Fue peor. La gente no paraba de saltar de un sitio a otro. El caso más claro era el salón: tiene un proxy y, justo encima, el dormitorio tiene otro, con un forjado en medio. Sentado en el sofá, yo pasaba de la planta baja a la primera y vuelta.

La pregunta era de cajón: si se llama *BLE Trilateration*, ¿cómo no va a trilaterar? Pues no lo hace. Lo dice su propio README: localiza por habitación, y lo de calcular la posición en un mapa queda para más adelante: *«(eventually) Triangulate device positions! Like, on a map. Maybe.»* Para decidir la habitación, Bermuda se queda con el proxy que parece más cercano, con un pequeño margen antes de cambiar. No combina lo que oyen los demás, ni sabe que entre dos plantas hay un forjado. Y con muchos proxies, cada uno es como un boleto de lotería: casi siempre hay alguno al que un pico de ruido le hace ganar. Por eso, cuantos más ponía, peor.

Que conste: Bermuda es un proyecto estupendo y me ha servido mucho. Con él empecé y con él comparé. Pero yo quería otra cosa:

- **No solo la habitación, también el punto:** coordenadas X, Y, Z dentro de la casa.
- **Sin saltos,** y sobre todo sin saltos de planta.
- **Con su confianza:** saber cuándo está seguro y cuándo duda.
- **Que la casa 3D pudiera dibujar a cada uno donde está,** no en un sitio fijo de su habitación.

## Cómo funciona, de un vistazo

Antes de entrar en detalle, el recorrido completo, de la casa en Blender a cada persona en su sitio:

<figure class="cs-dg-fig">
<div class="cs-dg">
<div class="cs-ph" style="--c:#dd6b3d">
<div class="cs-phh"><span class="cs-num">1</span><b>Preparar la casa</b><span>una vez, y cada vez que cambia</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M12 2.5 3.5 7v10l8.5 4.5 8.5-4.5V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/></svg></span><b>La casa en Blender</b><small>Paredes, forjados, muebles y los 21 proxies en su sitio</small><span class="cs-chips"><span>Blender</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg></span><b>El exportador</b><small>Plantas, salas, puertas, escaleras y lo que tapa la señal</small><span class="cs-chips"><span>Python</span><span>bpy</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/></svg></span><b>La malla y la tabla</b><small>Un punto cada 50 cm y, por proxy y punto, lo que hay en medio</small><span class="cs-chips"><span>NumPy</span></span></div>
</div>
</div>
<div class="cs-join" style="--c1:#dd6b3d;--c2:#7465f6"><span>se carga en el motor</span></div>
<div class="cs-ph" style="--c:#7465f6">
<div class="cs-phh"><span class="cs-num">2</span><b>Escuchar</b><span>sin parar</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="m7 7 10 10-5 5V2l5 5L7 17"/></svg></span><b>Los 21 proxies</b><small>14 Shelly y 7 Atom Echo oyen el Bluetooth de los móviles</small><span class="cs-chips"><span>ESPHome</span><span>Shelly</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card cs-cerebro"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 9.5V20h13V9.5"/><circle cx="12" cy="13.2" r="1.7"/><path d="M12 15v2.6M10.4 12.3 8.6 11M13.6 12.3l1.8-1.3"/><circle cx="8" cy="10.6" r=".9"/><circle cx="16" cy="10.6" r=".9"/><circle cx="12" cy="18.3" r=".9"/></svg></span><b>Home Assistant</b><small>Reconoce cada iPhone con su IRK, que nunca sale de ahí</small><span class="cs-chips"><span>Private BLE Device</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M9 2.5v5M15 2.5v5M6 7.5h12v4a6 6 0 0 1-12 0zM12 17.5v4"/></svg></span><b>La integración</b><small>Cada segundo, lo que oye cada proxy, con un seudónimo</small><span class="cs-chips"><span>jcho_trilateration</span></span></div>
</div>
</div>
<div class="cs-join" style="--c1:#7465f6;--c2:#0ea5e9"><span>lecturas</span></div>
<div class="cs-ph" style="--c:#0ea5e9">
<div class="cs-phh"><span class="cs-num">3</span><b>Situar y publicar</b><span>cada segundo</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/></svg></span><b>El motor</b><small>La nube de probabilidad, el entrenamiento y el histórico</small><span class="cs-chips"><span>Python</span><span>Docker</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.8"/></svg></span><b>MQTT</b><small>Área, planta, confianza, X, Y, Z y proxies clave</small><span class="cs-chips"><span>MQTT</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card cs-cerebro"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 9.5V20h13V9.5"/><circle cx="12" cy="13.2" r="1.7"/><path d="M12 15v2.6M10.4 12.3 8.6 11M13.6 12.3l1.8-1.3"/><circle cx="8" cy="10.6" r=".9"/><circle cx="16" cy="10.6" r=".9"/><circle cx="12" cy="18.3" r=".9"/></svg></span><b>Home Assistant</b><small>Entidades por persona, listas para automatizar</small><span class="cs-chips"><span>sensor</span></span></div>
</div>
<div class="cs-out">
<span class="cs-outl"><span>se ve en</span></span>
<div class="cs-card cs-mini"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12.5" rx="2.5"/><path d="M8.5 20.5h7M12 16.5v4"/><path d="m12 6.8 3 1.6v3.2l-3 1.6-3-1.6V8.4zM9 8.4l3 1.6 3-1.6M12 10v3.2"/></svg></span><div><b>La casa 3D</b><small>Cada persona en su sitio, con sus líneas a los proxies</small></div></div>
<div class="cs-card cs-mini"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3.5 20.5h17M6.5 16l4-5 3.5 3 5-7"/></svg></span><div><b>La web del motor</b><small>El plano con la nube, las señales y el entrenamiento</small></div></div>
</div>
</div>
</div>
<figcaption>Qué hace cada pieza. Las secciones siguientes las cuentan una a una.</figcaption>
</figure>

<details markdown="1">
<summary>Para los técnicos: las tecnologías</summary>

- **Exportador:** Blender 5.2 como módulo de Python (`bpy`) dentro de un contenedor, con Shapely para los contornos. Genera la casa en JSON, una geometría ligera en GLB y la tabla de propagación en NumPy.
- **Motor:** Python con asyncio: aiohttp para la API y la web, aiomqtt para MQTT, NumPy para el filtro y Pydantic para validar la configuración.
- **Integración:** una integración personalizada de Home Assistant con un comando de WebSocket propio y pruebas con `pytest-homeassistant-custom-component`, fijado a la versión de Home Assistant.
- **Web:** React 19 con Vite y uPlot para las gráficas, en vivo por Server-Sent Events y servida por el propio motor.
- **Datos:** las lecturas en bruto, en JSONL diarios; el histórico, en SQLite; lo aprendido, en JSON aparte. La configuración, en un único YAML.
- **Despliegue:** Docker en un servidor de casa, detrás de un proxy inverso con autenticación.

</details>

## La ventaja: la casa ya estaba en 3D

Para calcular dónde está alguien a partir de lo que oye cada proxy hacen falta dos cosas: saber dónde está cada proxy y saber qué hay entre medias. Y eso yo ya lo tenía.

La casa 3D sale de unos scripts de Python que construyen el modelo de Blender desde cero, así que el modelo sabe dónde está cada pared, cada forjado, cada puerta, cada escalera y cada mueble, y hasta los falsos techos. Solo le faltaban los proxies. Los añadí en su sitio de verdad: los enchufes inteligentes en su enchufe, los relés en el falso techo y los Atom Echo colgando de su cable USB o apoyados en una balda.

En total, 21: 14 Shelly y 7 Atom Echo, repartidos por las cuatro plantas. Y aquí va un detalle que me encanta: **los 14 Shelly ya estaban en casa haciendo otra cosa.** Encienden luces, suben persianas, abren el portón o miden lo que gasta la caldera. Con activarles el Bluetooth, hacen de proxy sin coste.

Un exportador abre el archivo de Blender (con Blender dentro de un contenedor) y saca de él lo que necesita el motor:

- **Las plantas y las salas,** con sus contornos, ya ligadas a las plantas y áreas de Home Assistant.
- **Las puertas,** con las salas que unen, **y las escaleras,** con las plantas que unen.
- **Los proxies,** con su posición y su altura.
- **Lo que tapa la señal:** paredes, forjados, puertas y ventanas, pero también la nevera, el horno, los espejos, las teles o los armarios.

Con eso genera una malla de puntos cada 50 cm, solo por donde se puede andar, y una tabla: para cada proxy y cada punto, la distancia y todo lo que hay en medio. Es el mapa del que parte todo lo demás.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/modelo-resumen.webp" alt="Model tab of the engine web: the exported Blender file with its counts of floors, rooms, connections, stairs, openings, proxies, RF objects and furniture, and the table of floors with their heights" loading="lazy"><figcaption>Lo que el motor sabe de la casa, sacado del archivo de Blender: 4 plantas, 22 salas, 29 conexiones, 3 escaleras, 42 puertas y ventanas, 21 proxies, 41 objetos que tapan la señal y 175 muebles.</figcaption></figure>

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/modelo-proxies.webp" alt="Table of the Bluetooth proxies in the model with their hardware, mounting, floor, room, height and position" loading="lazy"><figcaption>Cada proxy, con su modelo, cómo va montado (USB, enchufe o caja), su planta, su habitación, su altura y su posición.</figcaption></figure>

## Primero, buenos datos

Antes de pensar en algoritmos, miré qué llegaba. Y llegaba poquísimo: de cada persona, entre 15 y 18 lecturas por minuto, y solo la oían 3 proxies. Con eso no hay algoritmo que valga.

Lo arreglaron dos ajustes:

- **ESPHome (los Atom Echo): escuchar el 100 % del tiempo.** Los míos escuchaban 30 ms de cada 320 ms, un 9 % del tiempo, que era el valor por defecto en su versión. En las versiones recientes de ESPHome ya viene al 100 % en los aparatos con Wi-Fi, pero conviene comprobarlo:

  ```yaml
  esp32_ble_tracker:
    scan_parameters:
      interval: 320ms
      window: 320ms
  ```

- **Shelly Gen2 y posteriores: el escáner Bluetooth en modo «Auto».** Se cambia en Home Assistant, en las opciones de cada Shelly (*Bluetooth scanner mode*).

Resultado: cada persona pasó de 15–18 a unas 250 lecturas por minuto, y de 3 a 14 proxies que la oyen. Hoy, con los 21, a veces la oyen todos y llegan más de 500 lecturas por minuto. **Si usas Bermuda, este consejo también te vale.**

Tampoco oyen todos igual. Con lecturas reales salió que un Shelly Plus 2PM oye unos 12 dB menos que un Atom Echo a la misma distancia, así que el motor corrige cada proxy según su modelo.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/web-personas.webp" alt="For each phone, the list of proxies that hear it, from strongest to weakest, with signal strength and readings per minute" loading="lazy"><figcaption>Lo que oye cada proxy de cada móvil, del más fuerte al más débil. A mí me oyen 17; a Ruth, los 21.</figcaption></figure>

## Del ruido a una posición

Esto es lo que llega:

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/web-rssi.webp" alt="Chart of the Bluetooth signal strength of one phone at 21 proxies over an hour, with lines jumping 10 to 20 dB all the time" loading="lazy"><figcaption>La señal de mi iPhone en cada uno de los 21 proxies durante una hora. Cada línea es un proxy.</figcaption></figure>

Las líneas bailan 10 o 20 dB de un segundo a otro aunque no te muevas: el cuerpo tapa, la señal rebota, el móvil cambia de postura. Intentar sacar de ahí la distancia a cada proxy y cruzar círculos, como en los libros, no funciona.

Así que el motor le da la vuelta a la pregunta. No se pregunta «¿a qué distancia estoy de cada proxy?», sino, para cada punto de la casa: **«si estuviera aquí, ¿qué debería oír cada proxy?»**. Y se queda con los puntos en los que lo que debería oír se parece más a lo que oye.

La señal esperada sale de la física de siempre y de lo que dice el modelo 3D:

<div class="cs-form">
<span class="cs-t"><b>Señal del móvil</b><small>a 1 metro</small></span>
<i>+</i>
<span class="cs-t"><b>Corrección</b><small>del proxy</small></span>
<i>−</i>
<span class="cs-t"><b>Distancia</b><small>10 · n · log₁₀ d</small></span>
<i>−</i>
<span class="cs-t"><b>Paredes</b><small>≈ 2 dB cada una</small></span>
<i>−</i>
<span class="cs-t"><b>Forjados</b><small>≈ 7 dB cada uno</small></span>
<i>−</i>
<span class="cs-t"><b>Muebles y aparatos</b><small>≈ 3 dB</small></span>
<i>=</i>
<span class="cs-t cs-res"><b>Señal esperada</b><small>en ese proxy</small></span>
</div>

Los valores salieron de lecturas reales de mi casa, y hubo sorpresas. La teoría dice que un forjado se come unos 20 dB; aquí, unos 7. Y lo que cuenta es cuántas paredes cruzas, no lo gruesas que son.

### Un segundo en la vida del motor

El resultado no es un punto, sino una nube: la probabilidad de que la persona esté en cada punto de la malla. Cada segundo, el motor la actualiza en cuatro pasos:

<div class="cs-dg cs-pasos-fig">
<div class="cs-pasos" style="--c:#7465f6">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg></span><b><span class="cs-n">1</span>Moverse</b><small>La nube se reparte a los puntos vecinos según lo rápido que se puede andar. Para cambiar de planta hay que pasar por la escalera: se acabaron los saltos.</small></div>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.8"/></svg></span><b><span class="cs-n">2</span>Escuchar</b><small>Compara lo que ha oído cada proxy en los últimos segundos con lo que debería oír desde cada punto. Ganan los puntos que encajan.</small></div>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4-2.4M19 12.9a10 10 0 0 0-3-2M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 11 5"/><circle cx="12" cy="20" r=".9"/></svg></span><b><span class="cs-n">3</span>Echar de menos</b><small>Si un proxy que debería oírte no te oye, la zona de alrededor pierde probabilidad. El silencio también informa.</small></div>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h12l-2.5 4.5L17 13H5"/></svg></span><b><span class="cs-n">4</span>Decidir</b><small>El área solo cambia en Home Assistant si la nueva llega al 60 %, saca 15 puntos a la actual y lo mantiene 8 segundos.</small></div>
</div>
</div>

Dentro de la habitación, el punto exacto sale de la señal acumulada del último minuto: si estás quieto, se va afinando; si te mueves, tarda un poco en seguirte.

<figure class="cs-video"><video controls autoplay muted loop playsinline preload="metadata" poster="/blog/media/bluetooth-trilateration/recorrido.jpg" src="/blog/media/bluetooth-trilateration/recorrido.mp4" aria-label="Basement floor plan: the person's dot and probability cloud follow him from a corner of the garage to his desk in the office, with dashed lines to the key proxies"></video><figcaption>Del garaje a mi escritorio: el punto me sigue por el plano, con su nube y sus líneas a los proxies clave. Va acelerado: en realidad fueron unos dos minutos y medio, casi todos con el punto afinándose ya dentro del despacho.</figcaption></figure>

Esas líneas son los **proxies clave**: los cuatro que más pesan para que el motor te sitúe aquí y no en otro sitio. Y no son necesariamente los que más fuerte te oyen. Cuando estoy en el despacho, uno de los míos es el del dormitorio, dos plantas más arriba: apenas me oye, y precisamente por eso ayuda a descartar que esté allí.

Una nota para puristas: técnicamente esto no es la trilateración de los libros, sino un filtro bayesiano sobre una malla. Pero hace lo que uno espera al oír la palabra: usar a la vez lo que oyen todos los proxies para sacar una posición.

<details markdown="1">
<summary>Para los técnicos: el modelo, en detalle</summary>

- **Propagación:** modelo log-distancia con exponente 2,4 y pérdida por cada cruce con cada tipo de obstáculo (pared, forjado, escalera, tejado, carpintería, puerta, ventana, metal, espejo, pantalla, sanitario, madera). Las distancias y los cruces de cada proxy a cada punto se precalculan al exportar.
- **Correcciones en cascada:** cada proxy hereda los valores por defecto, luego los de su modelo de hardware y, si hace falta, los suyos propios.
- **Lecturas:** mediana de los últimos 3 s por proxy, con una verosimilitud robusta que tolera lecturas absurdas y «suavizada», porque lecturas seguidas no son independientes: mismo cuerpo, mismos rebotes.
- **Movimiento:** por las aristas de la malla, con velocidad máxima de 1,5 m/s y pesos simétricos (Metropolis), y una pequeña probabilidad de «aparecer» en cualquier punto para recuperarse de errores.
- **Ausencias:** un proxy vivo que lleva 15 s sin oír a la persona penaliza los puntos donde se esperaría oírla con más de −88 dBm.
- **Nivel del móvil:** en cada punto se estima un desplazamiento común del móvil en todos los proxies; así cuenta el reparto de la señal entre proxies, no su nivel absoluto.
- **Decisión:** histéresis por probabilidad mínima, margen y permanencia antes de publicar un cambio de área.

</details>

## Enseñarle la casa: el entrenamiento

El modelo físico es un buen punto de partida, pero cada casa tiene sus manías: un espejo, un armario empotrado, una nevera justo en medio. Para eso está el entrenamiento.

En la web del motor eliges persona, habitación (o pulsas en el plano el punto exacto donde vas a estar) y cuánto tiempo; por defecto, 10 minutos. Pulsas *Empezar* y te quedas allí con el móvil como lo llevas siempre. Mientras dura, ves cuánto acierta y, si elegiste un punto exacto, el error en metros.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/entrenamiento.webp" alt="Training form: person, room, minutes and an exact point picked on the floor plan" loading="lazy"><figcaption>El formulario: persona, habitación, minutos y, en este caso, un punto exacto del salón pulsado en el plano.</figcaption></figure>

<figure class="cs-par">
<div><img src="/blog/media/bluetooth-trilateration/entrenamiento-plano.webp" alt="Ground floor plan with a crosshair marking the exact point chosen for training, next to the person" loading="lazy"><img src="/blog/media/bluetooth-trilateration/sesiones-plano.webp" alt="Ground floor plan with the trained points drawn as diamonds and one past session highlighted" loading="lazy"></div>
<figcaption>A la izquierda, el punto elegido para entrenar, con su punto de mira. A la derecha, los puntos ya entrenados de esa planta, como rombos, con una sesión de Ruth resaltada.</figcaption>
</figure>

Con lo aprendido hace dos cosas:

- **Recalibra el modelo.** Con todas las sesiones, ajusta por mínimos cuadrados la corrección de cada proxy, la de cada móvil, la de cada tipo de obstáculo y la pérdida por distancia. Todo atado a los valores de partida: con pocos datos, apenas se mueven. Lo que aún no cuadra en una habitación queda como un pequeño ajuste para esa habitación y ese proxy.
- **Guarda referencias.** Cada sesión en un punto exacto se convierte en una huella: en ese punto, el motor espera justo la señal que midió allí, y hasta metro y medio alrededor la mezcla con la calculada. Así reconoce ese sitio aunque la física no lo explique. También recuerda qué proxies no te oían allí.

En mi casa, 7 sesiones bajaron la diferencia media entre la señal medida y la esperada de 6,7 a 3,4 dB. Y en un punto entrenado de Ruth, recordar qué proxies no la oyen bajó el error medio de 0,74 a 0,59 m.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/sesiones.webp" alt="List of the seven saved training sessions with date, person, room, minutes and accuracy; all of them exact points used as active references" loading="lazy"><figcaption>Las 7 sesiones guardadas, todas en un punto exacto y todas como referencia activa. El acierto es el que tenía el motor durante la sesión.</figcaption></figure>

Mi consejo: entrena primero lo que más se confunde, como las habitaciones que están una encima de otra, y luego un par de minutos en los sitios de siempre: el sofá, la mesa, la cama.

## ¿Cómo de preciso es?

### Frente a Bermuda

Un día por la tarde, durante hora y media, Bermuda y mi motor funcionaron a la vez con las mismas lecturas, y el motor fue guardando lo que decía cada uno. Mi motor aún no tenía ni una sesión de entrenamiento.

| Por hora | Bermuda | Mi motor |
|---|---|---|
| Cambios de habitación, yo | 38,4 | 6,8 |
| Saltos de planta, yo | 15,5 | 1,9 |
| Cambios de habitación, Ruth | 78,6 | 1,9 |

Y en total, entre los dos, Bermuda nos puso 157 veces en una habitación durante menos de 30 segundos; mi motor, 2.

Lo curioso es que la mayor parte del tiempo coincidían en la habitación: un 88 % del tiempo conmigo y un 77 % con Ruth. Bermuda no se equivocaba tanto de sitio: lo que hacía era saltar. Conmigo cambiaba de habitación cada minuto y medio y, con Ruth, cada 45 segundos.

### La habitación y el punto

Nadie en casa va apuntando dónde está en cada momento, así que usé como testigos los demás sensores de Home Assistant: los de presencia y las cámaras de interior, que con [Frigate](https://github.com/blakeblackshear/frigate) detectan personas. Con el motor tal como está hoy:

- **En el despacho, 97 %.** En los ratos en que estaba solo en casa y el sensor de presencia del despacho me detectaba, el motor me tenía allí el 97 % de 6,7 horas.
- **En el salón, 98 %.** Mientras la cámara del salón veía a alguien, el motor tenía allí a uno de los dos el 98 % de 19,5 horas.
- **La planta, más del 90 %.** Y cuando cualquier cámara de interior veía a alguien, 34 horas en total, el motor tenía a uno de los dos en esa planta más del 90 % del tiempo.

Para el punto dentro de la habitación sí tengo una verdad exacta: los 7 sitios donde entrené, marcados en el plano al centímetro. Volví a pasar esas sesiones por el motor de hoy, pero sin el entrenamiento, como si fueran sitios nuevos:

- **En 4 de los 7, el error medio queda entre 1 y 1,3 m.** Tres son del despacho y uno, del salón.
- **En los otros 3, entre 2 y 3 m.** Son justo los que entrené porque ahí fallaba: dos sitios del salón y el hall del sótano.
- **Con un punto ya entrenado, baja a unos 60 cm.** En el de Ruth, el error medio es de 0,59 m, y 9 de cada 10 veces está a menos de 0,82 m.

En resumen: alrededor de metro y medio en un sitio cualquiera, y bastante menos en los que le has enseñado.

Lo mejor es que no tengo que fiarme de mi impresión. El motor graba todas las lecturas y puede volver a pasar cualquier rato con otros ajustes: le digo «de tal a tal hora yo estaba en el despacho» y me dice cuánto acierta. Cada cambio del motor lo pruebo así contra días reales antes de ponerlo en marcha.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/web-areas.webp" alt="Timeline of the areas the engine assigned to one person over an hour, with seven area changes" loading="lazy"><figcaption>Una hora mía según el motor, habitación a habitación: 7 cambios.</figcaption></figure>

Para entender por qué el motor decide lo que decide, su web enseña, para cada persona y proxy a proxy, la señal que llega frente a la que esperaba en el punto más probable, y marca los proxies que deberían oírla y no la oyen.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/web-posicion.webp" alt="Position tab of the engine web: training summary, basement floor plan and one card per person with area, coordinates, key proxies and measured versus expected signal" loading="lazy"><figcaption>La pestaña Posición. Arriba, el resumen del entrenamiento. Debajo, el plano y la tarjeta de cada persona: su área, su posición, sus proxies clave y la señal medida frente a la esperada; en naranja, los proxies que deberían oírla y no la oyen.</figcaption></figure>

## Mi propia integración de Home Assistant

Al principio, el motor sacaba las lecturas de Bermuda: tiene un servicio, `bermuda.dump_devices`, que devuelve lo que oye cada proxy de cada móvil. Y la verdad es que hacer una integración propia no me convencía: prefería no tocar Home Assistant. Acabé haciéndola el mismo día.

¿Por qué? Home Assistant guarda, para cada proxy, el último anuncio Bluetooth de cada aparato. Pero hacia fuera solo ofrece el del proxy que mejor oye a cada uno, y para situar a alguien hace falta lo que oyen todos. Bermuda lo resuelve siendo una integración que vive dentro de Home Assistant. Así que hice lo mismo: `jcho_trilateration`.

- **Qué hace:** cada segundo revisa todos los proxies y le manda al motor lo nuevo de cada móvil que sigue: la hora, el móvil, el proxy y la señal.
- **Cómo:** el motor se suscribe con un comando del WebSocket de Home Assistant, solo para administradores. Si no hay motor conectado, la integración no hace nada. Solo usa API públicas de Home Assistant, no tiene opciones y no crea entidades.
- **Privacidad:** los iPhone cambian su dirección Bluetooth cada poco, y Home Assistant los reconoce con su IRK, una clave del propio móvil, gracias a [Private BLE Device](https://www.home-assistant.io/integrations/private_ble_device/). La IRK nunca sale de Home Assistant: al motor solo le llega un seudónimo.

Antes de quitar Bermuda, tuve las dos funcionando a la vez: en 3 minutos, Bermuda entregó 2.493 lecturas y mi integración, 2.523. Lo desinstalé, y hoy el sistema no depende de Bermuda para nada.

Lo que más me preocupaba era el mantenimiento: que una actualización de Home Assistant la rompiera. Sus pruebas automáticas usan la versión exacta de Home Assistant y fallan si la integración usa algo que Home Assistant ha marcado como obsoleto, cosa que avisa con meses de margen. Antes de actualizar Home Assistant, paso las pruebas con la versión nueva.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/ha-integracion.webp" alt="The Jcho-Trilateration custom integration in Home Assistant, version 1.1.0, with its brand icon" loading="lazy"><figcaption>La integración en Home Assistant, con el mismo icono que la web del motor. No tiene opciones ni entidades: solo le pasa las lecturas al motor.</figcaption></figure>

## Lo que llega a Home Assistant

El motor publica en Home Assistant por MQTT, con descubrimiento automático. Por cada persona aparece un dispositivo, «Trilateración Juancho», con estas entidades:

| Entidad | Qué dice |
|---|---|
| `sensor.trilateracion_juancho_area` | El área de Home Assistant en la que está. En sus atributos, las candidatas con su probabilidad |
| `sensor.trilateracion_juancho_planta` | La planta |
| `sensor.trilateracion_juancho_confianza` | Lo seguro que está, en % |
| `sensor.trilateracion_juancho_x`, `_y`, `_z` | La posición, en metros, con los mismos ejes que la casa 3D |
| `sensor.trilateracion_juancho_proxies_clave` | Los cuatro proxies que más pesan para situarlo, con su peso |

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/ha-dispositivo.webp" alt="The Home Assistant device for one person, published by the engine over MQTT, with sensors for area, confidence, floor, key proxies and X, Y, Z position" loading="lazy"><figcaption>Mi dispositivo en Home Assistant, tal como lo publica el motor por MQTT: el área, la confianza, la planta, los proxies clave y la posición. A la izquierda, la automatización que copia el área para el resto de la casa.</figcaption></figure>

Además, un dispositivo de diagnóstico dice si el motor está conectado, cuántos proxies están activos y cuántas lecturas llegan por minuto.

Para no llenar el histórico de Home Assistant, la posición solo se vuelve a publicar si te mueves al menos 25 cm o la confianza cambia 5 puntos, y como mucho cada 5 segundos. Un cambio de habitación o de planta, en cambio, se publica al momento. Aun así, yo dejo casi todas fuera del histórico de Home Assistant, porque el motor ya guarda el suyo:

```yaml
recorder:
  exclude:
    entity_globs:
      - sensor.trilateracion_*_area
      - sensor.trilateracion_*_x
      - sensor.trilateracion_*_y
      - sensor.trilateracion_*_z
      - sensor.trilateracion_*_confianza
      - sensor.trilateracion_*_proxies_clave
      - sensor.trilateracion_lecturas_por_minuto
```

### Lo que hago con ellas

No hay grandes automatizaciones, sino muchas pequeñas que dependen de saber dónde estamos. Y casi todas son anteriores al motor: solo cambié de dónde sale el área.

- **Los aires acondicionados se apagan solos si nadie usa su planta.** Para saber si una planta está en uso, Home Assistant junta los móviles que el motor sitúa en ella con el movimiento, las teles y las luces. Si una planta lleva 15 o 20 minutos vacía y su aire lleva al menos una hora encendido, lo apaga.
- **Las luces decorativas de la planta baja.** El árbol de Navidad se enciende cuando alguien lleva unos minutos abajo y se apaga cuando ya no queda nadie. La lámpara de la piña y la luz del comedor, a las dos de la madrugada, solo se apagan si no queda nadie abajo.
- **El panel de casa** dice en qué habitación está cada uno.
- **Assist lo sabe:** le puedo preguntar si hay alguien en la planta baja.
- **Si el motor se para,** Home Assistant recarga la integración y, si sigue sin funcionar, me avisa en el móvil.

## En la casa 3D

Y aquí se junta todo. La casa 3D lee esas entidades y pone a cada persona, un círculo con su foto de Home Assistant, en sus coordenadas y a su altura. Si se mueve por la planta, el círculo se desliza; si dos personas están cerca, se ponen una al lado de la otra; y en la escalera aparece en la planta que le toca por su altura.

Con «Mostrar → Proxies de Bluetooth», además:

- **Cada proxy en su sitio,** emitiendo ondas azules, tapadas por lo que las tapa.
- **De cada persona salen líneas** discontinuas de su color a sus proxies clave, más gruesas cuanto más pesan y con su porcentaje en medio.
- **Un panel del Bluetooth:** si el motor funciona, cuántos proxies llegan, cuántas personas están situadas y cuántas lecturas por minuto, con la lista de proxies por plantas. Un clic en uno te lleva hasta él.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/casa3d-planta-baja.webp" alt="The ground floor of the 3D house with its Bluetooth proxies emitting waves, dashed lines from a person to the proxies that weigh most in locating her, with their percentage, and the Bluetooth panel" loading="lazy"><figcaption>La planta baja, con sus siete proxies en su sitio real y las líneas de Ruth a los que más pesan para situarla.</figcaption></figure>

## Hecha con IA

Como la casa 3D, esto lo hice con agentes de IA en [GitHub Copilot](https://github.com/features/copilot), pero esta vez con un solo modelo: **Claude Opus 5.5**.

Las reglas, parecidas a las de la casa 3D:

- **Nada escrito a fuego.** Cada valor, en el archivo de configuración. Y si falta uno o sobra alguno desconocido, el servicio no arranca y dice exactamente qué falla.
- **Los secretos, aparte.** El token de Home Assistant va en su propio archivo, nunca en el código ni en los logs.
- **El servidor no se toca.** Todo corre en contenedores: las pruebas, la web y hasta Blender.
- **Pruebas deterministas.** Nada de esperas ni de pruebas que fallan a veces.
- **Antes de un cambio grande, el plan.** Que me lo expliquen y esperen mi visto bueno.

<div class="cs-cifras">
<div><b>2</b><span>días para la base</span></div>
<div><b>37</b><span>commits</span></div>
<div><b>135</b><span>pruebas automáticas</span></div>
<div><b>21</b><span>proxies Bluetooth</span></div>
</div>

## Lo que costó, y lo que aún falla

- **El móvil en el bolsillo.** Si cambias cómo lo llevas (en el bolsillo, boca abajo, bajo una manta), todos los proxies lo oyen más flojo a la vez, y el motor lo leía como «se ha alejado de todos». Ruth saltaba del salón a su terraza. Ahora el motor estima cuánto ha cambiado el móvil en conjunto y se fija en cómo se reparte la señal entre proxies. Con Ruth sentada en el salón, pasó de acertar el 82,9 % del tiempo al 99,7 %. Aun así, sigue siendo lo más difícil.
- **La buhardilla fantasma.** Cuando el móvil se dormía, salíamos de casa o Home Assistant se reiniciaba, ningún proxy oía a nadie. Y el motor se tomaba esos silencios como pistas: empujaban la nube hacia donde ningún proxy oye bien, la buhardilla. En un día, me puso 44 minutos allí, y a Ruth, 92. Ahora, si no hay señal suficiente, congela la nube y mantiene el área. Repitiendo ese mismo día: ni un minuto en la buhardilla. Lo que queda: justo cuando vuelve la señal, a veces publica un sitio falso unos segundos; me ha pasado con la terraza del salón, 30 s.
- **El centro de las habitaciones atraía.** Los puntos del centro tienen más vecinos que los de las esquinas, y la probabilidad se iba acumulando en ellos. Se arregló repartiéndola de forma simétrica.
- **Entrenar un sitio movía a los demás.** Repetir una sesión en el mismo punto metía su patrón en las correcciones de los proxies, que son comunes a todos los móviles… y movía a la otra persona. Ahora, repetir un punto solo afina esa referencia.
- **Las terrazas y los patios, todavía no.** Están fuera de casa, pero pegados a ella, y pocos proxies los oyen bien.

## Preguntas y respuestas

### ¿Dónde está el código?

De momento no es público. El motor no sabe nada de mi casa en concreto, pero necesita un modelo de la casa hecho como el mío.

### ¿Necesito tener la casa en 3D?

Sí. Hoy el motor parte de un archivo de Blender con las paredes, los forjados, las salas y los proxies en su sitio. Sin eso no sabe qué hay entre cada proxy y cada punto.

### ¿Funciona con Android?

Sigue los móviles que Home Assistant reconoce con Private BLE Device. En casa los dos son iPhone, así que es lo único que he probado.

### ¿Gasta batería del móvil?

No. El móvil no hace nada nuevo: los proxies escuchan lo que ya emite por Bluetooth.

### ¿Cuántos proxies hacen falta?

No hay una cifra mágica. Lo que importa es que, estés donde estés, te oigan varios, y que escuchen todo el tiempo. Si tienes plantas una encima de otra, ayuda tener proxies en todas.

### ¿Cuánto cuesta mantenerlo?

Nada al mes: corre en casa, en Docker. Y 14 de los 21 proxies ya estaban instalados para otras cosas.

## Lo que viene

- **Automatizaciones por posición:** que la luz o la música te sigan de habitación en habitación.
- **Más cosas que situar:** relojes, llaves con una etiqueta Bluetooth…
- **Publicar el código,** cuando no dependa de cómo está hecho el modelo de mi casa.

¿Y tú? Si Home Assistant supiera en qué rincón de casa estás, ¿qué automatizarías primero? Te leo en los comentarios.

<style>
.body mark { padding: 1px 6px; }
.body details { border: 1px solid var(--border); border-radius: 16px; background: var(--tile2); padding: 0 20px; }
.body details[open] { padding-bottom: 18px; }
.body details > * + * { margin-top: 1em; }
.body summary { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 12px; padding: 15px 0; font-weight: 700; color: var(--fg); }
.body summary::-webkit-details-marker { display: none; }
.body summary::before { content: ''; flex: none; width: 8px; height: 8px; border-right: 2.5px solid var(--a1); border-bottom: 2.5px solid var(--a1); transform: rotate(-45deg); transition: transform .2s; margin-left: 2px; }
.body details[open] > summary::before { transform: rotate(45deg); }

.body .cs-pc-sola img { border-radius: 12px; background: transparent; border: 1px solid var(--border); box-shadow: var(--shadow); }
.body .cs-video video { width: auto; max-width: min(100%, 420px); border-radius: 12px; background: transparent; border: 1px solid var(--border); box-shadow: var(--shadow); }
.body .cs-par > div { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; max-width: 640px; margin: 0 auto; }
.body .cs-par img { width: 100%; border-radius: 12px; background: transparent; border: 1px solid var(--border); box-shadow: var(--shadow); }

.cs-falta { margin: 2em 0; padding: 26px 22px; border-radius: 18px; border: 2px dashed color-mix(in srgb, var(--a1) 55%, transparent); background: var(--tile2); text-align: center; font-size: 14px; line-height: 1.5; color: var(--mute); }
.cs-falta b { display: block; margin-bottom: 4px; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--a1); }

.cs-form { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 10px; margin: 1.6em 0; padding: 20px 16px; border-radius: 22px; border: 1px solid var(--border); background: radial-gradient(90% 70% at 0% 0%, color-mix(in srgb, #7465f6 10%, transparent), transparent 70%), radial-gradient(90% 70% at 100% 100%, color-mix(in srgb, #0ea5e9 11%, transparent), transparent 70%), var(--tile2); }
.cs-t { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 9px 13px; border-radius: 13px; background: var(--tile); border: 1px solid var(--border); box-shadow: 0 1px 2px rgba(15, 18, 34, .04); }
.cs-t b { color: var(--fg); font-size: 14px; line-height: 1.2; font-weight: 750; }
.cs-t small { color: var(--mute); font: 600 11px var(--mono); }
.cs-form i { font-style: normal; font-weight: 800; font-size: 20px; line-height: 1; color: var(--a1); }
.cs-t.cs-res { border: 1.5px solid transparent; background: linear-gradient(var(--tile), var(--tile)) padding-box, var(--grad) border-box; }

.cs-cifras { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.cs-cifras > div { background: var(--tile2); border: 1px solid var(--border); border-radius: 16px; padding: 16px 10px 14px; text-align: center; }
.cs-cifras b { display: block; font-size: 34px; line-height: 1.1; font-weight: 800; letter-spacing: -.03em; background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
.cs-cifras span { display: block; margin-top: 4px; font-size: 13px; line-height: 1.3; color: var(--mute); }

.body .cs-dg-fig { margin: 2em 0; }
.cs-dg { padding: 20px; border-radius: 22px; border: 1px solid var(--border); background: radial-gradient(90% 60% at 0% 0%, color-mix(in srgb, #dd6b3d 10%, transparent), transparent 70%), radial-gradient(90% 60% at 100% 100%, color-mix(in srgb, #0ea5e9 11%, transparent), transparent 70%), var(--tile2); }
.cs-ph { position: relative; padding: 14px; border-radius: 18px; background: color-mix(in srgb, var(--c) 5%, var(--tile)); border: 1px solid color-mix(in srgb, var(--c) 24%, transparent); }
.cs-phh { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0 0 12px 2px; font-size: 12.5px; color: var(--mute); }
.cs-phh b { color: var(--fg); font-size: 15px; font-weight: 800; letter-spacing: -.01em; }
.cs-phh span:last-child { padding-left: 10px; border-left: 1px solid var(--border); }
.cs-num { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 8px; background: var(--c); color: #fff; font: 700 12.5px var(--mono); box-shadow: 0 4px 10px -3px var(--c); }
.cs-row { display: grid; grid-template-columns: 1fr 26px 1fr 26px 1fr; }
.cs-card { display: flex; flex-direction: column; gap: 3px; padding: 12px 12px 11px; border-radius: 14px; background: var(--tile); border: 1px solid var(--border); box-shadow: 0 1px 2px rgba(15, 18, 34, .04), 0 8px 18px -10px color-mix(in srgb, var(--c) 45%, transparent); }
.cs-card b { color: var(--fg); font-size: 14px; line-height: 1.25; font-weight: 750; }
.cs-card small { color: var(--mute); font-size: 12.5px; line-height: 1.4; }
.cs-ico { width: 34px; height: 34px; display: grid; place-items: center; flex: none; margin-bottom: 5px; border-radius: 10px; color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); }
.cs-ico svg, .cs-arr svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.cs-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: auto; padding-top: 7px; }
.cs-chips span { font: 600 10.5px var(--mono); letter-spacing: .02em; color: var(--c); background: color-mix(in srgb, var(--c) 11%, transparent); padding: 2px 7px; border-radius: 6px; }
.cs-arr { display: grid; place-items: center; color: var(--c); }
.cs-arr svg { width: 18px; height: 18px; stroke-width: 2.2; }
.cs-cerebro { border: 1.5px solid transparent; background: linear-gradient(var(--tile), var(--tile)) padding-box, linear-gradient(135deg, #0ea5e9, #7465f6) border-box; }
.cs-join { position: relative; display: flex; justify-content: center; align-items: center; height: 46px; }
.cs-join::before { content: ''; position: absolute; top: 0; bottom: 6px; left: 50%; width: 2px; transform: translateX(-50%); background: linear-gradient(var(--c1), var(--c2)); }
.cs-join::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); border: 6px solid transparent; border-top: 7px solid var(--c2); border-bottom: 0; }
.cs-join span { position: relative; font: 600 10.5px var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--mute); background: var(--tile); border: 1px solid var(--border); padding: 3px 10px; border-radius: 99px; }
.cs-out { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
.cs-outl { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; }
.cs-outl::before, .cs-outl::after { content: ''; flex: 1; border-top: 1px dashed color-mix(in srgb, var(--c) 40%, transparent); }
.cs-outl span { font: 600 10.5px var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--mute); background: var(--tile); border: 1px solid var(--border); padding: 3px 10px; border-radius: 99px; }
.cs-card.cs-mini { flex-direction: row; align-items: center; gap: 10px; padding: 10px 12px; }
.cs-mini .cs-ico { margin: 0; }
.cs-mini b, .cs-mini small { display: block; }

.cs-pasos-fig { margin: 1.6em 0; background: radial-gradient(90% 70% at 0% 0%, color-mix(in srgb, #7465f6 11%, transparent), transparent 70%), radial-gradient(90% 70% at 100% 100%, color-mix(in srgb, #0ea5e9 11%, transparent), transparent 70%), var(--tile2); }
.cs-pasos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.cs-pasos .cs-card b { display: flex; align-items: center; gap: 7px; }
.cs-n { width: 19px; height: 19px; display: grid; place-items: center; flex: none; border-radius: 6px; background: var(--c); color: #fff; font: 700 11px var(--mono); }

@media (max-width: 680px) {
  .cs-dg { padding: 12px; }
  .cs-ph { padding: 12px; }
  .cs-row { grid-template-columns: 1fr; }
  .cs-arr { height: 26px; }
  .cs-arr svg { transform: rotate(90deg); }
  .cs-phh span:last-child { flex-basis: 100%; padding-left: 34px; border-left: 0; margin-top: -6px; }
  .cs-out { grid-template-columns: 1fr; }
  .cs-cifras { grid-template-columns: repeat(2, 1fr); }
  .cs-pasos { grid-template-columns: repeat(2, 1fr); }
  .cs-form { gap: 6px 8px; padding: 14px 10px; }
}
@media (max-width: 420px) { .cs-pasos { grid-template-columns: 1fr; } }
</style>
