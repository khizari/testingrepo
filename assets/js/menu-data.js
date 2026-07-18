(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Menu data is now served by /api/menu (backed by Vercel Blob storage on
  // the server, same pattern as the admin-panel reference project). The
  // arrays below are ONLY used as an instant, offline-safe first paint
  // before the network request resolves, and as a last-resort fallback if
  // the request fails entirely (e.g. no network). Once /api/menu responds,
  // the live server data replaces this cache and a "menu:updated" event is
  // fired so pages can re-render with the real data.
  // ---------------------------------------------------------------------

  const defaultCategories = [
    {
      "id": "burgers",
      "label": "Burgers"
    },
    {
      "id": "hot-dogs",
      "label": "Hot Dogs"
    },
    {
      "id": "chicken",
      "label": "Chicken"
    },
    {
      "id": "sides",
      "label": "Sides"
    }
  ];
  
  const defaultItems = [
    {
      "variants": [],
      "addons": [],
      "id": "classic-burger",
      "category": "burgers",
      "name": "Classic Burger",
      "price": "Rs. 8.99",
      "description": "Juicy beef patty with fresh lettuce, tomatoes, cheese, and our special sauce.",
      "image": "assets/images/burger.png",
      "rating": 4.5,
      "popular": true
    },
    {
      "variants": [],
      "addons": [],
      "id": "cheese-burger",
      "category": "burgers",
      "name": "Cheese Burger",
      "price": "Rs. 10.99",
      "description": "Double beef patty with extra cheese, caramelized onions, and premium sauce.",
      "image": "assets/images/best-dish.png",
      "rating": 5,
      "popular": true
    },
    {
      "variants": [],
      "addons": [],
      "id": "veggie-burger",
      "category": "burgers",
      "name": "Veggie Burger",
      "price": "Rs. 9.99",
      "description": "Plant-based patty with lettuce, tomatoes, pickles, and vegan mayo.",
      "image": "assets/images/burger.png",
      "rating": 4
    },
    {
      "variants": [],
      "addons": [],
      "id": "classic-hot-dog",
      "category": "hot-dogs",
      "name": "Classic Hot Dog",
      "price": "Rs. 6.99",
      "description": "Premium sausage in a soft bun with ketchup, mustard, and relish.",
      "image": "assets/images/hot-dog.png",
      "rating": 4
    },
    {
      "variants": [],
      "addons": [],
      "id": "cheese-dog",
      "category": "hot-dogs",
      "name": "Cheese Dog",
      "price": "Rs. 7.99",
      "description": "Classic hot dog topped with melted cheese and crispy fried onions.",
      "image": "assets/images/hot-dog.png",
      "rating": 4.5
    },
    {
      "variants": [],
      "addons": [],
      "id": "chili-dog",
      "category": "hot-dogs",
      "name": "Chili Dog",
      "price": "Rs. 8.99",
      "description": "Hot dog topped with homemade chili, cheese, and chopped onions.",
      "image": "assets/images/hot-dog.png",
      "rating": 5
    },
    {
      "variants": [],
      "addons": [],
      "id": "crispy-chicken-sandwich",
      "category": "chicken",
      "name": "Crispy Chicken Sandwich",
      "price": "Rs. 9.99",
      "description": "Crispy fried chicken breast with lettuce, tomato, and special mayo.",
      "image": "assets/images/crispy-chicken.png",
      "rating": 4.5,
      "popular": true
    },
    {
      "variants": [],
      "addons": [],
      "id": "chicken-nuggets",
      "category": "chicken",
      "name": "Chicken Nuggets",
      "price": "Rs. 7.99",
      "description": "8 pieces of premium chicken nuggets with choice of dipping sauce.",
      "image": "assets/images/chicken-food.png",
      "rating": 4
    },
    {
      "variants": [],
      "addons": [],
      "id": "spicy-chicken-wrap",
      "category": "chicken",
      "name": "Spicy Chicken Wrap",
      "price": "Rs. 8.99",
      "description": "Spicy grilled chicken with fresh veggies and chipotle sauce in a wrap.",
      "image": "assets/images/crispy-chicken.png",
      "rating": 5
    },
    {
      "variants": [],
      "addons": [],
      "id": "french-fries",
      "category": "sides",
      "name": "French Fries",
      "price": "Rs. 3.99",
      "description": "Crispy golden fries seasoned with our secret spice blend.",
      "image": "assets/images/burger.png",
      "rating": 5
    },
    {
      "variants": [],
      "addons": [],
      "id": "onion-rings",
      "category": "sides",
      "name": "Onion Rings",
      "price": "Rs. 4.99",
      "description": "Crispy battered onion rings served with special dipping sauce.",
      "image": "assets/images/burger.png",
      "rating": 4
    },
    {
      "variants": [],
      "addons": [],
      "id": "coleslaw",
      "category": "sides",
      "name": "Coleslaw",
      "price": "Rs. 2.99",
      "description": "Fresh and creamy coleslaw made with our signature dressing.",
      "image": "assets/images/burger.png",
      "rating": 4.5
    }
  ];

  let categories = defaultCategories.slice();
  let items = defaultItems.slice();
  let hasLoadedFromServer = false;

  function createId(name) {
    return `${Date.now()}-${name || "item"}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function notifyUpdated() {
    window.dispatchEvent(new CustomEvent("menu:updated", {
      detail: { categories, items },
    }));
  }

  // Fetches the live menu from the server. Resolves once, on first load,
  // and again is safe to call any time (e.g. after a save) to refresh the
  // in-memory cache. `MenuStore.ready` always resolves (never rejects) so
  // pages can safely `await`/`.then()` it without extra error handling;
  // on failure the bundled defaults above simply remain in place.
  async function loadFromServer() {
    try {
      const res = await fetch("/api/menu", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load menu (status " + res.status + ")");
      const data = await res.json();
      if (Array.isArray(data.categories)) categories = data.categories;
      if (Array.isArray(data.items)) items = data.items;
      hasLoadedFromServer = true;
    } catch (err) {
      console.warn("MenuStore: could not load menu from server, using bundled defaults.", err);
    }
    notifyUpdated();
    return { categories, items };
  }

  const ready = loadFromServer();

  function readCategories() {
    return categories;
  }

  function readItems() {
    return items;
  }

  // Saves the full menu (both categories and items) to the server in one
  // request. Requires an authenticated admin session (the /api/menu PUT
  // route checks this); callers should surface the returned/thrown error.
  async function saveAll(nextCategories, nextItems) {
    const res = await fetch("/api/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: nextCategories, items: nextItems }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Save failed");
    categories = nextCategories;
    items = nextItems;
    notifyUpdated();
    return data;
  }

  // Convenience wrappers for callers that only touch one half of the data
  // at a time (they still save the *whole* menu, since that's what the API
  // expects, but only replace the piece the caller passed in).
  function saveCategories(nextCategories) {
    return saveAll(nextCategories, items);
  }

  function saveItems(nextItems) {
    return saveAll(categories, nextItems);
  }

  // Uploads an image (already a compressed data: URL) to /api/upload and
  // returns the public URL to store on the item. Requires an authenticated
  // admin session.
  async function uploadImage(filename, dataUrl) {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, dataUrl }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  }

  window.MenuStore = {
    defaultCategories,
    defaultItems,
    createId,
    readCategories,
    saveCategories,
    readItems,
    saveItems,
    saveAll,
    uploadImage,
    ready,
    get hasLoadedFromServer() {
      return hasLoadedFromServer;
    },
  };
})();
