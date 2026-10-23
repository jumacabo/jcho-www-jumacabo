# Blog posts

Each post is one Markdown file in this folder. Once pushed, GitHub Pages publishes it at
`https://jumacabo.com/blog/<slug>/` and updates the home page, tags, previous/next links and
comments automatically. The blog is written in English.

## File name

`YYYY-MM-DD-slug.md` — for example `2026-10-20-zigbee-sensors.md` is published at `/blog/zigbee-sensors/`.

## Front matter

```yaml
---
title: "Zigbee sensors that actually last"
seo_title: "Zigbee sensors in Home Assistant that last for years"   # optional; see below
description: "One or two sentences. Shown under the title, on the home page cards and in link previews."
tags: [home-assistant, zigbee]
cover: /blog/media/zigbee-sensors/cover.jpg   # optional; 1200×630 works best
last_modified_at: 2026-11-02                   # optional; only after a substantial update
---
```

Only `title` is required. Without `description`, the first paragraph is used. Without `cover`, a
gradient is shown. Tags are lowercase and hyphenated; their pages are generated automatically.

## Search engines

The blog is indexed: `robots.txt`, `sitemap.xml` and the Atom feed (`/blog/feed.xml`) are generated
or updated on every build, and each page carries its canonical URL and schema.org data.

- `seo_title` replaces the `<title>` that Google shows. Use it when `title` is catchy but lacks the
  words people search for. Keep it under ~60 characters. The H1 and link previews keep `title`.
- `description` is the snippet in search results: keep it under ~160 characters and include the key terms.
- `last_modified_at` sets the "updated" date in the sitemap and structured data.

## Writing

- Use `##` for sections: they become the "In this post" list in the sidebar. Use `###` for sub-sections.
- Code: fenced blocks with a language, e.g. ` ```yaml `.
- Reading time is calculated automatically.

## Media

Put images, video and audio in `blog/media/<slug>/` and always link them with an absolute path.

| Type | Markdown / HTML |
|---|---|
| Image | `![Alt text](/blog/media/<slug>/photo.jpg)` |
| Image with caption | `<figure><img src="/blog/media/<slug>/photo.jpg" alt="Alt text"><figcaption>Caption</figcaption></figure>` |
| Video file | `<video controls preload="metadata" src="/blog/media/<slug>/clip.mp4"></video>` |
| YouTube | `<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" title="Video title" allowfullscreen></iframe>` |
| Audio | `<audio controls preload="metadata" src="/blog/media/<slug>/sound.mp3"></audio>` |

GitHub rejects files over 100 MB, so prefer YouTube for long videos and compress images (WebP or JPEG).
