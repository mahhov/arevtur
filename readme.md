# Arevtur (Fork)

This is a fork of [mahhov/arevtur](https://github.com/mahhov/arevtur) — a Path of Exile trade search tool with PoB integration, value-v-price graph, and more.

This fork picks up development starting from version **0.5**, focusing on **PoE 2 support only**. PoE 1 functionality is not actively maintained.

## Changes from the original

### Open Trade (replaces Travel to Hideout)

The "Travel to Hideout" feature was broken due to API changes. It has been replaced with an **Open Trade** button that constructs a targeted trade URL matching the item's exact stats, base type, and seller account, then opens it in your default browser. This lets you quickly navigate to the listing on the trade site.

### Way of the Stonefist Ascendancy Support

Added support for the **Way of the Stonefist** (Martial Artist) ascendancy node. When this node is allocated in your PoB build, Arevtur automatically transforms glove affix text to their converted values before evaluating them in PoB. This ensures accurate item valuations for builds using this ascendancy.

### Status Filter

Added a status filter dropdown in the results panel:
- **All** — show all items
- **Buyout + Online + AFK** — hide offline sellers
- **Buyout + Online** — hide offline and AFK sellers
- **Buyout Only** — show only instantly purchasable items

### Updated poe2scout API

Updated currency pricing API calls to use the latest poe2scout endpoints and response format.

### Auto-updates

Auto-update source has been changed to this repository. Updates will be published here.

---

## Original README

For the full feature documentation (PoB integration, graph usage, mod viewer, etc.), see the [original project](https://github.com/mahhov/arevtur).

## Credits

All original credits apply — see the [original repository](https://github.com/mahhov/arevtur#credits).

Development assisted with Claude.
