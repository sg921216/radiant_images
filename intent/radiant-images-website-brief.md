# Radiant Images Website Brief

## Features

Radiant Images is a photography business offering maternity, newborn, and family photo shoots. The business owner is Rebekah.

## Site Navigation

- Add a header with a centered logo.
- Place navigation tabs on both the left and right sides of the logo.
- Left navigation:
  - Maternity
  - Newborn
  - Family
- Right navigation:
  - About
  - Contact
  - FAQ

## Alert Banner

Display a banner beneath the navigation header at the top of the webpage. The banner should support configurable special promotions and miscellaneous alerts that can be scheduled by the site owner.

## Home Page

- Include a responsive image gallery.
- Allow the site owner to add or remove gallery images at any time.

## Pricing Schedule

Create a page with pricing information for each type of photo shoot:

- Maternity
- Newborn
- Family

The pricing schedule should be printable and downloadable as a PDF. Include a **Book Now** button that routes visitors to the Contact page.

## Q&A Section

Include answers to frequently asked questions about:

- What to expect
- What to wear
- When payment is due
- Deposits

## Admin Page

- Protect the page with authentication and an OAuth login.
- Make it accessible through a private route known only to the site owner.
- Include sections for:
  - Email templates
  - Session checklist
  - Client questionnaire

## Contact Page

Include CAPTCHA protection and a form with the following fields:

- First name
- Last name
- Email
- Phone number
- Preferred contact method (email, call, or text)
- Postal code
- Type of photo shoot
- Notes for the photographer:
  - Preferred day (date picker)
  - Special requests (text)
  - Session length (hour counter)
  - Number of people (integer dropdown)
  - Shoot location (configurable text dropdown)
- How the visitor heard about the business (configurable dropdown; options include business card, word of mouth, and social media)
- Message to Rebekah
- Submit button

When a visitor submits the form, email the submission to a configurable address. The initial address is `tbd@gmail.com`.

## References

Use the following websites for content ideas. Pay particular attention to how they describe the types of photo shoots offered and use a similar approach in the site's copy.

- [Catherine King Photography](https://catherine-king-photography.com/) — Pay close attention to the content style.
- [Erin Borzellino](https://www.erinborzellino.com/) — Pay close attention to the home page and its gallery.
- [Katie Pugliese Photography: Maternity](https://katiepugliesephotography.com/maternity) — Use the “How It Works” section as a model and include similar content for all types of photo shoots.

## Look and Feel

Use the supplied `apps/web/assets/Radiant Images Brand Moodboard.png` as the visual reference.
Keep pages light and let photography lead. Pair Bodoni-style serif headings with readable
Lora- or Source Serif-style body text and letter-spaced navigation. The signature appears
in the approved Radiant Images logo.

| Color | Hex | Role |
| --- | --- | --- |
| Warm Linen | `#F3EDE4` | Page background and light text on dark surfaces |
| Vintage Wine | `#814F5A` | Primary actions, active links and focus on light surfaces |
| Dusty Sage | `#9AA092` | Tinted collection and announcement backgrounds |
| Antique Olive | `#777D6D` | Field borders and secondary accents |
| Mushroom Taupe | `#B9A99E` | Dividers and neutral collection tints |
| Espresso | `#403A38` | Body text and dark footers |

The application and informational homepages pair introductory text with a decorative
stationery still life. On narrow screens the image sits above the text. A lavender sprig
accents section headings on wider screens. The portfolio shows the owner's selected
session photographs. [Artwork sources](../apps/web/assets/README.md#moodboard-artwork-on-the-homepage)
