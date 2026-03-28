# Category Page Frontend Only Steps

## Scope

Abhi sirf frontend admin side build karna hai.

Backend abhi touch nahi karna.

This phase uses:

- dummy categories
- dummy subcategories
- dummy products
- local state only

---

## Frontend Deliverables

1. Admin mein dedicated `Category Page Builder` page
2. Dummy category selector
3. Category strip editor
4. Page sections editor
5. Drag and drop:
   - strip items
   - sections
   - section items
6. Section kinds:
   - image
   - product
7. Display modes:
   - single
   - scroll
   - carousel
   - grid
8. Active / inactive toggles:
   - strip
   - strip item
   - section
9. Selected section preview

---

## Step Order

### Step 1

Create admin route and page.

### Step 2

Add local dummy data for:

- categories
- subcategories
- products
- category strip
- page sections

### Step 3

Build category strip editor:

- add subcategory
- remove subcategory
- active/inactive
- drag and drop reorder

### Step 4

Build page sections list:

- add section
- remove section
- active/inactive
- drag and drop reorder

### Step 5

Build section form:

- heading
- paragraph
- background color
- background image
- section link
- arrow toggle
- section kind
- display mode

### Step 6

Build items editor:

- image items
- product items
- reorder items
- edit item fields

### Step 7

Build dummy preview for selected section.

---

## Backend Later

Backend phase mein baad mein add karenge:

- schema
- save/update APIs
- category detail fetch
- real product search
- real subcategory mapping
- persistence of strip and sections

---

## Current Assumption

Current local state should stay close to future backend payload:

- `categoryStrip`
- `pageSections`

So later API integration easier rahegi.
