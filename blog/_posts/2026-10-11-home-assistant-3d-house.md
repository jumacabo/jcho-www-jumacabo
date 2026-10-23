---
title: "My house has a live 3D digital twin"
seo_title: "Home Assistant 3D dashboard: a live digital twin of my house"
description: "I started from the floor plans and a few photos. I ended up with a 3D replica of my house that moves with what happens in it, and from which I run the whole place."
tags: [home-assistant, threejs, blender, 3d, dashboard, ai]
cover: /blog/media/home-assistant-3d-house/cover.jpg
---

**TL;DR:** I've turned my house into a 3D replica that lives in the browser and moves with what's really happening in it. Home Assistant is the brain; this is its face.

- I started from the house's floor plans and a few photos. Python scripts build the model in Blender, and from there it jumps to the web with Three.js.
- Everything you see is real: awnings, garage door, washing machine, cars, smoke, rain, wind… Every single thing moves because a real sensor says so.
- It's not just for looking: one click turns on a light, moves an awning or opens the garage door. And when something happens, the camera takes you there.
- It has a real mode and a simulated mode, and it works inside Home Assistant without asking for credentials and outside it too: on your phone, in Spanish and English, in light and dark mode.
- I built it in about two weeks with the help of AI. The code isn't public, for now.
- It all runs at home, in Docker containers: no services to sign up for, no monthly fees. The only investment was a handful of AI tokens to build it.

It's pouring outside. On the screen, too: clouds close in over the roof, the rain falls as hard as [my weather station](https://www.ecowitt.com/shop/goodsDetail/245) says it does, the hammock in the back garden sways and the fringes on the awnings flap with every gust. The car is in the garage, because the camera can see it. And the washing machine, which finished a while ago, has a laundry basket next to it to remind me that someone needs to empty it. It's not just a pretty animation: it's my house, right now.

<figure>
<iframe src="https://www.youtube-nocookie.com/embed/WCuOerGPqBY" title="Home Assistant 3D Dashboard: my real house, live in sun, rain and night" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
<figcaption>The house, live: day and night, rain and wind, floor by floor.</figcaption>
</figure>

## The face of Home Assistant

Home Assistant does almost everything in my house: the automations, the alerts, the logic of what turns on and when. But its interface, however well you set it up, is cards: lists of things with their state. To find out what's going on, you have to read. And I wanted to *look*.

That's the idea behind the whole project. **Home Assistant is the brain and this is its face.** As an engine it's superb and I'm not trying to replace it: the logic and the automations are still all its own. What I didn't expect was this: almost everything I used to do every day in its usual interface, I now do from the 3D house. Turning on a light, checking the garage door is closed, seeing whether the washing machine has finished or who's home: I open the browser, take it in at a glance and sort it out right there.

## From floor plans and photos to Blender

It all started with the house's floor plans: the developer's PDFs, with the four floors (the basement with the garage, the ground floor, the first floor and the attic) and a dimensioned plan of each one.

<div class="cs-car">
<div class="cs-track">
<figure class="cs-slide cs-blanco"><img src="/blog/media/home-assistant-3d-house/planos-general.webp" alt="The original floor plans of the house: basement with garage, ground floor, first floor and attic" loading="lazy"><figcaption>The starting point: the floor plans of all four floors.</figcaption></figure>
<figure class="cs-slide cs-blanco"><img src="/blog/media/home-assistant-3d-house/planos-planta-baja.webp" alt="Dimensioned floor plan of the ground floor" loading="lazy"><figcaption>The dimensioned plan of the ground floor: this is where the walls, doors and windows come from, measurements included.</figcaption></figure>
</div>
</div>

The plans tell you where every wall, door and window goes. What they don't tell you is what furniture there is, what color the sofa is or where each lamp sits. That came from real photos of every room.

And here's the interesting bit: **I didn't model the house by hand.** It's described by Python scripts (where every wall, piece of furniture and lamp goes), and they're the ones that build the Blender file from scratch. If I want to move a piece of furniture, I change the data and generate the house again. And because a program generates it, every object comes out already labeled: this is a light, this is an awning, this is the garage door. Those labels will be key later on.

<figure class="cs-pc-sola"><img src="/blog/media/home-assistant-3d-house/blender.webp" alt="The house open in Blender: three floors cut away, with every object listed by name on the right" loading="lazy"><figcaption>The house in Blender, exactly as the scripts generate it: on the right, every object with its name (the hammock, the lemon tree, the string lights…), just as if a person had built it by hand.</figcaption></figure>

The style was settled early: isometric and cozy, nothing photorealistic. More dollhouse than photo.

## First idea: still images

My first plan was much more modest: render still images of each floor from several angles, in day and night versions, turn the lights on or off according to their state in Home Assistant, and switch to the night version at sunset.

<div class="cs-car">
<div class="cs-track">
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/render-planta-baja-vistas.webp" alt="Ground floor seen from above and in two cross-sections" loading="lazy"><figcaption>The ground floor from above and in two cross-sections.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/render-exterior-noche.webp" alt="The outside of the house at night, with the garden lights on" loading="lazy"><figcaption>The house from outside, at night: the idea was to have day and night versions and switch between them depending on the time.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/render-planta-baja.webp" alt="Cutaway render of the ground floor with the living room and kitchen" loading="lazy"><figcaption>The ground floor, with the roof off.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/render-sotano.webp" alt="Cutaway render of the basement with the garage and the car" loading="lazy"><figcaption>The basement, with the garage.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/render-primera-noche.webp" alt="Cutaway render of the first floor at night with the bedside lamps on" loading="lazy"><figcaption>The first floor at night, with the lamps on.</figcaption></figure>
</div>
</div>

It worked, but it fell short fast. Every light you want to show on or off multiplies the number of images you need, the camera is fixed and nothing moves: not an awning, not a door, not the rain.

## The leap to 3D on the web

Then I thought: if the whole house is already in 3D inside Blender, why settle for pictures of it? We took it to the web with Three.js, the best-known 3D library for browsers. The first time I saw it spin in the browser, with its light and shadows, I knew it had far more potential than a set of images.

In just four days we went from still images to having the house in the browser. From there we hooked it up to my real Home Assistant, and the question changed. It was no longer "what images do I need?" but "how much of what I know about my house can I show here?".

## Everything you see is real

This is the part I'm proudest of: there are no props in the 3D house. If something moves, lights up or changes, it's because a real sensor said so. The second video starts with the floor plan, raises the house and then walks you through it.

<figure>
<iframe src="https://www.youtube-nocookie.com/embed/BSulm_5bLbA" title="Home Assistant 3D Floorplan: every real sensor in my house, live" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
<figcaption>From floor plan to house, and then its devices: the kitchen, the fridges, the leak next to the washing machine, the smoke, the TV, the motion and the lights at night.</figcaption>
</figure>

A few examples:

- **The weather.** The rain falls as hard as [my weather station](https://www.ecowitt.com/shop/goodsDetail/245) measures. The wind moves the hammock in the back garden, the fringes on the awnings and the anemometer, which spins according to how hard it's blowing.
- **The sun.** It's where it really is, based on the time and the real orientation of the house, shadows included. The day and night from my first idea now happen on their own.
- **Awnings and shutters.** They're open exactly as far as they really are, from 0 to 100%. In Home Assistant they're *covers*.
- **The cars.** The one in the garage only appears if the camera can see it, thanks to [Frigate](https://github.com/blakeblackshear/frigate). The electric one on the ramp also glows while it's charging and shows on its rear window how long it has left.
- **The washing machine.** A power meter knows when it starts and when it finishes, and a sensor on the door knows whether you've emptied it. If you haven't, a laundry basket appears next to it.
- **Smoke and water.** The smoke detectors are real: if one goes off, its room fills with smoke. If a leak sensor detects water, a puddle appears.
- **Temperatures.** Every fridge, every freezer and every room with a sensor shows its own.
- **Motion.** When a sensor detects someone, the floor of that room turns blue and ripples spread out.
- **People.** Everyone appears in the room they're in, sitting in their usual spot: the sofa, the office chair…
- **The solar panels.** They fill up with yellow according to what they're producing, with the kW printed on them.

<details markdown="1">
<summary>The full inventory: what's behind each thing</summary>

| What you see | What detects it | In Home Assistant | Brand and model |
|---|---|---|---|
| Rain, by intensity | Rain gauge and rain sensor | `sensor`, `binary_sensor` | [Ecowitt Wittboy](https://www.ecowitt.com/shop/goodsDetail/245) |
| Hammock, awning fringes and anemometer | Anemometer: wind and gusts | `sensor` (km/h) | [Ecowitt Wittboy](https://www.ecowitt.com/shop/goodsDetail/245) |
| Sun, light and shadows | The time and the house's orientation | `sun` | — |
| People in their room | Bluetooth signal strength of our phones | `person` + area | 21 Bluetooth proxies ([Atom Echo](https://docs.m5stack.com/en/atom/atomecho) and [Shelly](https://www.shelly.com/)) + [my own positioning engine](/blog/bluetooth-trilateration/) |
| Awnings from 0 to 100% | Z-Wave motors | `cover` | Z-Wave, with [Z-Wave JS UI](https://github.com/zwave-js/zwave-js-ui) |
| Garage door | Contact sensor and relay | `binary_sensor`, `switch` | [Aqara Door and Window Sensor](https://www.aqara.com/en/product/door-and-window-sensor/) + [Shelly Plus 1](https://kb.shelly.cloud/knowledge-base/shelly-plus-1) |
| Front gate and its opener | Contact sensor and relay | `binary_sensor`, `switch` | [Aqara Door and Window Sensor](https://www.aqara.com/en/product/door-and-window-sensor/) + [Shelly 1](https://kb.shelly.cloud/knowledge-base/shelly-1) |
| Lock on the door to the garage | Smart lock | `lock` | [Nuki](https://nuki.io/en/) |
| Roller shutters | Shutter controller | `cover` | [Shelly 2PM](https://www.shelly.com/products/shelly-2pm-gen3-1) |
| Doors and windows | Contact sensors | `binary_sensor` | [Aqara Door and Window Sensor](https://www.aqara.com/en/product/door-and-window-sensor/) |
| Car in the garage | Camera and object detection | `binary_sensor` | [Frigate](https://github.com/blakeblackshear/frigate) |
| Electric car charging | Car integration and the charger's power draw | `binary_sensor`, `sensor` | Volvo XC60 + [Shelly Plug](https://www.shelly.com/collections/smart-plugs) |
| Washing machine: running, door and needs emptying | Power draw and door sensor | `binary_sensor`, `input_boolean` | [Aqara Door and Window Sensor](https://www.aqara.com/en/product/door-and-window-sensor/) + [Shelly Plug](https://www.shelly.com/collections/smart-plugs) |
| Dishwasher, oven, hob and microwave | Energy meter | `binary_sensor`, `sensor` | [Shelly EM](https://www.shelly.com/products/shelly-em-50a-clamp-1) |
| Boiler and treadmill | Smart plugs with power metering (from the treadmill's power draw you can even tell how fast you're walking) | `binary_sensor`, `sensor` | [Shelly Plug](https://www.shelly.com/collections/smart-plugs) |
| TVs: on, volume and time | Media player | `media_player` | [Samsung Smart TV integration](https://www.home-assistant.io/integrations/samsungtv/) |
| Smoke filling the room | Smoke detectors | `binary_sensor` | [Aqara Smoke Detector](https://www.aqara.com/en/product/smoke-detector/) |
| Puddles | Leak sensors | `binary_sensor` | [Aqara Water Leak Sensor](https://www.aqara.com/en/product/water-sensor/) |
| Temperature of fridges and rooms | Temperature sensors | `sensor` | [Aqara Temperature and Humidity Sensor](https://www.aqara.com/en/product/temperature-humidity-sensor/) |
| Solar panels | Energy meter (and the inverter, for faults) | `sensor`, `binary_sensor` | [Shelly EM](https://www.shelly.com/products/shelly-em-50a-clamp-1) |
| Lights and LED strips | — | `light` | [WLED](https://kno.wled.ge/), [Philips Hue](https://www.philips-hue.com/en-us), [Shelly](https://www.shelly.com/), [Govee](https://www.govee.com/) |
| Air conditioners | — | `climate` | [Mitsubishi Electric MELCloud](https://www.melcloud.com/) |

</details>

## Prettier and more alive

With the data in, I realized it wasn't just about seeing it. What if we made it pretty and lively too? That's where the most fun part began: the animations.

Almost all of them are prepared in Blender, like in a film (opening a door, extending an awning, turning on a lamp), and the web plays them when Home Assistant says it's time.

- **What opens, opens gradually:** doors and windows, with all their panes; awnings, shutters and the garage door; even the curtains, which draw back when their window opens.
- **What's running, shows it:** the blades of the fans and of the air conditioners' outdoor units spin; the dishwasher door turns see-through so you can watch the spinning arms and the jets; the microwave plate turns with a chicken inside, steam rises from the pot on the hob and the electric fly zappers crackle.
- **The weather:** the wind, in steps, moves the trees, the hammock and the awning fringes. When it rains, the sky clouds over, the light softens and drops fall, more of them and faster the harder it rains.
- **The house itself:** switching floors fades everything; the floors pull apart like a model opening up; and from the floor plan the walls rise and the furniture drops into place, like at the start of the second video.
- **And a bit of poetic license:** some birds that fly around and land on the railings and the roof. No sensor measures those.

And since the house is truly 3D and not a picture, it can also change its look. Besides the normal one, there's scale model, drawing, color illustration, paper and cardboard, colored clay and architectural plan, which turns the house back into the plan it came from, dimensions included. It switches from one look to another with a sweep of light, and everything keeps working the same: the lights, the awnings, the people…

<div class="cs-car cs-auto">
<div class="cs-track">
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/aspecto-plano.webp" alt="Ground floor as an architectural plan with walls, doors and dimensions" loading="lazy"><figcaption>Architectural plan: walls, doors and dimensions.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/aspecto-maqueta.webp" alt="Ground floor with the scale model look: soft warm colors, no textures" loading="lazy"><figcaption>Scale model: soft colors and no textures, like an architect's model.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/aspecto-dibujo.webp" alt="Ground floor with the drawing look: ink outlines on paper" loading="lazy"><figcaption>Drawing: just the outlines, in ink on paper.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/aspecto-papel.webp" alt="Ground floor with the paper and cardboard look: everything in one cardboard tone" loading="lazy"><figcaption>Paper and cardboard: everything in a single tone, as if cut out of card.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/aspecto-normal.webp" alt="Ground floor of the 3D house with its normal look: real materials and colors" loading="lazy"><figcaption>Normal: the usual materials and colors.</figcaption></figure>
</div>
</div>

## Not just for looking: you can control it too

The 3D house isn't just a mirror: it's a remote control too. Click a lamp and it turns on. Click an LED strip and it turns on with its effect; right-click it to pick another. I can raise or lower awnings and shutters, change a TV's volume or the air conditioner's temperature, lock the door to the garage or open the gate to let someone in.

There are two details I really like. First: just like in real life, what you ask for doesn't change instantly. It stays pending until Home Assistant confirms it has really happened, and only then does it change. Second: the sensitive stuff, like the garage door, the gate or the lock, asks for confirmation first.

<div class="cs-car">
<div class="cs-track">
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/mando-porton.webp" alt="Confirmation dialog before opening the real garage door from the 3D house" loading="lazy"><figcaption>The sensitive stuff asks for confirmation: this opens the real garage door.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/mando-tele.webp" alt="Living room TV menu with time on, power use, volume and mute controls" loading="lazy"><figcaption>The living room TV: how long it's been on, its power draw, the volume and mute.</figcaption></figure>
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/mando-toldo.webp" alt="Awning menu with options from retracted to fully open" loading="lazy"><figcaption>An awning: from retracted to fully open, via 25, 50 or 75%.</figcaption></figure>
</div>
</div>

## The house tells you what's happening

With so much on screen, something was missing: the house telling me what's going on. Dynamic views do exactly that. When something happens, the camera moves to that room on its own, highlights it for a moment and a banner at the bottom says what happened.

Someone walks into the office and the motion sensor picks it up. The terrace door opens. Someone moves from the kitchen to the living room. The garage door starts going up. A smoke detector goes off. Each time, the camera goes there and shows you. You don't have to look for anything: the house tells you.

<figure><img src="/blog/media/home-assistant-3d-house/vistas-dinamicas.webp" alt="Dynamic views: the camera moves on its own to the office and the garage as motion is detected, lights turn on and the garage door opens" loading="lazy"><figcaption>Dynamic views in action: motion in the office, the stair light turns on, the garage door opens and its light comes on. The camera goes to each spot, and what just happened is logged at the bottom.</figcaption></figure>

## How it all fits together

For non-programmers, the idea is simple: there are three pieces, and each one only knows its own job.

- **The model** describes the house: walls, furniture, lights. It knows nothing about Home Assistant.
- **Two configuration files** act as the bridge. The *links* say which Home Assistant entity each thing in the house is ("this lamp is the living room light"). The *profiles* say how each type of thing is interpreted ("an awning at 40% is drawn like this").
- **Home Assistant** provides the logic. If something needs working out, it works it out; the web only reacts to what it receives.

That's why the engine isn't tied to my house: with another model and other links, it would work for any house.

<figure class="cs-dg-fig">
<div class="cs-dg">
<div class="cs-ph" style="--c:#dd6b3d">
<div class="cs-phh"><span class="cs-num">1</span><b>Build the house</b><span>done once</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 11h7v6H9zM12.5 11v6"/></svg></span><b>Floor plans and photos</b><small>The developer's PDFs and photos of every room</small><span class="cs-chips"><span>PDF</span><span>JPG</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg></span><b>The house data</b><small>Scripts that describe walls, furniture and lights</small><span class="cs-chips"><span>Python</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M12 2.5 3.5 7v10l8.5 4.5 8.5-4.5V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/></svg></span><b>The house in 3D</b><small>Every object labeled: light, awning, door…</small><span class="cs-chips"><span>Blender</span></span></div>
</div>
<div class="cs-side"><span class="cs-nota">before the web, the first idea</span><div class="cs-card cs-mini"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="9.5" r="1.8"/><path d="m21 15.5-5-5-9.5 9.5"/></svg></span><div><b>Still images</b><small>Day and night renders</small></div></div></div>
</div>
<div class="cs-join" style="--c1:#dd6b3d;--c2:#7465f6"><span>export</span></div>
<div class="cs-ph" style="--c:#7465f6">
<div class="cs-phh"><span class="cs-num">2</span><b>Connect it to Home Assistant</b><span>configuration, no code</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.2l8.4 4.6"/></svg></span><b>The model for the web</b><small>One piece per object, with its animations</small><span class="cs-chips"><span>glTF</span></span></div>
<span class="cs-arr cs-mas"><svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1"/></svg></span><b>Links</b><small>Which Home Assistant entity each thing is</small><span class="cs-chips"><span>YAML</span></span></div>
<span class="cs-arr cs-mas"><svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></svg></span><b>Profiles</b><small>How each type of thing is interpreted</small><span class="cs-chips"><span>YAML</span></span></div>
</div>
</div>
<div class="cs-join" style="--c1:#7465f6;--c2:#0ea5e9"><span>live</span></div>
<div class="cs-ph" style="--c:#0ea5e9">
<div class="cs-phh"><span class="cs-num">3</span><b>Live in it</b><span>in real time</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12.5" rx="2.5"/><path d="M8.5 20.5h7M12 16.5v4"/><path d="m12 6.8 3 1.6v3.2l-3 1.6-3-1.6V8.4zM9 8.4l3 1.6 3-1.6M12 10v3.2"/></svg></span><b>The 3D website</b><small>The house in the browser, on any screen</small><span class="cs-chips"><span>Three.js</span></span></div>
<span class="cs-arr cs-dos"><svg viewBox="0 0 24 24"><path d="M4 8.5h15M15.5 5l3.5 3.5-3.5 3.5M20 15.5H5M8.5 12 5 15.5 8.5 19"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M4 7h11M11 3.5 15 7l-4 3.5"/><path d="M20 17H9M13 13.5 9 17l4 3.5"/><circle cx="19" cy="7" r="1.6"/><circle cx="5" cy="17" r="1.6"/></svg></span><b>The gateway</b><small>Translates using the links and profiles; it can also simulate</small><span class="cs-chips"><span>Node.js</span></span></div>
<span class="cs-arr cs-dos"><svg viewBox="0 0 24 24"><path d="M4 8.5h15M15.5 5l3.5 3.5-3.5 3.5M20 15.5H5M8.5 12 5 15.5 8.5 19"/></svg></span>
<div class="cs-card cs-cerebro"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 9.5V20h13V9.5"/><circle cx="12" cy="13.2" r="1.7"/><path d="M12 15v2.6M10.4 12.3 8.6 11M13.6 12.3l1.8-1.3"/><circle cx="8" cy="10.6" r=".9"/><circle cx="16" cy="10.6" r=".9"/><circle cx="12" cy="18.3" r=".9"/></svg></span><b>Home Assistant</b><small>The brain: states, commands and automations</small><span class="cs-chips"><span>WebSocket</span></span></div>
</div>
<div class="cs-out">
<span class="cs-outl"><span>shown in</span></span>
<div class="cs-card cs-mini"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16M5.5 8h1.5M5.5 11h1.5M5.5 14h1.5"/></svg></span><div><b>A panel inside Home Assistant</b><small>No credentials needed, in the app too</small></div></div>
<div class="cs-card cs-mini"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="13" height="10" rx="1.8"/><path d="M1.5 18h15"/><rect x="16.5" y="8" width="5.5" height="11" rx="1.4"/><path d="M18.6 16.8h1.3"/></svg></span><div><b>A standalone website</b><small>On a phone or a computer, with the Home Assistant login</small></div></div>
</div>
</div>
</div>
<figcaption>From floor plans to the browser: what each piece does.</figcaption>
</figure>

<details markdown="1">
<summary>For the techies: the stack</summary>

- **Model:** Python scripts generate the Blender file from scratch, with metadata on every object (what it is, its key, its floor). The still images come from there too.
- **Export:** binary glTF (GLB) compressed with Draco, one node per object, with its animations (open, turn on…).
- **Web:** Three.js with post-processing (ambient occlusion and SMAA antialiasing). Vite in development and nginx in production.
- **Gateway:** Node.js. It talks to Home Assistant through its WebSocket API, translates using the links and profiles (YAML) and also acts as a simulated Home Assistant.
- **Authentication:** OAuth2 against Home Assistant (like its apps) for the standalone website, and a custom panel (`panel_custom`) that hands the website the token of the open session.
- **Video:** the demo videos are rendered in the browser itself, frame by frame, as MP4 at up to 4K and 60 fps.
- **Deployment:** Docker containers (the image is built by GitHub Actions) on a server at home, with no cloud services or fees.
- **Testing:** automated tests in a real browser (Playwright) that walk through the house, take screenshots and check the scene.

</details>

## Built for everyday use

### Real house and simulated house

The website has two modes, and a switch flips between them. In real mode, everything is what Home Assistant says and commands go to the actual house. In simulated mode, the house disconnects: I can turn on, turn off, open and "break" whatever I like without touching anything real.

The best part is that when you switch from real to simulated, the simulation starts with everything exactly as it was at that moment and carries on by itself from there. Going back to real is instant. And the simulation behaves like the real house: what you ask for also stays pending for a moment before it changes.

### Inside Home Assistant and outside it

Inside Home Assistant, the house shows up as just another panel in the sidebar, in the phone app too, and it doesn't ask for credentials: it uses the session you already have open. Outside, it's a normal website. If you're not signed in, it sends you to your Home Assistant's login screen, the same one its apps use, and then brings you back. Either way, whatever you do is done in your name.

<figure class="cs-dispositivos">
<div><img class="cs-pc" src="/blog/media/home-assistant-3d-house/panel-ha-claro.webp" alt="The 3D house as a panel inside Home Assistant on Windows, in light mode" loading="lazy"><img class="cs-tel" src="/blog/media/home-assistant-3d-house/app-ha-claro.webp" alt="The 3D house inside the Home Assistant iPhone app, in light mode" loading="lazy"></div>
<div><img class="cs-pc" src="/blog/media/home-assistant-3d-house/panel-ha-oscuro.webp" alt="The 3D house as a panel inside Home Assistant on Windows, in dark mode" loading="lazy"><img class="cs-tel" src="/blog/media/home-assistant-3d-house/app-ha-oscuro.webp" alt="The 3D house inside the Home Assistant iPhone app, in dark mode" loading="lazy"></div>
<figcaption>Inside Home Assistant, on the computer and in the iPhone app, in light and dark mode: just another panel in the sidebar, with no credentials needed.</figcaption>
</figure>

<figure class="cs-pc-sola"><img src="/blog/media/home-assistant-3d-house/web-independiente.webp" alt="The standalone 3D house website in a desktop browser, outside Home Assistant" loading="lazy"><figcaption>And outside it, as just another website in any browser, signing in with your Home Assistant user.</figcaption></figure>

### On your phone, in two languages, day and night

It adapts to any screen (including Safari on the iPhone, which put up a fight) and runs at a sustained 60 frames per second, on both the iPhone and the computer. It's in Spanish and English, and it has light and dark mode, which follows the system by default.

### A demo editor

To show it off, I built a demo editor: tours with their own camera moves, titles, tooltips and what happens at each moment (this turns on, that opens), with a timeline to jump to any point and undo whatever you don't like. Each demo can be downloaded as an MP4 video, at up to 4K and 60 fps, rendered in the browser itself. Both videos in this post come straight out of the editor, untouched; the only thing I added afterwards, with FFmpeg, was the music.

<div class="cs-car cs-ancho">
<div class="cs-track">
<figure class="cs-slide"><img src="/blog/media/home-assistant-3d-house/editor-demos.webp" alt="The demo editor with its steps grouped by color and the timeline at the bottom" loading="lazy"><figcaption>The demo editor: the steps, in color-coded groups (from plan to house, the dishwasher, the water leak, the smoke detector…), and the timeline at the bottom.</figcaption></figure>
<figure class="cs-slide cs-encaja"><img src="/blog/media/home-assistant-3d-house/editor-paso.webp" alt="Editing a demo step: the dishwasher starts together with the previous step, 2.5 seconds later" loading="lazy"><figcaption>Editing a step: the dishwasher starts together with the previous step, 2.5 s later. Each step can be previewed, played, duplicated or deleted.</figcaption></figure>
</div>
</div>

## Built with AI

A confession: I didn't write most of this line by line. I built it with AI agents in [GitHub Copilot](https://github.com/features/copilot), mainly with the **Claude Opus 5.5** and **GPT-6 Astra** models.

What worked best was giving them clear rules from the start:

- **Everything generic.** No hacks for my house: the engine has to work for someone else's.
- **Nothing hard-coded.** Every specific value goes in a configuration file, not in the code.
- **No logic in the web.** If something needs working out, Home Assistant does it.
- **Quality first, even in a hurry.** And no tests that pass sometimes and fail other times.
- **Before a big change, the plan.** Explain it to me and wait for my go-ahead.
- **Watch the progress live.** The website open in my browser while they work.
- **My real house is look-only.** Tests never send it commands.

<div class="cs-cifras">
<div><b>14</b><span>days of work</span></div>
<div><b>99+</b><span>commits</span></div>
<div><b>99+</b><span>linked devices</span></div>
<div><b>2</b><span>AI models</span></div>
</div>

## The hard parts

Not everything was as pretty as in the videos. A few stories:

- **The awnings work backwards.** They're Z-Wave and report their position the other way round: to them, retracted means "open". In the 3D house they showed up extended exactly when they were rolled up, until we told the house to read them backwards.
- **The shutters don't say where they are.** They only report their position once they get there. While they're moving, the web animates them by working out where they should be: I timed them, and they take 25 seconds from end to end.
- **It wouldn't even load on the iPhone.** Safari lacks a browser feature we were using to run tasks in idle moments. We had to write our own version.
- **Logging in, inside the app.** In the Home Assistant app, its login screen doesn't work inside a panel. That's why the panel hands the website the session you already have open.

## Q&A

### Where's the code?

It's not public for now. The part that generates the house in Blender is very specific to mine; the website, on the other hand, is already generic and can show any house. It's all a work in progress, and I won't publish it until the whole thing is general enough.

### How do you know which room everyone is in?

When I published this post, I was using the [Bermuda BLE Trilateration](https://github.com/agittins/bermuda) integration for this. A few days later I replaced it with my own engine: 21 Bluetooth proxies spread around the house (Shelly devices and Atom Echo boards) hear our phones, and the engine uses the house's 3D model to work out where each of us is. I tell the whole story in [this other post](/blog/bluetooth-trilateration/).

### Does it replace Home Assistant?

No. Home Assistant is the beast behind it: the engine, all the logic and all the automations. This is the interface. That said, for day-to-day stuff, it's often all I need.

### Could I use it in my house?

The website already works for any house, but today it needs a model of the house built the way mine is, and that part is still very specific. See the first question.

### Is it safe to open from outside the house?

Without a session you see nothing: you sign in with your Home Assistant account, and whatever you do is done in your name.

### How long did it take?

About two weeks, with help from AI.

### How much does it cost to run?

Nothing per month. It all runs at home, in Docker containers, with no services to sign up for. The only investment was a handful of AI tokens.

### Is it smooth on a phone?

Yes: a sustained 60 frames per second, on both the iPhone and the computer.

## What's next

- **More animations.** I love them, and there are still things at home that don't show up: the Amazon Ring doorbell when someone rings, the power I'm pulling from the grid, water usage…
- **Other views.** For example, one of the home network, with the seven routers and where the cables run.
- **The cameras.** Bringing the 13 cameras at home into the 3D house itself.
- **Publishing the code,** once the part that generates the house is generic enough to work for other houses.

What about you? If you had your house in 3D, which sensor would you want to see move first? Let me know in the comments.

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
  var PREV = '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>';
  var NEXT = '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>';
  function button(svg, label) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cs-btn'; b.innerHTML = svg; b.setAttribute('aria-label', label);
    return b;
  }
  document.querySelectorAll('.cs-car').forEach(function (car) {
    var track = car.querySelector('.cs-track');
    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 2) return;
    var nav = document.createElement('div'); nav.className = 'cs-nav';
    var dots = document.createElement('div'); dots.className = 'cs-dots';
    var prev = button(PREV, 'Previous'), next = button(NEXT, 'Next');
    function current() {
      var x = track.scrollLeft, best = 0;
      slides.forEach(function (s, i) { if (Math.abs(s.offsetLeft - slides[0].offsetLeft - x) < Math.abs(slides[best].offsetLeft - slides[0].offsetLeft - x)) best = i; });
      return best;
    }
    function go(i) {
      i = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });
    }
    var dotButtons = slides.map(function (s, i) {
      var d = document.createElement('button');
      d.type = 'button'; d.setAttribute('aria-label', 'Image ' + (i + 1) + ' of ' + slides.length);
      d.addEventListener('click', function () { go(i); });
      dots.appendChild(d);
      return d;
    });
    function mark() { var c = current(); dotButtons.forEach(function (d, i) { d.classList.toggle('on', i === c); }); }
    prev.addEventListener('click', function () { go(current() - 1); });
    next.addEventListener('click', function () { go(current() + 1); });
    var queued = false;
    track.addEventListener('scroll', function () {
      if (queued) return; queued = true;
      requestAnimationFrame(function () { queued = false; mark(); });
    });
    nav.appendChild(prev); nav.appendChild(dots); nav.appendChild(next);
    car.appendChild(nav);
    mark();
    // .cs-auto carousels advance on their own every 2 s, looping, while they are on screen. They pause while the
    // mouse is over them or a finger touches them, and they don't advance if the system asks for reduced motion.
    if (car.classList.contains('cs-auto') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var visible = false, paused = false;
      setInterval(function () { if (visible && !paused && !document.hidden) go(current() + 1); }, 2000);
      car.addEventListener('mouseenter', function () { paused = true; });
      car.addEventListener('mouseleave', function () { paused = false; });
      car.addEventListener('touchstart', function () { paused = true; }, { passive: true });
      car.addEventListener('touchend', function () { setTimeout(function () { paused = false; }, 4000); }, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.5 }).observe(car);
      } else { visible = true; }
    }
  });
})();
</script>
