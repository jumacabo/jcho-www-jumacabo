---
title: "Mi casa tiene un gemelo digital en 3D, en vivo"
description: "Partí de los planos y de unas fotos. Acabé con una réplica 3D de mi casa que se mueve con lo que pasa en ella y desde la que la manejo entera."
tags: [home-assistant, threejs, blender, 3d, dashboard, ai]
cover: /blog/media/home-assistant-3d-house/cover.jpg
# Original en español de home-assistant-3d-house (la versión publicada es la inglesa). No se publica: solo se guarda como referencia.
published: false
---

**TL;DR:** he convertido mi casa en una réplica 3D que vive en el navegador y se mueve con lo que pasa en ella de verdad. Home Assistant pone el cerebro; esto es su cara.

- Partí de los planos de la casa y de unas fotos. Unos scripts de Python construyen el modelo en Blender y de ahí salta a la web con Three.js.
- Todo lo que ves es real: toldos, portón, lavadora, coches, humo, lluvia, viento… Cada cosa se mueve porque un sensor de verdad lo dice.
- No solo se ve: con un clic enciendes luces, mueves toldos o abres el portón. Y cuando pasa algo, la cámara te lleva hasta allí.
- Tiene modo real y modo simulado, funciona dentro de Home Assistant sin pedir credenciales y también fuera, en el móvil, en español e inglés, en modo claro y oscuro.
- Lo he hecho en unas dos semanas con ayuda de IA. El código, de momento, no es público.
- Todo corre en casa, en contenedores Docker: sin contratar ningún servicio ni pagar cuotas mensuales. La única inversión, unos cuantos tokens de IA para construirlo.

Fuera está cayendo una buena. En la pantalla, también: las nubes se cierran sobre el tejado, la lluvia cae con la intensidad que marca [mi estación meteorológica](https://www.ecowitt.com/shop/goodsDetail/245), la hamaca del patio se balancea y los flecos de los toldos se agitan con cada ráfaga. En el garaje está el coche, porque la cámara lo está viendo. Y la lavadora, que acabó hace un rato, tiene un cesto de ropa al lado para recordarme que alguien tiene que vaciarla. No es una animación bonita sin más: es mi casa, ahora mismo.

<figure>
<iframe src="https://www.youtube-nocookie.com/embed/WCuOerGPqBY" title="Home Assistant 3D Dashboard: my real house, live in sun, rain and night" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
<figcaption>La casa en vivo: de día y de noche, con lluvia y viento, planta a planta.</figcaption>
</figure>

## La cara de Home Assistant

Home Assistant lo hace casi todo en mi casa: las automatizaciones, los avisos, la lógica de cuándo se enciende qué. Pero su interfaz, por muy bien que la montes, son tarjetas: listas de cosas con su estado. Para saber qué está pasando tienes que leer. Y yo quería poder *mirar*.

Esa es la idea de fondo de todo el proyecto. **Home Assistant es el cerebro y esto es su cara.** Como motor es buenísimo y no pretendo sustituirlo: la lógica y las automatizaciones siguen siendo suyas. Lo que no esperaba es esto: casi todo lo que hacía a diario en su interfaz de siempre ahora lo hago desde la casa en 3D. Encender una luz, comprobar que el portón está cerrado, ver si la lavadora ha terminado o quién está en casa: abro el navegador, lo veo de un vistazo y lo resuelvo ahí mismo.

## De unos planos y unas fotos a Blender

Todo empezó con los planos de la casa: los PDF de la promotora, con las cuatro plantas (el sótano con el garaje, la planta baja, la primera y la buhardilla) y un plano acotado de cada una.

<div class="cs-car">
<div class="cs-track">
<figure class="cs-slide cs-blanco"><img src="/blog/media/home-assistant-3d-house/planos-general.webp" alt="The original floor plans of the house: basement with garage, ground floor, first floor and attic" loading="lazy"><figcaption>Los planos de partida: las cuatro plantas.</figcaption></figure>
<figure class="cs-slide cs-blanco"><img src="/blog/media/home-assistant-3d-house/planos-planta-baja.webp" alt="Dimensioned floor plan of the ground floor" loading="lazy"><figcaption>El plano acotado de la planta baja: de aquí salen las paredes, las puertas y las ventanas, con sus medidas.</figcaption></figure>
</div>
</div>

Los planos dicen dónde va cada pared, cada puerta y cada ventana. Lo que no dicen es qué muebles hay, de qué color es el sofá o dónde está cada lámpara. Eso lo sacamos de fotos reales de cada habitación.

Y aquí viene lo curioso: **la casa no la he modelado a mano.** La describen unos scripts de Python (dónde va cada pared, cada mueble y cada lámpara) y son ellos los que construyen el archivo de Blender desde cero. Si quiero mover un mueble, cambio el dato y vuelvo a generar la casa. Y como la genera un programa, cada objeto sale ya con su etiqueta: esto es una luz, esto un toldo, esto la puerta del garaje. Esas etiquetas serán clave más adelante.

<figure class="cs-pc-sola"><img src="/blog/media/home-assistant-3d-house/blender.webp" alt="The house open in Blender: three floors cut away, with every object listed by name on the right" loading="lazy"><figcaption>La casa en Blender, tal como la generan los scripts: a la derecha, cada objeto con su nombre (la hamaca, el limonero, la guirnalda de bombillas…), igual que lo editaría una persona a mano.</figcaption></figure>

El estilo lo elegimos pronto: isométrico y acogedor, nada fotorrealista. Más casa de muñecas que foto.

## Primera idea: imágenes estáticas

Mi primer plan era mucho más modesto: sacar imágenes fijas de cada planta desde varios ángulos, en versión de día y de noche, encender o apagar las luces según su estado en Home Assistant y pasar a la de noche al ponerse el sol.

<div class="cs-car">
<div class="cs-track">
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/render-planta-baja-vistas.webp" alt="Ground floor seen from above and in two cross-sections" loading="lazy"><figcaption>La planta baja vista desde arriba y en dos cortes.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/render-exterior-noche.webp" alt="The outside of the house at night, with the garden lights on" loading="lazy"><figcaption>La casa por fuera, de noche: la idea era tener versiones de día y de noche y pasar de una a otra según la hora.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/render-planta-baja.webp" alt="Cutaway render of the ground floor with the living room and kitchen" loading="lazy"><figcaption>La planta baja, sin techo.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/render-sotano.webp" alt="Cutaway render of the basement with the garage and the car" loading="lazy"><figcaption>El sótano, con el garaje.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/render-primera-noche.webp" alt="Cutaway render of the first floor at night with the bedside lamps on" loading="lazy"><figcaption>La primera planta, de noche, con las lámparas encendidas.</figcaption></figure>
</div>
</div>

Funcionaba, pero se quedaba corto enseguida. Cada luz que quieres enseñar encendida o apagada multiplica las imágenes que necesitas, la cámara está fija y nada se mueve: ni un toldo, ni una puerta, ni la lluvia.

## El salto a la web en 3D

Entonces pensé: si la casa ya está entera en 3D dentro de Blender, ¿por qué conformarme con fotos de ella? La llevamos a la web con Three.js, la librería de 3D para navegadores más conocida. La primera vez que la vi girar en el navegador, con su luz y sus sombras, supe que aquello tenía muchísimo más recorrido que unas imágenes.

En solo cuatro días pasamos de las imágenes fijas a tener la casa en el navegador. A partir de ahí la conectamos a mi Home Assistant de verdad y la pregunta cambió. Ya no era «¿qué imágenes necesito?», sino «¿cuánto de lo que sé de mi casa puedo enseñar aquí?».

## Todo lo que ves es real

Esta es la parte de la que estoy más orgulloso: en la casa 3D no hay atrezo. Si algo se mueve, se enciende o cambia, es porque un sensor de verdad lo ha dicho. El segundo vídeo empieza por el plano, levanta la casa y luego la recorre por dentro.

<figure>
<iframe src="https://www.youtube-nocookie.com/embed/BSulm_5bLbA" title="Home Assistant 3D Floorplan: every real sensor in my house, live" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
<figcaption>Del plano a la casa, y después sus dispositivos: la cocina, las neveras, la fuga junto a la lavadora, el humo, la tele, el movimiento y las luces de noche.</figcaption>
</figure>

Algunos ejemplos:

- **El tiempo.** La lluvia cae con la intensidad que mide [mi estación meteorológica](https://www.ecowitt.com/shop/goodsDetail/245). El viento mueve la hamaca del patio, los flecos de los toldos y el anemómetro, que gira según lo que sopla.
- **El sol.** Está donde está de verdad, según la hora y la orientación real de la casa, con sus sombras. El día y la noche de mi primera idea ahora salen solos.
- **Los toldos y las persianas.** Se abren justo lo que están abiertos de verdad, del 0 al 100 %. En Home Assistant son *covers*.
- **Los coches.** El del garaje solo aparece si la cámara lo ve, gracias a [Frigate](https://github.com/blakeblackshear/frigate). El eléctrico de la rampa, además, brilla mientras carga y muestra en la luneta lo que le falta.
- **La lavadora.** Un medidor de consumo sabe cuándo empieza y cuándo acaba, y un sensor en la puerta, si ya la has vaciado. Si no, aparece un cesto de ropa a su lado.
- **El humo y el agua.** Los detectores de humo son reales: si uno salta, su habitación se llena de humo. Si un sensor de fugas detecta agua, aparece un charco.
- **Las temperaturas.** Cada nevera, cada congelador y cada habitación con sensor, con la suya.
- **El movimiento.** Cuando un sensor detecta a alguien, el suelo de esa habitación se tiñe de azul y salen ondas.
- **Las personas.** Cada uno aparece en la habitación en la que está, sentado en su sitio: el sofá, la silla del despacho…
- **Los paneles solares.** Se llenan de amarillo según lo que producen y llevan impresos los kW.

<details markdown="1">
<summary>El inventario completo: qué hay detrás de cada cosa</summary>

| Lo que ves | Qué lo detecta | En Home Assistant | Marca y modelo |
|---|---|---|---|
| Lluvia, según su intensidad | Pluviómetro y sensor de lluvia | `sensor`, `binary_sensor` | [Ecowitt Wittboy](https://www.ecowitt.com/shop/goodsDetail/245) |
| Hamaca, flecos de los toldos y anemómetro | Anemómetro: viento y ráfagas | `sensor` (km/h) | [Ecowitt Wittboy](https://www.ecowitt.com/shop/goodsDetail/245) |
| Sol, luz y sombras | La hora y la orientación de la casa | `sun` | — |
| Personas en su habitación | Intensidad del Bluetooth de los móviles | `person` + área | 21 proxies Bluetooth ([Atom Echo](https://docs.m5stack.com/en/atom/atomecho) y [Shelly](https://www.shelly.com/)) + [mi propio motor de posicionamiento](/blog/bluetooth-trilateration/) |
| Toldos del 0 al 100 % | Motores Z-Wave | `cover` | Z-Wave, con [Z-Wave JS UI](https://github.com/zwave-js/zwave-js-ui) |
| Portón del garaje | Sensor de contacto y relé | `binary_sensor`, `switch` | [Aqara Door and Window Sensor](https://www.aqara.com/en/product/door-and-window-sensor/) + [Shelly Plus 1](https://kb.shelly.cloud/knowledge-base/shelly-plus-1) |
| Cancela y abrepuertas | Sensor de contacto y relé | `binary_sensor`, `switch` | [Aqara Door and Window Sensor](https://www.aqara.com/en/product/door-and-window-sensor/) + [Shelly 1](https://kb.shelly.cloud/knowledge-base/shelly-1) |
| Cerradura de la puerta del garaje | Cerradura inteligente | `lock` | [Nuki](https://nuki.io/en/) |
| Persianas | Controlador de persiana | `cover` | [Shelly 2PM](https://www.shelly.com/products/shelly-2pm-gen3-1) |
| Puertas y ventanas | Sensores de contacto | `binary_sensor` | [Aqara Door and Window Sensor](https://www.aqara.com/en/product/door-and-window-sensor/) |
| Coche en el garaje | Cámara y detección de objetos | `binary_sensor` | [Frigate](https://github.com/blakeblackshear/frigate) |
| Coche eléctrico cargando | Integración del coche y consumo del cargador | `binary_sensor`, `sensor` | Volvo XC60 + [Shelly Plug](https://www.shelly.com/collections/smart-plugs) |
| Lavadora: en marcha, puerta y por vaciar | Consumo y sensor de puerta | `binary_sensor`, `input_boolean` | [Aqara Door and Window Sensor](https://www.aqara.com/en/product/door-and-window-sensor/) + [Shelly Plug](https://www.shelly.com/collections/smart-plugs) |
| Lavavajillas, horno, placa y microondas | Medidor de consumo | `binary_sensor`, `sensor` | [Shelly EM](https://www.shelly.com/products/shelly-em-50a-clamp-1) |
| Caldera y cinta de andar | Enchufes con medición (por el consumo de la cinta se sabe hasta lo rápido que andas) | `binary_sensor`, `sensor` | [Shelly Plug](https://www.shelly.com/collections/smart-plugs) |
| Teles: encendidas, volumen y tiempo | Reproductor multimedia | `media_player` | [Integración Samsung Smart TV](https://www.home-assistant.io/integrations/samsungtv/) |
| Humo que llena la habitación | Detectores de humo | `binary_sensor` | [Aqara Smoke Detector](https://www.aqara.com/en/product/smoke-detector/) |
| Charcos | Sensores de fugas | `binary_sensor` | [Aqara Water Leak Sensor](https://www.aqara.com/en/product/water-sensor/) |
| Temperatura de neveras y habitaciones | Sensores de temperatura | `sensor` | [Aqara Temperature and Humidity Sensor](https://www.aqara.com/en/product/temperature-humidity-sensor/) |
| Paneles solares | Medidor de energía (y el inversor, sus averías) | `sensor`, `binary_sensor` | [Shelly EM](https://www.shelly.com/products/shelly-em-50a-clamp-1) |
| Luces y tiras LED | — | `light` | [WLED](https://kno.wled.ge/), [Philips Hue](https://www.philips-hue.com/en-us), [Shelly](https://www.shelly.com/), [Govee](https://www.govee.com/) |
| Aires acondicionados | — | `climate` | [Mitsubishi Electric MELCloud](https://www.melcloud.com/) |

</details>

## Más bonita y más viva

Con los datos ya dentro, me di cuenta de que no era solo cuestión de verlo. ¿Y si, además, lo hacíamos bonito y dinámico? Ahí empezó la parte más divertida: las animaciones.

Casi todas se preparan en Blender, como en una película (abrir una puerta, desplegar un toldo, encender una lámpara), y la web las reproduce cuando Home Assistant dice que toca.

- **Lo que se abre, se abre poco a poco:** las puertas y ventanas, con todas sus hojas; los toldos, las persianas y el portón del garaje, y hasta las cortinas, que se apartan cuando se abre su ventana.
- **Lo que funciona, se nota:** giran las aspas de los ventiladores y de las unidades exteriores del aire acondicionado; el lavavajillas vuelve translúcida su puerta y deja ver los brazos girando y los chorros; el plato del microondas da vueltas con un pollo dentro, sale vapor de la cazuela de la placa y los matamoscas eléctricos chisporrotean.
- **El tiempo:** el viento, por tramos, mueve los árboles, la hamaca y los flecos de los toldos. Con lluvia, el cielo se nubla, la luz se vuelve más suave y caen gotas, más y más deprisa cuanto más llueve.
- **La propia casa:** al cambiar de planta, todo se funde; las plantas se separan como una maqueta que se abre, y desde el plano las paredes suben y los muebles caen en su sitio, como al principio del segundo vídeo.
- **Y alguna licencia poética:** unos pájaros que vuelan y se posan en las barandillas y en el tejado. Esos no los mide ningún sensor.

Y como la casa es 3D de verdad y no una imagen, también puede cambiar de aspecto. Además del normal, hay maqueta, dibujo, ilustración a color, papel y cartón, arcilla de colores y plano arquitectónico, con lo que la casa vuelve a ser el plano del que salió, cotas incluidas. Se pasa de uno a otro con un barrido de luz, y todo sigue funcionando igual: las luces, los toldos, las personas…

<div class="cs-car cs-auto">
<div class="cs-track">
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/aspecto-plano.webp" alt="Ground floor as an architectural plan with walls, doors and dimensions" loading="lazy"><figcaption>Plano arquitectónico: muros, puertas y cotas.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/aspecto-maqueta.webp" alt="Ground floor with the scale model look: soft warm colours, no textures" loading="lazy"><figcaption>Maqueta: colores suaves y sin texturas, como una maqueta de arquitecto.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/aspecto-dibujo.webp" alt="Ground floor with the drawing look: ink outlines on paper" loading="lazy"><figcaption>Dibujo: solo los contornos, en tinta sobre papel.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/aspecto-papel.webp" alt="Ground floor with the paper and cardboard look: everything in one cardboard tone" loading="lazy"><figcaption>Papel y cartón: todo de un mismo tono, como recortado en cartulina.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/aspecto-normal.webp" alt="Ground floor of the 3D house with its normal look: real materials and colours" loading="lazy"><figcaption>Normal: los materiales y colores de siempre.</figcaption></figure>
</div>
</div>

## No solo se ve: también se manda

La casa 3D no es solo un espejo: también es un mando. Un clic en una lámpara la enciende. En una tira LED, la enciende con su efecto, y con el botón derecho eliges otro. Puedo subir o bajar toldos y persianas, cambiar el volumen de una tele o la temperatura del aire acondicionado, echar la cerradura de la puerta del garaje o abrir la cancela para que entre alguien.

Hay dos detalles que me gustan mucho. El primero: igual que en la vida real, lo que pides no cambia al instante. Se queda pendiente hasta que Home Assistant confirma que ha pasado de verdad, y entonces sí. El segundo: lo delicado, como el portón, la cancela o la cerradura, te pide confirmación antes.

<div class="cs-car">
<div class="cs-track">
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/mando-porton.webp" alt="Confirmation dialog before opening the real garage door from the 3D house" loading="lazy"><figcaption>Lo delicado pide confirmación: esto abre el portón del garaje de verdad.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/mando-tele.webp" alt="Living room TV menu with time on, power use, volume and mute controls" loading="lazy"><figcaption>La tele del salón: cuánto lleva encendida, lo que consume, el volumen y silenciarla.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/mando-toldo.webp" alt="Awning menu with options from retracted to fully open" loading="lazy"><figcaption>Un toldo: de recogido a abierto del todo, pasando por el 25, el 50 o el 75 %.</figcaption></figure>
</div>
</div>

## La casa te cuenta lo que pasa

Con tantas cosas a la vista, faltaba algo: que la casa me avisara. Las vistas dinámicas hacen justo eso. Cuando pasa algo, la cámara se va sola a esa habitación, lo resalta un momento y un cartel abajo cuenta qué ha pasado.

Alguien entra en el despacho y el sensor de movimiento lo detecta. Se abre la puerta de la terraza. Una persona pasa de la cocina al salón. El portón empieza a subir. Salta un detector de humo. Cada vez, la cámara va hasta allí y te lo enseña. No tienes que buscar nada: la casa te lo cuenta.

<figure><img src="/blog/media/home-assistant-3d-house/vistas-dinamicas.webp" alt="Dynamic views: the camera moves on its own to the office and the garage as motion is detected, lights turn on and the garage door opens" loading="lazy"><figcaption>Las vistas dinámicas en acción: movimiento en el despacho, se enciende la luz de la escalera, se abre la puerta del garaje y se enciende su luz. La cámara va a cada sitio y abajo se va apuntando lo que acaba de pasar.</figcaption></figure>

## Cómo encaja todo

Para quien no programa, la idea es sencilla: hay tres piezas y cada una sabe solo lo suyo.

- **El modelo** describe la casa: paredes, muebles, luces. No sabe nada de Home Assistant.
- **Dos archivos de configuración** hacen de puente. Los *vínculos* dicen qué entidad de Home Assistant es cada cosa de la casa («esta lámpara es la luz del salón»). Los *perfiles*, cómo se interpreta cada tipo de cosa («un toldo al 40 % se dibuja así»).
- **Home Assistant** pone la lógica. Si hay que calcular algo, lo calcula él; la web solo reacciona a lo que le llega.

Por eso el motor no está atado a mi casa: con otro modelo y otros vínculos, valdría para cualquier otra.

<figure class="cs-dg-fig">
<div class="cs-dg">
<div class="cs-ph" style="--c:#dd6b3d">
<div class="cs-phh"><span class="cs-num">1</span><b>Construir la casa</b><span>se hace una vez</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 11h7v6H9zM12.5 11v6"/></svg></span><b>Planos y fotos</b><small>Los PDF de la promotora y fotos de cada habitación</small><span class="cs-chips"><span>PDF</span><span>JPG</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg></span><b>Los datos de la casa</b><small>Scripts que describen paredes, muebles y luces</small><span class="cs-chips"><span>Python</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M12 2.5 3.5 7v10l8.5 4.5 8.5-4.5V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/></svg></span><b>La casa en 3D</b><small>Cada objeto, con su etiqueta: luz, toldo, puerta…</small><span class="cs-chips"><span>Blender</span></span></div>
</div>
<div class="cs-side"><span class="cs-nota">antes de la web, la primera idea</span><div class="cs-card cs-mini"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="9.5" r="1.8"/><path d="m21 15.5-5-5-9.5 9.5"/></svg></span><div><b>Imágenes estáticas</b><small>Renders de día y de noche</small></div></div></div>
</div>
<div class="cs-join" style="--c1:#dd6b3d;--c2:#7465f6"><span>exportar</span></div>
<div class="cs-ph" style="--c:#7465f6">
<div class="cs-phh"><span class="cs-num">2</span><b>Unirla con Home Assistant</b><span>configuración, sin código</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.2l8.4 4.6"/></svg></span><b>El modelo para la web</b><small>Una pieza por objeto, con sus animaciones</small><span class="cs-chips"><span>glTF</span></span></div>
<span class="cs-arr cs-mas"><svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1"/></svg></span><b>Vínculos</b><small>Qué entidad de Home Assistant es cada cosa</small><span class="cs-chips"><span>YAML</span></span></div>
<span class="cs-arr cs-mas"><svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></svg></span><b>Perfiles</b><small>Cómo se interpreta cada tipo de cosa</small><span class="cs-chips"><span>YAML</span></span></div>
</div>
</div>
<div class="cs-join" style="--c1:#7465f6;--c2:#0ea5e9"><span>en vivo</span></div>
<div class="cs-ph" style="--c:#0ea5e9">
<div class="cs-phh"><span class="cs-num">3</span><b>Vivirla</b><span>en tiempo real</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12.5" rx="2.5"/><path d="M8.5 20.5h7M12 16.5v4"/><path d="m12 6.8 3 1.6v3.2l-3 1.6-3-1.6V8.4zM9 8.4l3 1.6 3-1.6M12 10v3.2"/></svg></span><b>La web en 3D</b><small>La casa en el navegador, en cualquier pantalla</small><span class="cs-chips"><span>Three.js</span></span></div>
<span class="cs-arr cs-dos"><svg viewBox="0 0 24 24"><path d="M4 8.5h15M15.5 5l3.5 3.5-3.5 3.5M20 15.5H5M8.5 12 5 15.5 8.5 19"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M4 7h11M11 3.5 15 7l-4 3.5"/><path d="M20 17H9M13 13.5 9 17l4 3.5"/><circle cx="19" cy="7" r="1.6"/><circle cx="5" cy="17" r="1.6"/></svg></span><b>La pasarela</b><small>Traduce con los vínculos y perfiles; también simula</small><span class="cs-chips"><span>Node.js</span></span></div>
<span class="cs-arr cs-dos"><svg viewBox="0 0 24 24"><path d="M4 8.5h15M15.5 5l3.5 3.5-3.5 3.5M20 15.5H5M8.5 12 5 15.5 8.5 19"/></svg></span>
<div class="cs-card cs-cerebro"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 9.5V20h13V9.5"/><circle cx="12" cy="13.2" r="1.7"/><path d="M12 15v2.6M10.4 12.3 8.6 11M13.6 12.3l1.8-1.3"/><circle cx="8" cy="10.6" r=".9"/><circle cx="16" cy="10.6" r=".9"/><circle cx="12" cy="18.3" r=".9"/></svg></span><b>Home Assistant</b><small>El cerebro: estados, órdenes y automatizaciones</small><span class="cs-chips"><span>WebSocket</span></span></div>
</div>
<div class="cs-out">
<span class="cs-outl"><span>se ve en</span></span>
<div class="cs-card cs-mini"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16M5.5 8h1.5M5.5 11h1.5M5.5 14h1.5"/></svg></span><div><b>Un panel dentro de Home Assistant</b><small>Sin pedir credenciales, también en la app</small></div></div>
<div class="cs-card cs-mini"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="13" height="10" rx="1.8"/><path d="M1.5 18h15"/><rect x="16.5" y="8" width="5.5" height="11" rx="1.4"/><path d="M18.6 16.8h1.3"/></svg></span><div><b>Una web independiente</b><small>En el móvil o el ordenador, con el login de Home Assistant</small></div></div>
</div>
</div>
</div>
<figcaption>De los planos al navegador: qué hace cada pieza.</figcaption>
</figure>

<details markdown="1">
<summary>Para los técnicos: las tecnologías</summary>

- **Modelo:** scripts de Python generan el archivo de Blender desde cero, con metadatos en cada objeto (qué es, su clave, su planta). Las imágenes estáticas también salen de ahí.
- **Exportación:** glTF binario (GLB) comprimido con Draco, un nodo por objeto y con sus animaciones (abrir, encender…).
- **Web:** Three.js con posprocesado (oclusión ambiental y antialiasing SMAA). Vite en desarrollo y nginx en producción.
- **Pasarela:** Node.js. Habla con Home Assistant por su API WebSocket, traduce con los vínculos y los perfiles (YAML) y también hace de Home Assistant simulado.
- **Autenticación:** OAuth2 contra Home Assistant (como sus apps) para la web independiente, y un panel personalizado (`panel_custom`) que le pasa a la web el token de la sesión abierta.
- **Vídeo:** los vídeos de las demos se generan en el propio navegador, fotograma a fotograma, en MP4 de hasta 4K a 60 fps.
- **Despliegue:** contenedores Docker (la imagen la construye GitHub Actions) en un servidor de casa, sin servicios en la nube ni cuotas.
- **Pruebas:** pruebas automáticas con un navegador de verdad (Playwright) que recorren la casa, hacen capturas y comprueban la escena.

</details>

## Pensada para usarla a diario

### Casa real y casa simulada

La web tiene dos modos, y se pasa de uno a otro con un interruptor. En el modo real, todo es lo que dice Home Assistant y las órdenes van a la casa de verdad. En el simulado, la casa se desconecta: puedo encender, apagar, abrir y «romper» lo que quiera sin tocar nada de verdad.

Lo mejor es que, al pasar del real al simulado, la simulación arranca con todo tal y como estaba en ese momento y sigue por su cuenta desde ahí. Volver al real es inmediato. Y la simulación se porta como la casa de verdad: lo que pides también se queda pendiente un momento antes de cambiar.

### Dentro de Home Assistant y fuera

Dentro de Home Assistant, la casa aparece como un panel más en la barra lateral, también en la app del móvil, y no pide credenciales: usa la sesión que ya tienes abierta. Fuera, es una web normal. Si no has entrado, te manda a la pantalla de login de tu Home Assistant, la misma que usan sus apps, y luego te devuelve. En los dos casos, lo que mandas va a tu nombre.

<figure class="cs-dispositivos">
<div><img class="cs-pc" src="/blog/media/home-assistant-3d-house/panel-ha-claro.webp" alt="The 3D house as a panel inside Home Assistant on Windows, in light mode" loading="lazy"><img class="cs-tel" src="/blog/media/home-assistant-3d-house/app-ha-claro.webp" alt="The 3D house inside the Home Assistant iPhone app, in light mode" loading="lazy"></div>
<div><img class="cs-pc" src="/blog/media/home-assistant-3d-house/panel-ha-oscuro.webp" alt="The 3D house as a panel inside Home Assistant on Windows, in dark mode" loading="lazy"><img class="cs-tel" src="/blog/media/home-assistant-3d-house/app-ha-oscuro.webp" alt="The 3D house inside the Home Assistant iPhone app, in dark mode" loading="lazy"></div>
<figcaption>Dentro de Home Assistant, en el ordenador y en la app del iPhone, en modo claro y oscuro: un panel más de la barra lateral, sin pedir credenciales.</figcaption>
</figure>

<figure class="cs-pc-sola"><img src="/blog/media/home-assistant-3d-house/web-independiente.webp" alt="The standalone 3D house website in a desktop browser, outside Home Assistant" loading="lazy"><figcaption>Y fuera, como una web más en cualquier navegador, entrando con tu usuario de Home Assistant.</figcaption></figure>

### En el móvil, en dos idiomas, de día y de noche

Se adapta a cualquier pantalla (también al Safari del iPhone, que dio su guerra) y va a 60 fotogramas por segundo sostenidos, tanto en el iPhone como en el ordenador. Está en español y en inglés, y tiene modo claro y oscuro, que por defecto sigue al del sistema.

### Un editor de demos

Para enseñarla hice un editor de demos: recorridos con su cámara, sus títulos, sus globos y lo que pasa en cada momento (se enciende esto, se abre aquello), con una línea de tiempo para ir a cualquier punto y deshacer lo que no te gusta. Cada demo se descarga como vídeo MP4, de hasta 4K a 60 fps, generado en el propio navegador. Los dos vídeos de este artículo salen tal cual del editor, sin retocar; lo único que les añadí después, con FFmpeg, fue la música.

<div class="cs-car cs-ancho">
<div class="cs-track">
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/editor-demos.webp" alt="The demo editor with its steps grouped by colour and the timeline at the bottom" loading="lazy"><figcaption>El editor de demos: los pasos, en grupos de colores (del plano a la casa, el lavavajillas, la fuga de agua, el detector de humo…), y abajo, la línea de tiempo.</figcaption></figure>
<figure class="cs-slide cs-encaja"><img src="/blog/media/home-assistant-3d-house/editor-paso.webp" alt="Editing a demo step: the dishwasher starts together with the previous step, 2.5 seconds later" loading="lazy"><figcaption>Editando un paso: el lavavajillas se pone en marcha junto con el paso anterior, 2,5 s después. Cada paso se puede previsualizar, reproducir, duplicar o borrar.</figcaption></figure>
</div>
</div>

## Hecha con IA

Una confesión: gran parte de esto no lo he programado yo línea a línea. Lo he hecho con agentes de IA en [GitHub Copilot](https://github.com/features/copilot), sobre todo con los modelos **Claude Opus 5.5** y **GPT-6 Astra**.

Lo que mejor me ha funcionado ha sido dejarles unas reglas claras desde el principio:

- **Todo genérico.** Nada de apaños para mi casa: el motor tiene que servir para otra.
- **Nada escrito a fuego.** Cada valor concreto, en un archivo de configuración, no en el código.
- **Sin lógica en la web.** Si hay que calcular algo, que lo haga Home Assistant.
- **Calidad ante todo, también con prisa.** Y nada de pruebas que fallan a veces sí y a veces no.
- **Antes de un cambio grande, el plan.** Que me lo expliquen y esperen mi visto bueno.
- **Ver el progreso en directo.** La web abierta en mi navegador mientras trabajan.
- **Mi casa real solo se mira.** Las pruebas nunca le dan órdenes.

<div class="cs-cifras">
<div><b>14</b><span>días de trabajo</span></div>
<div><b>99+</b><span>commits</span></div>
<div><b>99+</b><span>dispositivos vinculados</span></div>
<div><b>2</b><span>modelos de IA</span></div>
</div>

## Lo que costó

No todo fue tan bonito como en los vídeos. Algunas historias:

- **Los toldos van al revés.** Son Z-Wave y dicen su posición al revés: para ellos, recogidos es «abiertos». En la casa 3D salían desplegados justo cuando estaban guardados, hasta que le dijimos a la casa que los leyera al revés.
- **Las persianas no dicen por dónde van.** Solo informan de su posición cuando llegan. Mientras se mueven, la web las anima calculando por dónde deberían ir: las medí y tardan 25 segundos de punta a punta.
- **En el iPhone ni cargaba.** Safari no tiene una función del navegador que usábamos para hacer tareas en los ratos libres. Tocó hacer nuestra propia versión.
- **El login, dentro de la app.** En la app de Home Assistant, su pantalla de login no funciona dentro de un panel. Por eso el panel le pasa a la web la sesión que ya tienes abierta.

## Preguntas y respuestas

### ¿Dónde está el código?

De momento no es público. La parte que genera la casa en Blender es muy específica de la mía; la web, en cambio, ya es genérica y puede mostrar cualquier casa. Todo está en desarrollo y no lo publicaré hasta que el conjunto sea lo bastante general.

### ¿Cómo sabes en qué habitación está cada uno?

Cuando publiqué este artículo, lo hacía con la integración [Bermuda BLE Trilateration](https://github.com/agittins/bermuda). Unos días después la sustituí por mi propio motor: 21 proxies Bluetooth repartidos por la casa (Shelly y Atom Echo) oyen los móviles, y el motor usa el modelo 3D de la casa para calcular dónde está cada uno. Lo cuento todo en [este otro artículo](/blog/bluetooth-trilateration/).

### ¿Sustituye a Home Assistant?

No. Home Assistant es la bestia que hay detrás: el motor, toda la lógica y todas las automatizaciones. Esto es la interfaz. Eso sí, para el día a día, muchas veces me basta con ella.

### ¿Podría usarlo en mi casa?

La web ya vale para cualquier casa, pero hoy necesita un modelo de la casa hecho como el mío, y esa parte todavía es muy específica. Ver la primera pregunta.

### ¿Es seguro abrirla desde fuera de casa?

Sin sesión no se ve nada: entras con tu cuenta de Home Assistant y lo que mandas va a tu nombre.

### ¿Cuánto has tardado?

Unas dos semanas: 13 días con cambios, con ayuda de la IA.

### ¿Cuánto cuesta mantenerlo?

Nada al mes. Todo corre en casa, en contenedores Docker, sin contratar ningún servicio. La única inversión han sido unos cuantos tokens de IA.

### ¿Va fluida en el móvil?

Sí: 60 fotogramas por segundo sostenidos, tanto en el iPhone como en el ordenador.

## Lo que viene

- **Más animaciones.** Me encantan, y aún hay cosas de casa que no se ven: el timbre Amazon Ring cuando llaman a la puerta, la energía que estoy tirando de la red, el consumo de agua…
- **Otras vistas.** Por ejemplo, una de la red de casa, con los siete routers y por dónde van los cables.
- **Las cámaras.** Integrar las 13 cámaras de vídeo de casa en la propia casa 3D.
- **Publicar el código,** cuando la parte que genera la casa sea lo bastante genérica para servir a otras.

¿Y tú? Si tuvieras tu casa en 3D, ¿qué sensor te gustaría ver moverse primero? Te leo en los comentarios.

<style>
.body mark { padding: 1px 6px; }
.body details { border: 1px solid var(--border); border-radius: 16px; background: var(--tile2); padding: 0 20px; }
.body details[open] { padding-bottom: 18px; }
.body details > * + * { margin-top: 1em; }
.body summary { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 12px; padding: 15px 0; font-weight: 700; color: var(--fg); }
.body summary::-webkit-details-marker { display: none; }
.body summary::before { content: ''; flex: none; width: 8px; height: 8px; border-right: 2.5px solid var(--a1); border-bottom: 2.5px solid var(--a1); transform: rotate(-45deg); transition: transform .2s; margin-left: 2px; }
.body details[open] > summary::before { transform: rotate(45deg); }
.body details .tw { background: var(--tile); }
.body details table { font-size: 14px; }
.body details td, .body details th { padding: 9px 12px; }
.body details code { font-size: 12.5px; white-space: nowrap; }

.cs-car { margin: 2em 0; }
.cs-track { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain; border-radius: 18px; }
.js .cs-track { scrollbar-width: none; }
.js .cs-track::-webkit-scrollbar { display: none; }
.body .cs-slide { flex: 0 0 100%; margin: 0; scroll-snap-align: center; }
.body .cs-slide img { width: 100%; aspect-ratio: 4 / 3; object-fit: contain; background: var(--tile2); }
.body .cs-blanco img { background: #fff; padding: 12px; }
.body .cs-ancho .cs-slide img { aspect-ratio: 2.09 / 1; object-fit: cover; }
.body .cs-ancho .cs-pend img { object-fit: contain; }
.body .cs-ancho .cs-encaja img { object-fit: contain; background: #27221f; }
.body .cs-auto .cs-slide img { aspect-ratio: 16 / 9; object-fit: cover; }
.body .cs-dispositivos > div { display: flex; align-items: flex-start; gap: 12px; }
.body .cs-dispositivos > div + div { margin-top: 12px; }
.body .cs-dispositivos img { width: auto; min-width: 0; margin: 0; background: transparent; border: 1px solid var(--border); box-shadow: var(--shadow); }
.body .cs-dispositivos .cs-pc { flex: 1.7778 1 0; border-radius: 12px; }
.body .cs-dispositivos .cs-tel { flex: 0.4618 1 0; border-radius: 16px; }
.body .cs-pc-sola img { border-radius: 12px; background: transparent; border: 1px solid var(--border); box-shadow: var(--shadow); }
@media (max-width: 680px) { .body .cs-dispositivos > div { gap: 8px; } .body .cs-dispositivos > div + div { margin-top: 8px; } .body .cs-dispositivos .cs-pc { border-radius: 8px; } .body .cs-dispositivos .cs-tel { border-radius: 10px; } }
.cs-nav { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 12px; }
.cs-btn { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 12px; border: 1px solid var(--border); background: var(--tile2); color: var(--fg); cursor: pointer; transition: border-color .2s, color .2s; }
.cs-btn:hover { border-color: var(--a1); color: var(--a1); }
.cs-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.cs-dots { display: flex; gap: 7px; }
.cs-dots button { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 99px; background: color-mix(in srgb, var(--fg) 18%, transparent); cursor: pointer; transition: width .25s, background .25s; }
.cs-dots button.on { width: 24px; background: var(--grad); }

.body .cs-pend img { outline: 2px dashed color-mix(in srgb, var(--a1) 55%, transparent); outline-offset: -8px; opacity: .75; }

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
.cs-row, .cs-side { display: grid; grid-template-columns: 1fr 26px 1fr 26px 1fr; }
.cs-card { display: flex; flex-direction: column; gap: 3px; padding: 12px 12px 11px; border-radius: 14px; background: var(--tile); border: 1px solid var(--border); box-shadow: 0 1px 2px rgba(15, 18, 34, .04), 0 8px 18px -10px color-mix(in srgb, var(--c) 45%, transparent); }
.cs-card b { color: var(--fg); font-size: 14px; line-height: 1.25; font-weight: 750; }
.cs-card small { color: var(--mute); font-size: 12.5px; line-height: 1.4; }
.cs-ico { width: 34px; height: 34px; display: grid; place-items: center; flex: none; margin-bottom: 5px; border-radius: 10px; color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); }
.cs-ico svg, .cs-arr svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.cs-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: auto; padding-top: 7px; }
.cs-chips span { font: 600 10.5px var(--mono); letter-spacing: .02em; color: var(--c); background: color-mix(in srgb, var(--c) 11%, transparent); padding: 2px 7px; border-radius: 6px; }
.cs-arr { display: grid; place-items: center; color: var(--c); }
.cs-arr svg { width: 18px; height: 18px; stroke-width: 2.2; }
.cs-side { margin-top: 10px; align-items: center; }
.cs-nota { grid-column: 1 / 4; justify-self: end; display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-style: italic; color: var(--mute); }
.cs-nota::after { content: ''; width: 34px; border-top: 1.5px dashed color-mix(in srgb, var(--c) 55%, transparent); }
.cs-side .cs-card { grid-column: 4 / 6; position: relative; background: transparent; box-shadow: none; border: 1.5px dashed color-mix(in srgb, var(--c) 45%, transparent); }
.cs-side .cs-card::before { content: ''; position: absolute; left: calc(50% + 13px); top: -11px; height: 10px; border-left: 1.5px dashed color-mix(in srgb, var(--c) 60%, transparent); }
.cs-side .cs-card b { color: var(--soft); }
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

@media (max-width: 680px) {
  .cs-dg { padding: 12px; }
  .cs-ph { padding: 12px; }
  .cs-row, .cs-side { grid-template-columns: 1fr; }
  .cs-arr { height: 26px; }
  .cs-arr svg { transform: rotate(90deg); }
  .cs-mas svg { transform: none; }
  .cs-phh span:last-child { flex-basis: 100%; padding-left: 34px; border-left: 0; margin-top: -6px; }
  .cs-side { margin-top: 12px; }
  .cs-nota { display: none; }
  .cs-side .cs-card { grid-column: 1; }
  .cs-side .cs-card::before { left: 50%; }
  .cs-out { grid-template-columns: 1fr; }
  .cs-cifras { grid-template-columns: repeat(2, 1fr); }
}
</style>

<script>
(function () {
  var ANT = '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>';
  var SIG = '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>';
  function boton(svg, etiqueta) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cs-btn'; b.innerHTML = svg; b.setAttribute('aria-label', etiqueta);
    return b;
  }
  document.querySelectorAll('.cs-car').forEach(function (car) {
    var pista = car.querySelector('.cs-track');
    var fotos = Array.prototype.slice.call(pista.children);
    if (fotos.length < 2) return;
    var nav = document.createElement('div'); nav.className = 'cs-nav';
    var puntos = document.createElement('div'); puntos.className = 'cs-dots';
    var ant = boton(ANT, 'Anterior'), sig = boton(SIG, 'Siguiente');
    function actual() {
      var x = pista.scrollLeft, mejor = 0;
      fotos.forEach(function (f, i) { if (Math.abs(f.offsetLeft - fotos[0].offsetLeft - x) < Math.abs(fotos[mejor].offsetLeft - fotos[0].offsetLeft - x)) mejor = i; });
      return mejor;
    }
    function ir(i) {
      i = (i + fotos.length) % fotos.length;
      pista.scrollTo({ left: fotos[i].offsetLeft - fotos[0].offsetLeft, behavior: 'smooth' });
    }
    var bolas = fotos.map(function (f, i) {
      var p = document.createElement('button');
      p.type = 'button'; p.setAttribute('aria-label', 'Imagen ' + (i + 1) + ' de ' + fotos.length);
      p.addEventListener('click', function () { ir(i); });
      puntos.appendChild(p);
      return p;
    });
    function marcar() { var a = actual(); bolas.forEach(function (p, i) { p.classList.toggle('on', i === a); }); }
    ant.addEventListener('click', function () { ir(actual() - 1); });
    sig.addEventListener('click', function () { ir(actual() + 1); });
    var pendiente = false;
    pista.addEventListener('scroll', function () {
      if (pendiente) return; pendiente = true;
      requestAnimationFrame(function () { pendiente = false; marcar(); });
    });
    nav.appendChild(ant); nav.appendChild(puntos); nav.appendChild(sig);
    car.appendChild(nav);
    marcar();
    // Los carruseles .cs-auto pasan solos cada 2 s, en bucle, mientras se ven en pantalla. Se paran mientras el
    // ratón está encima o el dedo toca, y no avanzan si el sistema pide reducir el movimiento.
    if (car.classList.contains('cs-auto') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var visible = false, quieto = false;
      setInterval(function () { if (visible && !quieto && !document.hidden) ir(actual() + 1); }, 2000);
      car.addEventListener('mouseenter', function () { quieto = true; });
      car.addEventListener('mouseleave', function () { quieto = false; });
      car.addEventListener('touchstart', function () { quieto = true; }, { passive: true });
      car.addEventListener('touchend', function () { setTimeout(function () { quieto = false; }, 4000); }, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.5 }).observe(car);
      } else { visible = true; }
    }
  });
})();
</script>
