# Wardrobe OS — user flows

## 1. First-time user flow

1. Visit landing page
2. Sign up with email or magic link
3. Complete style baseline
4. Add first item
5. Review AI tag suggestions
6. Save item
7. Add at least 4 more items
8. View dashboard
9. Run first outfit recommendation
10. View buy-next output

## 2. Add item flow

1. User clicks “Add item”
2. Selects image file
3. Client shows preview immediately
4. Client compresses image for preview and estimates dominant color
5. User fills metadata or accepts suggestions
6. User clicks save
7. Server creates item
8. Image uploads
9. Background processing runs
10. Item appears in closet with “processing” badge if needed

## 3. Outfit request flow

1. User opens Outfit Lab
2. Sets occasion, weather, dress level
3. Optional: prefers least-worn items
4. User clicks generate
5. System computes valid outfit set
6. System ranks results
7. User sees top cards
8. User can save, wore, swap, or dislike

## 4. Buy next flow

1. User opens Buy Next
2. Chooses budget and target occasion
3. System simulates candidate items
4. System ranks candidates by unlock score and coverage delta
5. User sees explanation
6. User saves candidate or dismisses it

## 5. Packing flow

1. User opens Pack Planner
2. Inputs trip length, weather, laundry access
3. System builds minimal capsule
4. User reviews selected pieces
5. User saves or exports later

## 6. Item detail flow

1. User clicks item card
2. Sees image, metadata, wear stats
3. Sees compatible pairings
4. Can edit or archive item
5. Can mark worn

## 7. Feedback loop flow

1. User accepts or rejects recommendation
2. Event is logged
3. Future scores adjust based on:
   - preferred colors
   - disliked combinations
   - category avoidance
   - desired formality level