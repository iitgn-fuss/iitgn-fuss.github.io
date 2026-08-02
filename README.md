# FUSS Group Website (IIT Gandhinagar)

This repository contains the source code for the **Formal and Usable Systems Security (FUSS) Group** website at IIT Gandhinagar, hosted live at [iitgn-fuss.github.io](https://iitgn-fuss.github.io/).

Built with [Hugo](https://gohugo.io/) and the [Hextra](https://hextra.imfing.com/) theme.

---

## Quick Start / Local Development

To run and preview the website locally on your computer:

```bash
# Start the local Hugo server
hugo server
```

Open your browser and navigate to **`http://localhost:1313/`**. Hugo will automatically rebuild and reload the page whenever you save changes to any files.

---

## How to Deploy Changes to the Live Website

Deployment is fully automated through **GitHub Pages**:

1. Make your content or code changes locally.
2. Test your changes using `hugo server`.
3. Commit and push your changes to the `main` branch:

```bash
git add .
git commit -m "Update website content"
git push origin main
```

Within 1–2 minutes, GitHub Pages will automatically build and publish the updated site to `https://iitgn-fuss.github.io/`.

---

## Content Guide

### 1. Adding a New News Item

News items appear under the **News** section and on the homepage "Latest News" cards.

- **File Location**: `content/news/<item-filename>.md`
- **Example**: Create `content/news/our-new-ccs-paper.md`

```markdown
---
title: "Our New Work on Web Security Accepted at CCS 2026!"
date: 2026-06-04
tags: ["research", "publication"]
summary: "Our work on Web Privacy & Usability has been accepted at the 33rd ACM Conference on Computer and Communications Security (CCS)."
---

Write the full announcement text here...
```

---

### 2. Adding Photos & Posts to the Gallery Carousel ("Life @ FUSS")

Photos in the homepage **"Life @ FUSS"** carousel are automatically pulled from markdown posts inside `content/misc/`.

1. **Add Photo Files**: Place image files into `static/misc/gallery/` (e.g. `static/misc/gallery/asiaccs_26.jpg`).
2. **Create/Update Misc Post**: Add or edit a post in `content/misc/<event-filename>.md`:

```markdown
---
title: "AsiaCCS 2026 Trip"
date: 2026-06-04
description: "Attending AsiaCCS 2026 conference."
---

Some text describing the event...

{{< gallery >}}
![AsiaCCS 2026 Conference 1](/misc/gallery/asiaccs_26_1.jpg)
![AsiaCCS 2026 Conference 2](/misc/gallery/asiaccs_26_2.jpg)
{{< /gallery >}}
```

- Images inside `{{< gallery >}}` shortcodes automatically appear in the homepage carousel, styled with uncropped ambient backdrops and frosted glass date badges (`JUN 2026`).

---

### 3. Updating People & Team Members

- **File Location**: `content/people.md`
- **Headshots Location**: `static/images/people/` (e.g., `static/images/people/subhrajit.jpg` or referenced as `../images/people/subhrajit.jpg`)

To add a new team member, edit `content/people.md` under the appropriate category (`Faculty`, `Ph.D.`, `M.Tech. / Dual Degree`, `Undergraduate Alumni`, etc.):

```html
<div class="person-card">
  <a href="https://iitgn-fuss.github.io/people/subhrajit" target="_blank" style="position: absolute; inset: 0; z-index: 1; opacity: 0;" aria-label="Subhrajit's homepage"></a>
  <div class="person-content" style="position: relative; z-index: 2; pointer-events: none;">
    <img src="../images/people/subhrajit.jpg" alt="Subhrajit" class="person-image">
    <div class="person-info">
      <h3 class="person-name">Subhrajit</h3>
      <p class="person-title">M.Tech Student</p>
      <p class="person-period">2024 – Present</p>
      <div class="research-focus-phrases">
        <span>Systems Security</span>
        <span class="research-focus-separator">|</span>
        <span>Usable Security</span>
      </div>
    </div>
  </div>
</div>
```

---

### 4. Updating Individual Member Personal Websites

Individual personal websites (such as `https://iitgn-fuss.github.io/people/subhrajit/` or `https://iitgn-fuss.github.io/people/abhishek/`) are stored as static site builds inside `static/people/<username>/`.

If you maintain your personal website in a separate repository/directory (using Hugo, Vite, or plain HTML):

1. **Compile your personal website** locally:
   - For Hugo: running `hugo` outputs static files into your local `public/` directory (e.g. `~/subhrajit/public/`).
2. **Copy compiled files** to the main repository:
   ```bash
   cp -r ~/subhrajit/public/* ~/iitgn-fuss.github.io/static/people/subhrajit/
   ```
3. **Commit and push** the main repository:
   ```bash
   cd ~/iitgn-fuss.github.io
   git add .
   git commit -m "Update Subhrajit's personal website"
   git push origin main
   ```

---

## Directory Overview

```
iitgn-fuss.github.io/
├── content/               # Markdown content
│   ├── news/              # News articles & announcements
│   ├── misc/              # Gallery events & misc posts
│   ├── about/             # About page
│   ├── people.md          # Team members & alumni
│   ├── publications.md    # Research publications
│   └── interesting-reads/ # Recommended reading list
├── static/                # Static assets & sub-sites
│   ├── images/people/     # Member profile photos
│   ├── misc/gallery/      # Gallery images
│   ├── logo/              # Brand SVG logos
│   └── people/            # Individual member websites (e.g. subhrajit, abhishek)
├── assets/css/            # Custom CSS stylesheets (custom.css, gallery.css)
├── layouts/               # Custom Hugo template overrides
├── hugo.yaml              # Global site configuration
└── README.md              # Documentation
```
