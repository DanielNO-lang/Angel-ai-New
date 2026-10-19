# Google AI Studio / Image Workflow Prompt: Definitive Angel + Alex Character Asset Pack

Use this prompt with the saved Angel character-expression reference images and the approved project decision. This is an asset-production task, not permission to change the app architecture.

## Project identity
Create a production-quality, consistent visual asset pack for Angel AI, a premium cross-device AI assistant. The female assistant is Angel. The matching male counterpart is Alex. Use the supplied approved reference image(s) as the identity anchor. Do not invent a new face, hairstyle, wardrobe direction, art style, or brand.

## Approved visual direction
- Angel: young adult East Asian-inspired appearance; face direction Option A; slim V-shaped face; soft almond-shaped eyes; layered black hair; warm, confident, intelligent, subtly sassy presence.
- Rendering: premium 3D animation / polished CGI, sophisticated and believable, not flat vector, not anime, not photorealistic human photography.
- Clothing: smart casual, coordinated and consistent across all expressions. Prefer the approved dark smart-casual outfit from the reference, with consistent jewelry/accessories.
- Alex: matching young adult male counterpart, same premium CGI language and studio lighting, dark hair, smart-casual styling. He is a separate character, not a gender-swapped accidental duplicate.
- Brand environment: deep black/near-black, warm metallic gold, champagne and soft white; restrained gradients and elegant illumination. Avoid unnecessary neon-purple/blue or wing motifs unless the supplied reference explicitly requires them.
- Identity consistency is more important than making each expression dramatically different. Every output must unmistakably depict the same character as the reference.

## Required outputs
Produce separate, cleanly named image files, not only a poster or flattened collage.

### Angel
1. One hero portrait, front/three-quarter view, suitable for a home/profile presence.
2. Twelve individual expression portraits:
   - `angel-happy`
   - `angel-sassy`
   - `angel-curious`
   - `angel-thinking`
   - `angel-surprised`
   - `angel-concerned`
   - `angel-amused`
   - `angel-reassuring`
   - `angel-skeptical`
   - `angel-celebrating`
   - `angel-frustrated`
   - `angel-serious`

### Alex
1. One hero portrait, front/three-quarter view.
2. Twelve individual expression portraits:
   - `alex-happy`
   - `alex-sassy`
   - `alex-curious`
   - `alex-thinking`
   - `alex-surprised`
   - `alex-concerned`
   - `alex-amused`
   - `alex-reassuring`
   - `alex-skeptical`
   - `alex-celebrating`
   - `alex-frustrated`
   - `alex-serious`

Total: 2 hero portraits + 24 individual expression images. Optional: transparent-background versions and small avatar crops, but do not substitute these for the required originals.

## Expression direction
- Happy: natural warm smile.
- Sassy: playful confident smirk, restrained.
- Curious: attentive eyes, slight inquisitive head angle.
- Thinking: reflective gaze, optional hand near chin if the crop allows it.
- Surprised: raised brows and widened eyes, believable rather than comic.
- Concerned: thoughtful, empathetic concern.
- Amused: authentic smile/laugh, not exaggerated.
- Reassuring: calm, grounded, kind expression.
- Skeptical: subtle raised brow or side glance.
- Celebrating: delighted, confident, restrained celebratory gesture if full upper body is shown.
- Frustrated: mild, human frustration without hostility.
- Serious: focused, composed, neutral expression.

## Technical and quality requirements
- Keep face structure, eye shape, skin tone, hair length/style/color, outfit, accessories, camera, light direction and render quality consistent across each character's set.
- Make every expression an independent asset with one character only, centered, with safe crop margins and clean edges.
- Provide transparent backgrounds if supported; otherwise use a uniform dark neutral background that can be removed cleanly.
- No watermark, random typography, labels, UI, brand logos, extra people, malformed hands, mismatched jewelry, accidental hair-color shifts, face drift, or inconsistent age.
- Do not create a single sprite sheet as the only deliverable. A labeled contact sheet may be supplied as an additional review sheet, but all individual images must be delivered separately.
- Use practical web-friendly formats and resolutions. Keep a high-quality master and optimized web export for each asset.
- Include an asset manifest listing filename, character, expression, dimensions, format, background type, and any generation limitation.
- Do not claim the files have been committed to GitHub or integrated into Angel. The output is an asset handoff; repository integration is a separate engineering step.

## Workflow
1. Inspect the provided reference assets and restate the identity constraints before generating.
2. Generate/lock the hero portrait for Angel and obtain review before producing the full set.
3. Use the approved hero/reference to preserve identity across the 12 expressions.
4. Repeat the same controlled process for Alex.
5. Produce individual files and a contact sheet for review.
6. Report any image-generation limitation honestly. If identity consistency cannot be guaranteed, propose the best reference-conditioned workflow rather than generating 24 visibly different people.

Do not alter code, create new app UI, deploy, or claim final approval. Deliver the images and manifest for review first.
