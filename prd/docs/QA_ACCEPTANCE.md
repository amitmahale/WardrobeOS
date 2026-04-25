# Wardrobe OS — QA and acceptance criteria

## Core acceptance criteria

### Closet
- user can create, edit, and archive items
- filters update results without full page reload
- item card always shows image or intentional fallback art
- item metadata persists correctly

### Upload
- JPEG and PNG upload works
- invalid file type shows clear error
- oversized file shows clear error
- upload does not create orphaned item rows silently
- user sees processing state when image jobs are incomplete

### Outfit Lab
- valid outfit results appear for seeded demo closet
- no result includes duplicate category conflicts
- score breakdown is shown
- recommendation rationale is never blank

### Buy Next
- buy-next results are deterministic for same closet version and same query
- unlock count changes if relevant closet items change
- duplicate warnings show when candidate overlaps strongly with existing items

### Insights
- underused items reflect wear counts
- occasion coverage recalculates when closet changes

### Packing
- generated plan respects shoe limit
- generated plan respects laundry toggle heuristically

## Manual test scenarios

1. add 10 items and request work outfits
2. add mostly casual clothes and verify work coverage drops
3. remove all shoes and verify outfit lab gracefully degrades
4. upload an image, reject AI tags, save manual tags
5. add duplicate navy tops and verify duplicate detector notices cluster
6. change budget from low to high in buy-next and confirm ranking adapts if price band logic exists