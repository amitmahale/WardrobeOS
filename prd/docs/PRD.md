# Wardrobe OS — MVP PRD

## 1. Product summary

Wardrobe OS is a wardrobe decision system for practical people. It helps users catalog what they already own, generate context-aware outfits, surface underused clothing, and identify the **single next purchase** that unlocks the most additional outfit combinations.

This is **not** a fashion inspiration feed. It is a personal wardrobe optimizer.

## 2. Problem

Most people have a closet full of usable clothing but still face three recurring problems:

1. They do not know what they own in a structured, searchable way.
2. They struggle to decide what to wear for a given occasion, weather, and dress code.
3. They buy redundant clothing because they cannot quantify what item would complement the rest of the closet best.

Existing wardrobe apps focus heavily on digitization and inspiration. They are weaker at **coverage analysis**, **incremental purchase intelligence**, and **practical recommendation logic**.

## 3. Product vision

Create a system that answers five questions clearly:

1. What do I own?
2. What should I wear today for this context?
3. Which items do I underuse?
4. Where is my wardrobe thin or redundant?
5. What single item should I buy next to make the rest of my closet more useful?

## 4. Product principles

1. **Utility over fashion theater**  
   Recommendations should feel practical and grounded, not editorial or vague.

2. **Low-friction data capture**  
   The cataloging flow must be fast enough that a real person will complete it.

3. **User-confirmed intelligence**  
   AI may suggest tags and pairings, but the user must be able to correct everything.

4. **Explainability**  
   Every recommendation should say why it works.

5. **Buy less, buy smarter**  
   The product should actively reduce redundant purchases.

## 5. Target users

### Primary user
A busy adult who wants to dress better with less effort and buy more strategically.

### Secondary users
- family members sharing a household wardrobe workflow
- friends who want a personal closet tool without social media energy
- travelers and capsule wardrobe users
- users who want wardrobe structure without hiring a stylist

## 6. Jobs to be done

### Functional jobs
- catalog my closet
- filter and search by category, color, season, or occasion
- generate outfit suggestions for an event
- simulate the impact of a new purchase
- prepare a packing list for a trip

### Emotional jobs
- reduce decision fatigue
- feel put together without overthinking
- avoid wasteful shopping
- make better use of items already owned

## 7. MVP goals

### Must-have goals
- Create and manage a wardrobe catalog
- Upload and store clothing images
- Tag clothing with structured metadata
- Recommend outfits by occasion and weather
- Recommend purchases by “outfits unlocked”
- Show wardrobe health metrics

### Success criteria in the first 30 days
- 70% of invited users add at least 15 items
- 50% of active users request an outfit recommendation at least 3 times
- 30% of active users click into “buy next”
- median time to add an item < 45 seconds after the first 5 items
- median recommendation feedback rating >= 4/5

## 8. Non-goals for MVP

- social feed
- resale marketplace
- public closet sharing
- full virtual try-on
- advanced computer vision segmentation
- automated retailer linking for every recommendation
- multi-merchant checkout
- advanced tailoring/fit simulation

## 9. Core hypotheses

1. Users will tolerate cataloging effort if the downstream recommendation value is obvious.
2. A practical recommendation engine beats generic AI styling fluff for retention.
3. “Buy next” is the sharpest wedge because it turns the app into a decision optimizer, not a gallery.
4. Occasion coverage and underused-item revival will increase perceived value after initial setup.

## 10. MVP scope

### Included
- landing page
- authenticated app shell
- wardrobe dashboard
- closet catalog
- add/edit item flow
- item details page
- outfit lab
- buy next page
- packing planner
- insights page
- settings
- onboarding
- image upload and processing
- optional AI-assisted tag suggestions
- recommendation feedback loop

### Deferred
- stylist chat
- automatic purchase links
- laundry integration
- outfit calendar
- collaborative group styling
- browser extension for retail carts
- email parsing for receipts

## 11. Primary entities

- user
- closet
- person profile
- item
- item image
- outfit
- outfit recommendation
- purchase candidate
- purchase recommendation
- trip
- packing plan
- feedback event

## 12. Information architecture

### Public pages
- `/`
- `/features`
- `/pricing` (optional placeholder for MVP)
- `/privacy`
- `/terms`

### Authenticated pages
- `/app`
- `/app/dashboard`
- `/app/closet`
- `/app/items/new`
- `/app/items/[id]`
- `/app/outfits`
- `/app/buy-next`
- `/app/pack`
- `/app/insights`
- `/app/settings`

## 13. Onboarding flow

### Step 1 — Welcome
Explain the value in plain language:
- digitize your wardrobe
- get context-aware outfits
- buy fewer but better items

### Step 2 — Style baseline
Capture:
- gender presentation preference (optional)
- default dress level
- climate
- common occasions
- favorite colors
- colors they avoid
- preferred fits
- budget band
- shopping philosophy (minimalist, balanced, expressive, formal, casual)

### Step 3 — Closet setup
Create default closet:
- “My Closet”
Optional:
- add a partner/family member closet later

### Step 4 — Add first 5 items
Guide:
- top
- bottom
- layer
- shoes
- wildcard item

### Step 5 — Show first value
Immediately generate:
- 3 outfits
- 1 underused item suggestion
- 3 top purchase candidates

## 14. User stories

### Catalog
- As a user, I can add an item manually.
- As a user, I can upload an image for an item.
- As a user, I can edit auto-suggested tags before saving.
- As a user, I can mark an item as archived, donated, or inactive.

### Recommendation
- As a user, I can ask for outfit suggestions by occasion, temperature band, and dress level.
- As a user, I can pin a generated outfit.
- As a user, I can thumbs-up or thumbs-down a recommendation.

### Shopping intelligence
- As a user, I can see which single purchase unlocks the most outfits.
- As a user, I can see why a suggested purchase matters.
- As a user, I can filter purchase suggestions by budget, formality, and season.

### Insights
- As a user, I can see underused items.
- As a user, I can see duplicate categories/colors.
- As a user, I can see occasion coverage gaps.

### Packing
- As a user, I can choose trip length and occasion mix.
- As a user, I can get a minimal packing list that maximizes outfit reuse.

## 15. Detailed functional requirements

### 15.1 Auth
- email/password or magic link
- secure session handling
- household membership later, single-user first
- invite system deferred unless included as stretch

### 15.2 Closet catalog
Each item must support:
- name
- category
- subcategory
- wearer/profile
- primary color family
- secondary color family (optional)
- pattern
- material
- warmth level
- formality level (1–5)
- fit notes
- seasons
- occasions
- brand (optional)
- purchase date (optional)
- purchase price (optional)
- wear count
- last worn
- status: active, stored, donated, archived

### 15.3 Image upload
The user can:
- upload image from phone or desktop
- see preview before save
- rotate image client-side
- crop later (stretch if time allows)
- accept AI tag suggestions or fill manually

### 15.4 Image processing
System should:
- store original file
- generate a compressed display version
- optionally generate a square thumbnail
- extract basic technical metadata
- optionally call AI for category/color/pattern/material suggestion
- never auto-save item tags without user confirmation

### 15.5 Closet browsing
Required controls:
- search
- category filter
- color filter
- occasion filter
- season filter
- sort by recent, wear count, name, formality
- grid and list view

### 15.6 Outfit lab
Inputs:
- occasion
- temperature band
- weather
- dress level
- preferred colors
- include/exclude item ids
- “use least-worn items” toggle
- “play it safe” vs “try something fresh” slider

Outputs:
- top 3–8 outfit recommendations
- recommendation score
- short rationale
- optional substitute items
- ability to save outfit
- ability to mark “wore this”

### 15.7 Buy next
Inputs:
- budget tier
- category preference
- season
- occasion target
- avoid duplicates toggle

Outputs:
- ranked purchase candidates
- outfits unlocked
- affected items in current closet
- confidence label
- price band placeholder
- explanation
- “already own something similar” warning

### 15.8 Insights
Show:
- total active items
- ready-to-wear outfit count by occasion
- underused items
- duplicate clusters
- weak categories
- color distribution
- formality balance
- gap summary

### 15.9 Packing planner
Inputs:
- destination
- trip length
- primary occasions
- laundry access
- shoe limit
- weather band

Outputs:
- minimal packing list
- outfit count produced
- repeated core pieces
- optional “one extra upgrade item”

## 16. Recommendation engine design

### 16.1 MVP philosophy
Use deterministic scoring first. Add AI only where it helps with explanation and parsing.

### 16.2 Outfit recommendation model
Build outfits using combinations:
- 1 top
- 1 bottom
- optional layer
- optional shoes
- optional accessory later

Scoring dimensions:
- category completeness
- color compatibility
- occasion match
- season/weather match
- formality coherence
- wear rotation balance
- user preference match
- redundancy penalty

### 16.3 Purchase recommendation model
Define a candidate library of wardrobe archetypes, for example:
- cream trousers
- olive chinos
- white OCBD
- navy unstructured blazer
- brown suede loafers
- charcoal merino crewneck
- minimalist black sneakers
- mid-wash straight jeans

For each candidate:
1. simulate adding it to the closet
2. generate new valid outfits
3. remove outfits already possible without it
4. measure:
   - net new outfits
   - new occasion coverage
   - overlap with underused items
   - duplicate risk
5. rank candidates

### 16.4 Explainability rules
Each recommendation must provide:
- what it unlocks
- which existing items it connects with
- which use case it improves
- whether it risks redundancy

## 17. Wedge features

### W1 — Buy Next Unlock Score
“Buy cream trousers: unlocks 9 new work/dinner outfits across 5 existing tops and 2 layers.”

### W2 — Underused Item Revival
“Your olive overshirt has only been worn once. Here are 3 ways to bring it back.”

### W3 — Occasion Coverage Map
“You are strong in casual, decent in smart casual, weak in dressy summer.”

### W4 — Trip Capsule Builder
“Here are 10 items for 4 days that create 12 outfits.”

### W5 — Duplicate Detector
“You own 4 near-identical navy casual tops.”

## 18. Design direction

Wardrobe OS should feel:
- clean
- premium but not flashy
- calm
- data-informed
- practical
- strong typography
- large cards
- subtle color accents
- imagery secondary to decision clarity

Tone:
- confident
- plainspoken
- useful
- not fashion-magazine language

## 19. Detailed screen specs

### 19.1 Landing page
Sections:
- hero
- three core promises
- product demo strip
- wedge feature section
- trust/benefits
- CTA

Primary CTA:
- Start your closet
Secondary CTA:
- View demo

### 19.2 Dashboard
Components:
- quick stats row
- coverage by occasion
- underused item panel
- top purchase opportunity
- recently added items
- quick action buttons

### 19.3 Closet
Components:
- sticky filter bar
- search
- item grid
- item cards with image, metadata, wear count
- batch actions deferred

### 19.4 Add Item
Components:
- image uploader
- preview panel
- metadata form
- AI tag suggestion pill
- save button
- “save and add another”

### 19.5 Item Details
Components:
- large image
- metadata
- compatible item suggestions
- wear history summary
- edit/archive actions

### 19.6 Outfit Lab
Components:
- query form on left
- recommendation cards on right
- score breakdown
- rationale
- save / wore / swap item actions

### 19.7 Buy Next
Components:
- budget + context filters
- ranked candidate cards
- unlock count
- items impacted
- confidence label
- why it matters
- defer / save / mark purchased later

### 19.8 Pack Planner
Components:
- trip query form
- generated capsule list
- outfit count
- optional variants

### 19.9 Insights
Components:
- item utilization
- duplicate clusters
- occasion coverage bars
- closet composition donut or bars
- strategic note cards

## 20. Empty states

### New user empty state
- prompt to add first item
- show 3 example benefits
- sample screenshots or mock items

### No outfit found
- suggest relaxing one filter
- suggest adding a missing category
- suggest top purchase candidate to solve gap

### No purchase opportunities
- explain closet is already balanced for selected context
- suggest another occasion or season

## 21. Edge cases

- user uploads poor lighting photo
- user adds same item twice
- user has only tops, no bottoms
- user has season mismatch because they live in mixed climate
- user refuses AI tagging
- user adds family member closet
- item fits only one occasion
- all recommended purchases are redundant because closet is already saturated

## 22. Privacy and trust

- images are private by default
- no public profile in MVP
- recommendations are generated from private user data only
- AI tagging must be opt-in if external processing is used
- clear explanation of what data is sent to third-party services

## 23. Instrumentation

Track:
- onboarding completion
- item created
- item edited
- image uploaded
- tag suggestion accepted/rejected
- outfit request submitted
- outfit recommendation clicked
- outfit saved
- outfit marked worn
- buy-next viewed
- purchase candidate clicked
- packing plan generated

## 24. MVP success metrics

### Activation
- first item added
- first 5 items added
- first outfit recommendation generated

### Engagement
- weekly active closets
- average items per active closet
- recommendations per week
- buy-next usage rate

### Quality
- average recommendation rating
- tag correction rate
- outfit acceptance rate
- percentage of purchase candidates dismissed as redundant

## 25. Rollout plan

### Phase 0
Private personal use + friends/family demo

### Phase 1
Invite-only MVP
- manual seed support
- direct user feedback
- weekly tuning of scoring rules

### Phase 2
Improved image pipeline
- background jobs
- better AI tagging
- saved outfit history
- deeper packing logic

## 26. Product risks

### Risk: setup friction
Mitigation:
- fast add flow
- sample closet import
- camera-friendly upload
- “add essentials first” onboarding

### Risk: recommendations feel generic
Mitigation:
- deterministic scoring
- explicit user preferences
- feedback loop
- stronger explanations

### Risk: bad auto-tags
Mitigation:
- human-in-the-loop confirmation
- soft suggestion UI
- low confidence warnings

### Risk: shopping wedge feels spammy
Mitigation:
- recommend fewer, better suggestions
- only show high-confidence additions
- explain overlap and redundancy honestly

## 27. Future roadmap

- retailer linking with price bands
- closet calendar
- AI chat stylist
- laundry state
- outfit history
- personalized brand fit profiles
- receipt ingestion
- shared household mode
- resale recommendation
- “do not buy this” warnings in-browser