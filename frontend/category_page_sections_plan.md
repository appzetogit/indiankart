# Category Page Sections Plan

## Goal

Har category page ke liye ek hi flexible backend-driven system ho:

- category strip backend se aaye
- sections backend se aaye
- sections reorderable via drag and drop
- section active / inactive ho sakta hai
- section ke andar heading / paragraph optional
- section background color ya background image optional
- section-level link optional
- right side arrow icon optional
- ek hi reusable section container ho
- uske andar content type select ho:
  - image
  - product
- display mode rahe:
  - single
  - scroll
  - carousel
  - grid/rows
- image ke neeche title / paragraph ho sakta hai
- product ke neeche title / paragraph ho sakta hai

Matlab hardcoded category page nahi rahega. Pure category page ko admin se manage kiya ja sakega.
---

## Big Picture

Category page par 2 backend-managed layers hongi:

1. `Category Strip`
2. `Category Page Sections`

### Category Strip

Ye subcategories se hi banegi.

Matlab:

- admin subcategories create karega
- category strip mein wahi subcategories selectable hongi
- strip order drag and drop se manage hoga
- strip item active / inactive ho sakta hai
- whole strip bhi active / inactive ho sakti hai

### Category Page Sections

Ye reusable sections honge:

- same outer container
- optional heading
- optional paragraph
- optional section background color
- optional section background image
- optional section link
- optional arrow icon
- same section ke andar image items ya product items ho sakte hain

---

## Final Frontend Structure

Category page par structure:

1. category header
2. backend-driven `CategoryStrip`
3. dynamic `CategoryPageSectionsRenderer`
4. products area / listing area

Frontend components:

- `CategoryStrip`
- `CategoryPageSectionsRenderer`
- `CategorySection`
- `CategorySectionContent`

Flow:

- category detail data aayega
- `categoryStrip` aayegi
- `pageSections` aayenge
- strip renderer strip show karega
- section renderer sections loop karega
- ek hi `CategorySection` component har section render karega

---

## Category Strip Data Shape

Recommended:

```js
{
  categoryStrip: {
    isActive: true,
    items: [
      {
        id: "strip_item_1",
        subCategoryId: "sub_123",
        isActive: true,
        order: 1
      }
    ]
  }
}
```

Important:

- strip ke items existing subcategories ko point karenge
- strip apna order maintain karegi
- strip item details runtime par subcategory master data se resolve hongi

Frontend render logic:

- category ke active subcategories load karo
- strip config ke order ke according map karo
- inactive strip items hide karo
- agar strip config empty ho to fallback optional ho sakta hai

Recommended fallback:

- no fallback in final mode
- admin explicitly decide karega kya strip mein dikhna chahiye

---

## Section Data Shape

Recommended backend payload:

```js
{
  _id: "categoryId",
  name: "Electronics",
  categoryStrip: {
    isActive: true,
    items: [
      {
        id: "strip_item_1",
        subCategoryId: "sub_123",
        isActive: true,
        order: 1
      }
    ]
  },
  pageSections: [
    {
      id: "sec_hero_01",
      type: "media",
      isActive: true,
      order: 1,
      sectionKind: "image",
      title: "Exclusively for you",
      description: "Similar to items you viewed",
      sectionLink: "/category/Electronics/headsets",
      isSectionLinkActive: true,
      showArrow: true,
      arrowBackgroundColor: "#2563eb",
      arrowColor: "#ffffff",
      backgroundColor: "#ffffff",
      backgroundImage: "",
      paddingX: "default",
      paddingY: "default",
      mediaDisplay: "carousel",
      items: [
        {
          id: "item_1",
          itemType: "image",
          image: "https://...",
          mobileImage: "https://...",
          title: "",
          description: "",
          link: "/category/Electronics/Laptops"
        }
      ]
    }
  ]
}
```

---

## Supported Section Fields

Every section should support:

- `id`
- `type`
- `isActive`
- `order`
- `sectionKind`
- `title`
- `description`
- `sectionLink`
- `isSectionLinkActive`
- `showArrow`
- `arrowBackgroundColor`
- `arrowColor`
- `backgroundColor`
- `backgroundImage`
- `paddingX`
- `paddingY`
- `mediaDisplay`
- `items`

Recommended `type` values:

- `media`
- `product_strip`
- `subcategory_strip`
- `html_block`

Recommended `sectionKind` values:

- `image`
- `product`

Note:

- First phase mein `type = media` hi enough hai
- us media section ke andar `sectionKind = image` ya `product` decide karega ki content source kya hai

---

## Supported Display Modes

Recommended `mediaDisplay` values:

- `single`
- `scroll`
- `carousel`
- `grid`

Ye image section aur product section dono ke liye same honge.

### Single

- ideally one item

### Scroll

- horizontal scroll
- multiple items

### Carousel

- auto slide
- manual nav

### Grid

- rows / cards
- 2 / 3 / 4 columns future mein configurable

---

## Section Item Shape

### Image Item

```js
{
  id: "item_1",
  itemType: "image",
  image: "https://...",
  mobileImage: "https://...",
  title: "Optional title",
  description: "Optional description",
  link: "/category/Electronics/Laptops",
  openInNewTab: false
}
```

### Product Item

```js
{
  id: "item_2",
  itemType: "product",
  productId: "mongo_product_id",
  title: "Optional override title",
  description: "Optional override description",
  link: "/product/abc123",
  openInNewTab: false
}
```

Product item logic:

- product select karoge
- image product se pull hogi
- title/description product se aa sakta hai
- optional override allow kar sakte hain

So same container same rahega:

- background same
- heading same
- paragraph same
- arrow same
- only content type change hoga

---

## Admin Management Flow

Category edit ke andar separate structure hona chahiye:

- `General`
- `Subcategories`
- `Category Strip`
- `Category Page Sections`

### Tab: Category Strip

Admin yahan:

- existing subcategories dekh sake
- strip ke liye selected subcategories choose kare
- drag and drop reorder kare
- item active / inactive toggle kare
- whole strip active / inactive kare

### Tab: Category Page Sections

Admin yahan:

1. `Add Section`
2. Existing sections list
3. Drag and drop reorder
4. Per section edit panel
5. Save category page layout

Recommended layout:

### Left side

- sortable section cards
- each card shows:
  - section title
  - section kind
  - display mode
  - item count
  - active/inactive state
  - drag handle

### Right side

- selected section edit form

Ye modal-based UX se better rahega.

---

## Admin Category Strip Form

Category strip ke liye:

- strip active toggle
- add subcategory
- select from existing subcategories only
- drag and drop reorder
- remove strip item
- item active / inactive toggle

Suggested saved payload:

```js
categoryStrip: {
  isActive: true,
  items: [
    {
      id: "strip_item_1",
      subCategoryId: "sub_123",
      isActive: true,
      order: 1
    }
  ]
}
```

---

## Admin Section Form

For one section:

### Basic

- section title
- section description
- section active toggle
- section kind:
  - image
  - product
- display mode:
  - single
  - scroll
  - carousel
  - grid

### Background

- background color picker
- background image upload/url

### Section Link

- section link input
- active toggle for section link
- show arrow toggle
- arrow bg color
- arrow icon color

### Items

- add item
- remove item
- reorder item

### If `sectionKind = image`

Per item:

- web image
- mobile image
- title
- description
- link

### If `sectionKind = product`

Per item:

- product selector
- title override optional
- description override optional
- link override optional

---

## Validation Rules

Admin validation:

- at least one item required for section
- `mediaDisplay = single` ho to ideally one item
- image section mein image required
- product section mein product required
- section link ho to arrow optional
- title/description optional

Active / inactive support chahiye on:

- whole category strip
- strip item
- whole section
- section item future phase mein

Backend validation:

- `pageSections` sanitize karo
- `categoryStrip` sanitize karo
- inactive sections save hone do but render mat karo
- invalid display mode reject karo
- invalid section kind reject karo
- product item mein valid `productId` check karo
- strip item mein valid `subCategoryId` check karo
- unknown fields strip karo

---

## Drag And Drop

Three levels of DnD chahiye:

1. category strip reorder
2. section reorder
3. section ke andar items reorder

Tech:

- `@dnd-kit/core`
- `@dnd-kit/sortable`

Save time:

- `order` fields normalize karo

Example:

- first = 1
- second = 2
- third = 3

---

## Backend Changes

Recommended Mongo schema addition in category:

```js
categoryStrip: {
  isActive: { type: Boolean, default: true },
  items: [
    {
      id: String,
      subCategoryId: mongoose.Schema.Types.ObjectId,
      isActive: { type: Boolean, default: true },
      order: Number
    }
  ]
},
pageSections: [
  {
    id: String,
    type: { type: String, default: "media" },
    isActive: { type: Boolean, default: true },
    order: Number,
    sectionKind: { type: String, default: "image" },
    title: String,
    description: String,
    sectionLink: String,
    isSectionLinkActive: Boolean,
    showArrow: Boolean,
    arrowBackgroundColor: String,
    arrowColor: String,
    backgroundColor: String,
    backgroundImage: String,
    paddingX: String,
    paddingY: String,
    mediaDisplay: String,
    items: [
      {
        id: String,
        itemType: String,
        productId: mongoose.Schema.Types.ObjectId,
        image: String,
        mobileImage: String,
        title: String,
        description: String,
        link: String,
        openInNewTab: Boolean
      }
    ]
  }
]
```

API impact:

- `GET /categories`
- `GET /categories/:id`
- `POST /categories`
- `PUT /categories/:id`

Recommended response strategy:

- lite response: no `pageSections`, no full strip payload if not needed
- detail response: include `categoryStrip` + `pageSections`

---

## Frontend Components Recommended

User side:

- `frontend/src/modules/user/components/category/CategoryStrip.jsx`
- `frontend/src/modules/user/components/category/CategoryPageSectionsRenderer.jsx`
- `frontend/src/modules/user/components/category/CategorySection.jsx`
- `frontend/src/modules/user/components/category/CategorySectionContent.jsx`

Admin side:

- `frontend/src/modules/admin/components/category/CategoryStripEditor.jsx`
- `frontend/src/modules/admin/pages/Categories/CategoryPageSectionsEditor.jsx`
- `frontend/src/modules/admin/components/category/CategorySectionForm.jsx`
- `frontend/src/modules/admin/components/category/CategorySectionItemsEditor.jsx`

---

## Rollout Plan

### Phase 1

- backend schema add
- category strip backend config
- category strip editor
- admin page sections editor basic
- one reusable section container
- section kinds:
  - image
  - product
- display modes:
  - single
  - scroll
  - carousel
  - grid

### Phase 2

- admin live preview
- duplicate section
- templates
- mobile-specific layout controls
- item-level active/inactive if needed

### Phase 3

- special section types
- subcategory auto sections
- product query-based dynamic sections
- mixed content sections

---

## Best Admin UX Recommendation

Category edit ke andar separate tabs banao:

- `General`
- `Subcategories`
- `Category Strip`
- `Category Page Sections`

### `Category Strip`

- top: `Add Subcategory to Strip`
- sortable strip item list
- active/inactive toggles

### `Category Page Sections`

- top: `Add Section`
- left: sortable section list
- right: selected section form

Ye scalable aur non-confusing rahega.

---

## Recommendation For Current Project

Abhi ke liye best path:

1. old category banner logic ko use mat karo
2. new `categoryStrip + pageSections` architecture banao
3. reusable section container banao
4. usme `image` aur `product` dono modes do
5. display modes:
   - single
   - scroll
   - carousel
   - grid
6. active / inactive strip + sections support do
7. Electronics ko first sample category banao
8. admin se strip + sections dono manage karo

Ye future-proof hai aur category page ko hardcoded hone se bachayega.
