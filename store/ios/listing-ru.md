# App Store listing — draft (ru)

Draft prepared 2026-11-28 for review. Nothing here has been entered into
App Store Connect. Items marked **НУЖНО ОТ ВАС** cannot be filled in without
the account owner.

## App information

| Field | Value | Limit |
|---|---|---|
| Name | Школа Михаила Агеева | 30 (20 used) |
| Subtitle | Медитации и аффирмации | 30 (22 used) |
| Primary language | Russian | |
| Bundle ID | com.mikhail.manifestation | |
| SKU | ageev-school-ios | any unique string |
| Primary category | Health & Fitness (Здоровье и фитнес) | |
| Secondary category | Lifestyle (Образ жизни) | |
| Content rights | Contains third-party content: **НУЖНО ОТ ВАС** — confirm you hold the rights to Mikhail Ageev's audio, texts, name and photo | |
| Copyright | © 2026 **НУЖНО ОТ ВАС** (person or organisation that owns the content) | |

## Pricing and availability

- Price: Free.
- Availability: **НУЖНО ОТ ВАС** — all countries, or a specific list.

## Version 1.0.0

**Promotional text** (170 max, 117 used; can be changed without a new build)

> Медитации, аффирмации, духовные завтраки и вебинары Михаила Агеева — практики для внутренней гармонии на каждый день.

**Description**

> «Школа Михаила Агеева» — пространство практик для внутренней гармонии, осознанности и личного развития.
>
> В приложении собраны авторские материалы Михаила Агеева:
>
> • Медитации — короткие и длинные практики на разные темы: спокойствие, изобилие, отношения, уверенность в себе.
> • Аффирмации — мысли на каждый день; выбирайте тему, которая откликается вам, сохраняйте и делитесь.
> • Духовные завтраки — короткие практики, чтобы настроиться на день.
> • Вебинары — записи встреч о развитии и осознанных переменах.
> • Мышление — подборки практик по сферам жизни: начните с той, которой хотите уделить внимание.
> • Сторис дня — цитата, практика и аффирмация каждый день.
>
> Удобно слушать:
> • фоновое воспроизведение и управление с экрана блокировки;
> • таймер практики;
> • продолжение с того места, где вы остановились;
> • избранное — всё важное под рукой.
>
> Клубы единомышленников: найдите сообщество в своём городе на карте или в списке и присоединяйтесь к нему в Telegram или ВКонтакте.
>
> Приложение бесплатное. Регистрация не нужна: избранное и настройки хранятся на вашем устройстве.
>
> Материалы приложения предназначены для саморазвития и не являются медицинской или психологической помощью.

**Keywords** (100 max, 99 used)

> медитация,аффирмации,практики,осознанность,гармония,саморазвитие,вебинары,духовность,релакс,энергия

**What's New** — not shown for a first version.

**URLs**

| Field | Value |
|---|---|
| Support URL | **НУЖНО ОТ ВАС** — a page where users can reach you (e.g. the school's site) |
| Marketing URL (optional) | https://mikhail-ageev.ru |
| Privacy Policy URL | https://mikhail-app.web.app/privacy — the live page is out of date; deploy the redraft in `deeplink-site/public/privacy.html` first |

**Screenshots** — `store/ios/screenshots/ru/01…08` (1290×2796), into the
6.9-inch iPhone slot, in file-name order. No iPad set: the app is iPhone-only.

**Build** — 1.0.0 (29), not yet uploaded.

## Age rating questionnaire

Suggested answers: «None / No» to every content question (violence, sexual
content, profanity, drugs, gambling, horror, user-generated content,
unrestricted web access, messaging, advertising). Expected result: 4+.

One to check by hand: if the questionnaire asks about health or wellness
topics, answer that the app contains them (meditation), without medical
claims.

## App Privacy (the «nutrition label»)

Does the app collect data? **Yes.**

| Data type | Collected | Linked to the user | Used for tracking | Purpose |
|---|---|---|---|---|
| Usage Data → Product Interaction | Yes | No | No | Analytics |
| Identifiers → Device ID (app install identifier) | Yes | No | No | Analytics |
| Diagnostics → Crash Data | Yes | No | No | App Functionality |
| Diagnostics → Other Diagnostic Data | Yes | No | No | App Functionality |

Not collected: contact info, location (used on the device only), photos,
purchases, health data, user content, search history, contacts.

## App Review information

| Field | Value |
|---|---|
| Sign-in required | No — the app has no accounts |
| Contact first name / last name | **НУЖНО ОТ ВАС** |
| Contact phone | **НУЖНО ОТ ВАС** |
| Contact email | **НУЖНО ОТ ВАС** |

**Notes for the reviewer**

> The app has no registration or sign-in; all content is free and available immediately after launch.
> Audio continues in the background (UIBackgroundModes: audio) so that meditations keep playing when the screen is locked.
> Location is requested only when the user opens «Рядом со мной» in the Клуб tab, to sort clubs by distance; it is processed on the device and never sent anywhere.
> «Донейшн» in the Profile tab opens a web page in Safari; no payments are collected inside the app.

## Still to decide before submitting

- «Курсы и события» in the Profile tab opens a page that sells trainings. If it
  sells online (digital) courses, App Review may reject the link.
- Operator name and contact address in the privacy policy.
