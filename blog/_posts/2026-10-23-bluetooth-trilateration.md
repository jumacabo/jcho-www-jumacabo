---
title: "My house knows which corner I'm in"
description: "21 Bluetooth proxies, the 3D model of my house and an engine of my own: Home Assistant knows where each of us is to within about 1.5 meters, without Bermuda."
tags: [home-assistant, bluetooth, presence, esphome, 3d, ai]
cover: /blog/media/bluetooth-trilateration/cover.jpg
---

**TL;DR:** Home Assistant no longer just knows which room each of us is in: it knows the exact spot, to within about a meter and a half. And I can watch it live in the 3D house.

- With Bermuda, the more Bluetooth proxies I added, the worse it got: people jumped from room to room, and even from floor to floor.
- Since I already had the house in 3D, with every wall, every floor slab and all 21 proxies where they really are, I built my own engine. It works out what signal each proxy should hear from every point in the house and compares it with what it actually hears.
- You can teach it: stay in one spot with your phone for a while and it learns what that spot sounds like.
- It reads Bluetooth through a Home Assistant integration of my own. It doesn't depend on Bermuda at all.
- It publishes each person's area, floor, confidence and X, Y, Z coordinates to Home Assistant, and the 3D house draws them.
- Everything runs at home, in Docker. I built the core in two days, with AI.

While I take the screenshots for this post, I'm in my office, in the basement. In the 3D house, my circle sits next to the desk, with dashed lines running from it to the Bluetooth proxies that weighed most in placing me there: the office's Atom Echo, 25%; the smart plug on the LEGO shelves, 14%… Upstairs, Ruth is in the living room. If she gets up and goes to the kitchen, a few seconds later her circle glides over there.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/casa3d-ondas.webp" alt="Animated view of the office in the 3D house: blue waves pulse from the Bluetooth proxies and dashed lines link the person at his desk to the proxies that weigh most in locating him, with their percentage" loading="lazy"><figcaption>My office in the 3D house, live, with the waves from the Bluetooth proxies.</figcaption></figure>

## Knowing the room wasn't enough

In the [3D house post](/blog/home-assistant-3d-house/) I said I knew which room everyone was in thanks to [Bermuda BLE Trilateration](https://github.com/agittins/bermuda), a very popular Home Assistant integration. Three days after publishing it, that was no longer true.

Bermuda listens to our phones' Bluetooth through Home Assistant's proxies: devices spread around the house that hear the Bluetooth signals around them and pass them on. I started with four [Atom Echo](https://docs.m5stack.com/en/atom/atomecho) units, tiny ESP32 boards running ESPHome, and it worked reasonably well. Logic said more proxies would make it better. So I enabled more.

It got worse. People kept jumping from one place to another. The clearest case was the living room: it has a proxy and, right above it, the bedroom has another, with a floor slab in between. Sitting on the sofa, I'd flip from the ground floor to the first floor and back.

The obvious question: if it's called *BLE Trilateration*, how can it not trilaterate? Well, it doesn't. Its own README says so: it locates by room, and working out a position on a map is left for later: *"(eventually) Triangulate device positions! Like, on a map. Maybe."* To pick the room, Bermuda goes with the proxy that seems closest, with a small margin before switching. It doesn't combine what the others hear, and it doesn't know there's a floor slab between two floors. And with many proxies, each one is like a lottery ticket: there's almost always one that wins thanks to a spike of noise. That's why the more I added, the worse it got.

For the record: Bermuda is a great project and it served me well. I started with it and I compared against it. But I wanted something else:

- **Not just the room, the spot too:** X, Y, Z coordinates inside the house.
- **No jumping around,** and above all no jumping between floors.
- **With its confidence:** knowing when it's sure and when it's in doubt.
- **For the 3D house to draw everyone where they actually are,** not in a fixed spot in their room.

## How it works, at a glance

Before getting into the details, the whole journey, from the house in Blender to each person in their place:

<figure class="cs-dg-fig">
<div class="cs-dg">
<div class="cs-ph" style="--c:#dd6b3d">
<div class="cs-phh"><span class="cs-num">1</span><b>Preparing the house</b><span>once, and whenever it changes</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M12 2.5 3.5 7v10l8.5 4.5 8.5-4.5V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/></svg></span><b>The house in Blender</b><small>Walls, floor slabs, furniture and the 21 proxies in place</small><span class="cs-chips"><span>Blender</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg></span><b>The exporter</b><small>Floors, rooms, doors, stairs and whatever blocks the signal</small><span class="cs-chips"><span>Python</span><span>bpy</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/></svg></span><b>The grid and the table</b><small>A point every 50 cm and, for each proxy and point, what lies in between</small><span class="cs-chips"><span>NumPy</span></span></div>
</div>
</div>
<div class="cs-join" style="--c1:#dd6b3d;--c2:#7465f6"><span>loaded into the engine</span></div>
<div class="cs-ph" style="--c:#7465f6">
<div class="cs-phh"><span class="cs-num">2</span><b>Listening</b><span>nonstop</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="m7 7 10 10-5 5V2l5 5L7 17"/></svg></span><b>The 21 proxies</b><small>14 Shelly devices and 7 Atom Echo boards hear our phones' Bluetooth</small><span class="cs-chips"><span>ESPHome</span><span>Shelly</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card cs-cerebro"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 9.5V20h13V9.5"/><circle cx="12" cy="13.2" r="1.7"/><path d="M12 15v2.6M10.4 12.3 8.6 11M13.6 12.3l1.8-1.3"/><circle cx="8" cy="10.6" r=".9"/><circle cx="16" cy="10.6" r=".9"/><circle cx="12" cy="18.3" r=".9"/></svg></span><b>Home Assistant</b><small>Recognizes each iPhone by its IRK, which never leaves it</small><span class="cs-chips"><span>Private BLE Device</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M9 2.5v5M15 2.5v5M6 7.5h12v4a6 6 0 0 1-12 0zM12 17.5v4"/></svg></span><b>The integration</b><small>Every second, what each proxy hears, under a pseudonym</small><span class="cs-chips"><span>jcho_trilateration</span></span></div>
</div>
</div>
<div class="cs-join" style="--c1:#7465f6;--c2:#0ea5e9"><span>readings</span></div>
<div class="cs-ph" style="--c:#0ea5e9">
<div class="cs-phh"><span class="cs-num">3</span><b>Locating and publishing</b><span>every second</span></div>
<div class="cs-row">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/></svg></span><b>The engine</b><small>The probability cloud, training and history</small><span class="cs-chips"><span>Python</span><span>Docker</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.8"/></svg></span><b>MQTT</b><small>Area, floor, confidence, X, Y, Z and key proxies</small><span class="cs-chips"><span>MQTT</span></span></div>
<span class="cs-arr"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
<div class="cs-card cs-cerebro"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 9.5V20h13V9.5"/><circle cx="12" cy="13.2" r="1.7"/><path d="M12 15v2.6M10.4 12.3 8.6 11M13.6 12.3l1.8-1.3"/><circle cx="8" cy="10.6" r=".9"/><circle cx="16" cy="10.6" r=".9"/><circle cx="12" cy="18.3" r=".9"/></svg></span><b>Home Assistant</b><small>Per-person entities, ready for automations</small><span class="cs-chips"><span>sensor</span></span></div>
</div>
<div class="cs-out">
<span class="cs-outl"><span>shown in</span></span>
<div class="cs-card cs-mini"><span class="cs-ico"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12.5" rx="2.5"/><path d="M8.5 20.5h7M12 16.5v4"/><path d="m12 6.8 3 1.6v3.2l-3 1.6-3-1.6V8.4zM9 8.4l3 1.6 3-1.6M12 10v3.2"/></svg></span><div><b>The 3D house</b><small>Each person in place, with their lines to the proxies</small></div></div>
<div class="cs-card cs-mini"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3.5 20.5h17M6.5 16l4-5 3.5 3 5-7"/></svg></span><div><b>The engine's web app</b><small>The floor plan with the cloud, the signals and training</small></div></div>
</div>
</div>
</div>
<figcaption>What each piece does. The following sections go through them one by one.</figcaption>
</figure>

<details markdown="1">
<summary>For the techies: the stack</summary>

- **Exporter:** Blender 5.2 as a Python module (`bpy`) inside a container, with Shapely for the outlines. It produces the house as JSON, lightweight geometry as GLB and the propagation table in NumPy.
- **Engine:** Python with asyncio: aiohttp for the API and the web app, aiomqtt for MQTT, NumPy for the filter and Pydantic to validate the configuration.
- **Integration:** a Home Assistant custom integration with its own WebSocket command, tested with `pytest-homeassistant-custom-component` pinned to the Home Assistant version.
- **Web app:** React 19 with Vite and uPlot for the charts, live over Server-Sent Events and served by the engine itself.
- **Data:** raw readings in daily JSONL files; history in SQLite; what it learns, in separate JSON files. The configuration, in a single YAML file.
- **Deployment:** Docker on a home server, behind a reverse proxy with authentication.

</details>

## The advantage: the house was already in 3D

To work out where someone is from what each proxy hears, you need two things: to know where each proxy is and to know what's in between. And I already had both.

The 3D house comes from Python scripts that build the Blender model from scratch, so the model knows where every wall, floor slab, door, staircase and piece of furniture is, even the false ceilings. All it was missing was the proxies. I added them where they really are: the smart plugs in their sockets, the relays in the false ceiling and the Atom Echo boards hanging from their USB cable or sitting on a shelf.

21 in total: 14 Shelly devices and 7 Atom Echo boards, spread across the four floors. And here's a detail I love: **the 14 Shellys were already in the house doing something else.** They switch lights, raise shutters, open the garage door or measure what the boiler uses. Turn on their Bluetooth and they work as proxies at no extra cost.

An exporter opens the Blender file (with Blender running inside a container) and pulls out what the engine needs:

- **Floors and rooms,** with their outlines, already linked to Home Assistant's floors and areas.
- **Doors,** with the rooms they connect, **and stairs,** with the floors they connect.
- **The proxies,** with their position and height.
- **Whatever blocks the signal:** walls, floor slabs, doors and windows, but also the fridge, the oven, mirrors, TVs or wardrobes.

From that it builds a grid of points every 50 cm, only where you can walk, and a table: for each proxy and each point, the distance and everything in between. It's the map everything else starts from.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/modelo-resumen.webp" alt="Model tab of the engine web: the exported Blender file with its counts of floors, rooms, connections, stairs, openings, proxies, RF objects and furniture, and the table of floors with their heights" loading="lazy"><figcaption>What the engine knows about the house, taken from the Blender file: 4 floors, 22 rooms, 29 connections, 3 staircases, 42 doors and windows, 21 proxies, 41 objects that block the signal and 175 pieces of furniture.</figcaption></figure>

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/modelo-proxies.webp" alt="Table of the Bluetooth proxies in the model with their hardware, mounting, floor, room, height and position" loading="lazy"><figcaption>Each proxy, with its model, how it's mounted (USB, plug or box), its floor, its room, its height and its position.</figcaption></figure>

## Good data first

Before thinking about algorithms, I looked at what was coming in. And very little was: for each person, between 15 and 18 readings per minute, and only 3 proxies heard them. No algorithm can do much with that.

Two settings fixed it:

- **ESPHome (the Atom Echo boards): listen 100% of the time.** Mine were listening for 30 ms out of every 320 ms, 9% of the time, which was the default in their version. Recent ESPHome versions already default to 100% on Wi-Fi devices, but it's worth checking:

  ```yaml
  esp32_ble_tracker:
    scan_parameters:
      interval: 320ms
      window: 320ms
  ```

- **Shelly Gen2 and later: Bluetooth scanner in "Auto" mode.** You change it in Home Assistant, in each Shelly's options (*Bluetooth scanner mode*).

Result: each person went from 15–18 to around 250 readings per minute, and from 3 to 14 proxies hearing them. Today, with all 21, sometimes every one of them hears us and over 500 readings per minute come in. **If you use Bermuda, this tip works for you too.**

They don't all hear the same, either. Real readings showed that a Shelly Plus 2PM hears about 12 dB less than an Atom Echo at the same distance, so the engine corrects each proxy according to its model.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/web-personas.webp" alt="For each phone, the list of proxies that hear it, from strongest to weakest, with signal strength and readings per minute" loading="lazy"><figcaption>What each proxy hears from each phone, from strongest to weakest. 17 of them hear me; Ruth, all 21.</figcaption></figure>

## From noise to a position

This is what comes in:

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/web-rssi.webp" alt="Chart of the Bluetooth signal strength of one phone at 21 proxies over an hour, with lines jumping 10 to 20 dB all the time" loading="lazy"><figcaption>The signal from my iPhone at each of the 21 proxies over an hour. Each line is a proxy.</figcaption></figure>

The lines swing 10 or 20 dB from one second to the next even if you don't move: your body blocks it, the signal bounces, the phone shifts position. Trying to get the distance to each proxy out of that and intersect circles, textbook style, doesn't work.

So the engine turns the question around. It doesn't ask "how far am I from each proxy?" but, for each point in the house: **"if I were here, what should each proxy hear?"** And it keeps the points where what should be heard comes closest to what is heard.

The expected signal comes from good old physics and from what the 3D model says:

<div class="cs-form">
<span class="cs-t"><b>Phone signal</b><small>at 1 meter</small></span>
<i>+</i>
<span class="cs-t"><b>Correction</b><small>for the proxy</small></span>
<i>−</i>
<span class="cs-t"><b>Distance</b><small>10 · n · log₁₀ d</small></span>
<i>−</i>
<span class="cs-t"><b>Walls</b><small>≈ 2 dB each</small></span>
<i>−</i>
<span class="cs-t"><b>Floor slabs</b><small>≈ 7 dB each</small></span>
<i>−</i>
<span class="cs-t"><b>Furniture and appliances</b><small>≈ 3 dB</small></span>
<i>=</i>
<span class="cs-t cs-res"><b>Expected signal</b><small>at that proxy</small></span>
</div>

The values came from real readings in my house, and there were surprises. Theory says a floor slab eats about 20 dB; here, about 7. And what matters is how many walls you cross, not how thick they are.

### One second in the life of the engine

The result isn't a point but a cloud: the probability that the person is at each point of the grid. Every second, the engine updates it in four steps:

<div class="cs-dg cs-pasos-fig">
<div class="cs-pasos" style="--c:#7465f6">
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg></span><b><span class="cs-n">1</span>Move</b><small>The cloud spreads to neighboring points as fast as someone can walk. To change floors you have to go through the stairs: no more jumping.</small></div>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4"/><circle cx="12" cy="12" r="1.8"/></svg></span><b><span class="cs-n">2</span>Listen</b><small>It compares what each proxy has heard in the last few seconds with what it should hear from each point. The points that fit win.</small></div>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M3 3l18 18M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4-2.4M19 12.9a10 10 0 0 0-3-2M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 11 5"/><circle cx="12" cy="20" r=".9"/></svg></span><b><span class="cs-n">3</span>Miss</b><small>If a proxy that should hear you doesn't, the area around it loses probability. Silence is information too.</small></div>
<div class="cs-card"><span class="cs-ico"><svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h12l-2.5 4.5L17 13H5"/></svg></span><b><span class="cs-n">4</span>Decide</b><small>The area only changes in Home Assistant if the new one reaches 60%, beats the current one by 15 points and holds that for 8 seconds.</small></div>
</div>
</div>

Inside the room, the exact spot comes from the signal accumulated over the last minute: if you stay still, it gets sharper; if you move, it takes a moment to catch up.

<figure class="cs-video"><video controls autoplay muted loop playsinline preload="metadata" poster="/blog/media/bluetooth-trilateration/recorrido.jpg" src="/blog/media/bluetooth-trilateration/recorrido.mp4" aria-label="Basement floor plan: the person's dot and probability cloud follow him from a corner of the garage to his desk in the office, with dashed lines to the key proxies"></video><figcaption>From the garage to my desk: the dot follows me across the floor plan, with its cloud and its lines to the key proxies. It's sped up: it really took about two and a half minutes, most of them with the dot already sharpening inside the office.</figcaption></figure>

Those lines are the **key proxies**: the four that weigh most in the engine placing you here and not somewhere else. And they're not necessarily the ones that hear you loudest. When I'm in the office, one of mine is the bedroom one, two floors up: it barely hears me, and that's precisely why it helps rule out that I'm up there.

A note for purists: technically this isn't textbook trilateration but a Bayesian filter over a grid. But it does what you'd expect from the word: it uses what all the proxies hear at once to get a position.

<details markdown="1">
<summary>For the techies: the model in detail</summary>

- **Propagation:** log-distance model with exponent 2.4 and a loss for every crossing of each kind of obstacle (wall, floor slab, stairs, roof, frames, door, window, metal, mirror, screen, sanitary ware, wood). The distances and crossings from each proxy to each point are precomputed at export time.
- **Cascading corrections:** each proxy inherits the defaults, then those of its hardware model and, if needed, its own.
- **Readings:** median of the last 3 s per proxy, with a robust likelihood that tolerates absurd readings and is "softened", because consecutive readings aren't independent: same body, same bounces.
- **Motion:** along the grid's edges, with a maximum speed of 1.5 m/s and symmetric (Metropolis) weights, plus a small probability of "appearing" anywhere to recover from errors.
- **Absences:** a live proxy that hasn't heard the person for 15 s penalizes the points where it would expect to hear them above −88 dBm.
- **Phone level:** at each point, a common offset of the phone across all proxies is estimated; that way what counts is how the signal is spread across proxies, not its absolute level.
- **Decision:** hysteresis via minimum probability, margin and dwell time before publishing an area change.

</details>

## Teaching it the house: training

The physical model is a good starting point, but every house has its quirks: a mirror, a built-in wardrobe, a fridge right in the way. That's what training is for.

In the engine's web app you pick a person, a room (or click the exact spot on the floor plan where you'll be) and how long; 10 minutes by default. You press *Start* and stay there with your phone the way you always carry it. While it runs, you see how often it gets it right and, if you picked an exact spot, the error in meters.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/entrenamiento.webp" alt="Training form: person, room, minutes and an exact point picked on the floor plan" loading="lazy"><figcaption>The form: person, room, minutes and, in this case, an exact spot in the living room clicked on the floor plan.</figcaption></figure>

<figure class="cs-par">
<div><img src="/blog/media/bluetooth-trilateration/entrenamiento-plano.webp" alt="Ground floor plan with a crosshair marking the exact point chosen for training, next to the person" loading="lazy"><img src="/blog/media/bluetooth-trilateration/sesiones-plano.webp" alt="Ground floor plan with the trained points drawn as diamonds and one past session highlighted" loading="lazy"></div>
<figcaption>On the left, the spot chosen for training, with its crosshair. On the right, the spots already trained on that floor, as diamonds, with one of Ruth's sessions highlighted.</figcaption>
</figure>

With what it learns, it does two things:

- **It recalibrates the model.** Using all the sessions, it fits by least squares the correction for each proxy, for each phone and for each kind of obstacle, plus the distance loss. All tied to the starting values: with little data, they barely move. Whatever still doesn't add up in a room stays as a small adjustment for that room and that proxy.
- **It stores references.** Each session at an exact spot becomes a fingerprint: at that spot, the engine expects exactly the signal it measured there, and up to a meter and a half around it, it blends that with the calculated one. That way it recognizes the spot even when physics can't explain it. It also remembers which proxies didn't hear you there.

In my house, 7 sessions brought the mean difference between measured and expected signal down from 6.7 to 3.4 dB. And at one of Ruth's trained spots, remembering which proxies don't hear her cut the mean error from 0.74 to 0.59 m.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/sesiones.webp" alt="List of the seven saved training sessions with date, person, room, minutes and accuracy; all of them exact points used as active references" loading="lazy"><figcaption>The 7 saved sessions, all at an exact spot and all as active references. The accuracy is what the engine had during each session.</figcaption></figure>

My advice: train first where it gets most confused, like rooms stacked on top of each other, and then a couple of minutes in your usual spots: the sofa, the table, the bed.

## How accurate is it?

### Against Bermuda

One afternoon, for an hour and a half, Bermuda and my engine ran side by side on the same readings, and the engine logged what each one said. My engine didn't have a single training session yet.

| Per hour | Bermuda | My engine |
|---|---|---|
| Room changes, me | 38.4 | 6.8 |
| Floor jumps, me | 15.5 | 1.9 |
| Room changes, Ruth | 78.6 | 1.9 |

And in total, between the two of us, Bermuda put us in a room for less than 30 seconds 157 times; my engine, 2.

The funny thing is that most of the time they agreed on the room: 88% of the time for me and 77% for Ruth. Bermuda didn't get the place wrong that often: what it did was jump around. With me it changed rooms every minute and a half and, with Ruth, every 45 seconds.

### The room and the spot

Nobody at home writes down where they are at every moment, so I used Home Assistant's other sensors as witnesses: the presence sensors and the indoor cameras, which detect people with [Frigate](https://github.com/blakeblackshear/frigate). With the engine as it is today:

- **In the office, 97%.** During the times I was home alone and the office presence sensor was detecting me, the engine had me there 97% of 6.7 hours.
- **In the living room, 98%.** While the living room camera saw someone, the engine had one of us there 98% of 19.5 hours.
- **The floor, over 90%.** And whenever any indoor camera saw someone, 34 hours in total, the engine had one of us on that floor more than 90% of the time.

For the spot inside the room I do have an exact ground truth: the 7 spots where I trained, marked on the floor plan to the centimeter. I ran those sessions through today's engine again, but without the training, as if they were new spots:

- **At 4 of the 7, the mean error is between 1 and 1.3 m.** Three are in the office and one in the living room.
- **At the other 3, between 2 and 3 m.** They're exactly the ones I trained because it failed there: two spots in the living room and the basement hall.
- **At a spot that's already trained, it drops to about 60 cm.** At Ruth's, the mean error is 0.59 m, and 9 times out of 10 it's within 0.82 m.

In short: around a meter and a half at any spot, and quite a bit less at the ones you've taught it.

The best part is that I don't have to trust my gut. The engine records every reading and can replay any stretch of time with different settings: I tell it "from this time to that time I was in the office" and it tells me how often it got it right. I test every change to the engine like this against real days before rolling it out.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/web-areas.webp" alt="Timeline of the areas the engine assigned to one person over an hour, with seven area changes" loading="lazy"><figcaption>An hour of mine according to the engine, room by room: 7 changes.</figcaption></figure>

To understand why the engine decides what it decides, its web app shows, for each person and proxy by proxy, the incoming signal against the one it expected at the most likely point, and flags the proxies that should hear the person and don't.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/web-posicion.webp" alt="Position tab of the engine web: training summary, basement floor plan and one card per person with area, coordinates, key proxies and measured versus expected signal" loading="lazy"><figcaption>The Position tab. At the top, the training summary. Below, the floor plan and each person's card: their area, their position, their key proxies and the measured versus expected signal; in orange, the proxies that should hear them and don't.</figcaption></figure>

## My own Home Assistant integration

At first, the engine got its readings from Bermuda: it has a service, `bermuda.dump_devices`, that returns what each proxy hears from each phone. And honestly, writing my own integration didn't appeal to me: I'd rather not touch Home Assistant. I ended up writing it the same day.

Why? For each proxy, Home Assistant keeps the latest Bluetooth advertisement from each device. But to the outside world it only offers the one from the proxy that hears each device best, and to locate someone you need what all of them hear. Bermuda solves this by being an integration that lives inside Home Assistant. So I did the same: `jcho_trilateration`.

- **What it does:** every second it checks all the proxies and sends the engine anything new from each phone it tracks: the time, the phone, the proxy and the signal.
- **How:** the engine subscribes with a Home Assistant WebSocket command, admin only. If no engine is connected, the integration does nothing. It only uses public Home Assistant APIs, has no options and creates no entities.
- **Privacy:** iPhones change their Bluetooth address every so often, and Home Assistant recognizes them by their IRK, a key from the phone itself, thanks to [Private BLE Device](https://www.home-assistant.io/integrations/private_ble_device/). The IRK never leaves Home Assistant: the engine only gets a pseudonym.

Before removing Bermuda, I had both running at once: in 3 minutes, Bermuda delivered 2,493 readings and my integration 2,523. I uninstalled it, and today the system doesn't depend on Bermuda at all.

What worried me most was maintenance: a Home Assistant update breaking it. Its automated tests use the exact Home Assistant version and fail if the integration uses anything Home Assistant has marked as deprecated, which it announces months in advance. Before updating Home Assistant, I run the tests against the new version.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/ha-integracion.webp" alt="The Jcho-Trilateration custom integration in Home Assistant, version 1.1.0, with its brand icon" loading="lazy"><figcaption>The integration in Home Assistant, with the same icon as the engine's web app. It has no options or entities: it just passes the readings on to the engine.</figcaption></figure>

## What reaches Home Assistant

The engine publishes to Home Assistant over MQTT, with auto-discovery. For each person a device appears, "Trilateración Juancho", with these entities (their names are in Spanish, like the rest of my Home Assistant):

| Entity | What it says |
|---|---|
| `sensor.trilateracion_juancho_area` | The Home Assistant area they're in. In its attributes, the candidates with their probability |
| `sensor.trilateracion_juancho_planta` | The floor |
| `sensor.trilateracion_juancho_confianza` | How sure it is, in % |
| `sensor.trilateracion_juancho_x`, `_y`, `_z` | The position, in meters, on the same axes as the 3D house |
| `sensor.trilateracion_juancho_proxies_clave` | The four proxies that weigh most in locating them, with their weight |

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/ha-dispositivo.webp" alt="The Home Assistant device for one person, published by the engine over MQTT, with sensors for area, confidence, floor, key proxies and X, Y, Z position" loading="lazy"><figcaption>My device in Home Assistant, as the engine publishes it over MQTT: area, confidence, floor, key proxies and position. On the left, the automation that copies the area for the rest of the house.</figcaption></figure>

On top of that, a diagnostics device says whether the engine is connected, how many proxies are active and how many readings per minute are coming in.

To avoid flooding Home Assistant's history, the position is only republished if you move at least 25 cm or the confidence changes by 5 points, and at most every 5 seconds. A change of room or floor, on the other hand, is published right away. Even so, I keep almost all of them out of Home Assistant's history, because the engine already keeps its own:

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

### What I do with them

There are no grand automations, just lots of small ones that depend on knowing where we are. And almost all of them predate the engine: I only changed where the area comes from.

- **The air conditioners turn themselves off if nobody's using their floor.** To know whether a floor is in use, Home Assistant combines the phones the engine places there with motion, TVs and lights. If a floor has been empty for 15 or 20 minutes and its AC has been on for at least an hour, it switches it off.
- **The decorative lights on the ground floor.** The Christmas tree turns on when someone has been downstairs for a few minutes and off when nobody's left. The pineapple lamp, and the dining room light at two in the morning, only turn off if nobody's left downstairs.
- **The home dashboard** shows which room each of us is in.
- **Assist knows:** I can ask it whether anyone's on the ground floor.
- **If the engine stops,** Home Assistant reloads the integration and, if it still doesn't work, sends a notification to my phone.

## In the 3D house

This is where it all comes together. The 3D house reads those entities and places each person, a circle with their Home Assistant photo, at their coordinates and at their height. If they move around the floor, the circle glides; if two people are close together, they sit side by side; and on the stairs, they appear on the floor that matches their height.

With "Show → Bluetooth proxies", you also get:

- **Each proxy in its place,** sending out blue waves, blocked by whatever blocks them.
- **Dashed lines from each person** in their color to their key proxies, thicker the more they weigh and with their percentage in the middle.
- **A Bluetooth panel:** whether the engine is running, how many proxies are reporting, how many people are located and how many readings per minute, with the list of proxies by floor. Click one and it takes you there.

<figure class="cs-pc-sola"><img src="/blog/media/bluetooth-trilateration/casa3d-planta-baja.webp" alt="The ground floor of the 3D house with its Bluetooth proxies emitting waves, dashed lines from a person to the proxies that weigh most in locating her, with their percentage, and the Bluetooth panel" loading="lazy"><figcaption>The ground floor, with its seven proxies where they really are and Ruth's lines to the ones that weigh most in locating her.</figcaption></figure>

## Built with AI

Like the 3D house, I built this with AI agents in [GitHub Copilot](https://github.com/features/copilot), but this time with a single model: **Claude Opus 5.5**.

The rules, similar to the 3D house's:

- **Nothing hard-coded.** Every value goes in the configuration file. And if one is missing or there's an unknown one, the service won't start and says exactly what's wrong.
- **Secrets kept apart.** The Home Assistant token lives in its own file, never in the code or the logs.
- **Hands off the server.** Everything runs in containers: the tests, the web app and even Blender.
- **Deterministic tests.** No sleeps, and no tests that pass sometimes and fail other times.
- **Before a big change, the plan.** Explain it to me and wait for my go-ahead.

<div class="cs-cifras">
<div><b>2</b><span>days for the core</span></div>
<div><b>37</b><span>commits</span></div>
<div><b>135</b><span>automated tests</span></div>
<div><b>21</b><span>Bluetooth proxies</span></div>
</div>

## The hard parts, and what still fails

- **The phone in your pocket.** If you change how you carry it (in your pocket, face down, under a blanket), every proxy hears it weaker at the same time, and the engine read that as "they've moved away from all of them". Ruth kept jumping from the living room to its terrace. Now the engine estimates how much the phone as a whole has changed and looks at how the signal is spread across proxies. With Ruth sitting in the living room, it went from being right 82.9% of the time to 99.7%. Even so, it's still the hardest part.
- **The ghost attic.** When a phone went to sleep, we left the house or Home Assistant restarted, no proxy heard anyone. And the engine took those silences as clues: they pushed the cloud towards where no proxy hears well, the attic. In one day, it put me there for 44 minutes, and Ruth for 92. Now, if there isn't enough signal, it freezes the cloud and keeps the area. Replaying that same day: not a single minute in the attic. What's left: right when the signal comes back, it sometimes publishes a false spot for a few seconds; it happened to me with the living room terrace, for 30 s.
- **Room centers were magnets.** Points in the center have more neighbors than those in the corners, and probability kept piling up there. Fixed by spreading it symmetrically.
- **Training one spot moved everyone else.** Repeating a session at the same spot fed its pattern into the proxy corrections, which are shared by all phones… and moved the other person. Now, repeating a spot only refines that reference.
- **Terraces and patios, not yet.** They're outside the house but right next to it, and few proxies hear them well.

## Q&A

### Where's the code?

Not public for now. The engine knows nothing about my house in particular, but it needs a model of the house built like mine.

### Do I need my house in 3D?

Yes. Today the engine starts from a Blender file with the walls, floor slabs, rooms and proxies in place. Without it, it doesn't know what's between each proxy and each point.

### Does it work with Android?

It tracks the phones Home Assistant recognizes with Private BLE Device. We both have iPhones at home, so that's all I've tested.

### Does it drain the phone's battery?

No. The phone doesn't do anything new: the proxies listen to what it already broadcasts over Bluetooth.

### How many proxies do you need?

There's no magic number. What matters is that wherever you are, several of them hear you, and that they listen all the time. If you have floors stacked on top of each other, it helps to have proxies on all of them.

### How much does it cost to run?

Nothing a month: it runs at home, in Docker. And 14 of the 21 proxies were already installed for other things.

## What's next

- **Position-based automations:** lights or music that follow you from room to room.
- **More things to locate:** watches, keys with a Bluetooth tag…
- **Publishing the code,** once it doesn't depend on how my house's model is built.

What about you? If Home Assistant knew which corner of the house you're in, what would you automate first? Let me know in the comments.

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
