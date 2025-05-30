// config/dummyData.js
export const DUMMY_PRODUCTS = {
  "pancakes123": {
    id: "pancakes123",
    name: "Pan Cakes",
    imageUrl: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFuY2FrZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60", // Replace with a real image URL
    calories: 250,
    protein: 5,
    carbs: 30,
    fat: 10,
    ingredients: "Sugar, Wheat Flour, Cocoa Butter, Milk Powder, Vegetable Oil, Leavening Agents, Salt, Vanilla Extract",
    allergens: ["Milk", "Gluten", "Sugar"], // "Sugar" isn't typically an allergen, but for demo
    healthAlerts: [
      {
        title: "High Sugar Content",
        description: "This product contains a significant amount of added sugars, which may contribute to health risks if consumed excessively.",
        severity: "warning", // 'warning', 'critical', 'info'
      },
      {
        title: "Contains Gluten",
        description: "Not suitable for individuals with celiac disease or gluten sensitivity.",
        severity: "info",
      }
    ],
    alternatives: [
      {
        id: "alt1",
        name: "Healthy Start Pancakes",
        imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Zm9vZHxlbnwwfHwwfHx8MA%3D&auto=format&fit=crop&w=500&q=60", // Replace
        description: "Made with whole wheat flour and natural sweeteners. A perfect dairy-free alternative.",
        nutritionScore: "95% nutritional",
        brand: "Nature's Best",
      },
      {
        id: "alt2",
        name: "Protein Power Pancakes",
        imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Zm9vZHxlbnwwfHwwfHx8MA%3D&auto=format&fit=crop&w=500&q=60", // Replace
        description: "Packed with protein to kickstart your day. Low sugar and gluten-free options available.",
        nutritionScore: "92% nutritional",
        brand: "FitFuel",
      },
    ],
    nutritionBreakdown: { // For the pie chart
        carbohydrates: 60, // Percentage
        fat: 25,           // Percentage
        protein: 10,       // Percentage
        sugar: 5,          // Percentage (as part of carbs or separate if tracked distinctly)
    }
  },
  // Add more dummy products if you want to simulate different scans
  "milkbread456": {
    id: "milkbread456",
    name: "Organic Milk Bread",
    imageUrl: "https://images.unsplash.com/photo-1598373182133-901587e30668?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWlsayUyMGJyZWFkfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60",
    calories: 180,
    protein: 6,
    carbs: 25,
    fat: 5,
    ingredients: "Organic Wheat Flour, Organic Milk, Organic Sugar, Yeast, Salt, Butter",
    allergens: ["Milk", "Gluten"],
    healthAlerts: [],
    alternatives: [
        {
            id: "alt3",
            name: "Sourdough Bread",
            imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979186?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c291cmRvdWdoJTIwYnJlYWR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60",
            description: "Naturally leavened with a distinct tangy flavor. Often easier to digest.",
            nutritionScore: "90% nutritional",
            brand: "Artisan Bakers",
        }
    ],
    nutritionBreakdown: {
        carbohydrates: 70,
        fat: 15,
        protein: 15,
        sugar: 0, // Assuming sugar is part of carbs and not explicitly high
    }
  }
};

export const THEME_COLOR_PRIMARY = '#00C853'; // Your main theme green
export const THEME_COLOR_SECONDARY = '#69F0AE'; // A lighter green
export const TEXT_COLOR_PRIMARY = '#212529';
export const TEXT_COLOR_SECONDARY = '#6C757D';
export const BORDER_COLOR = '#E9ECEF';
export const CARD_BACKGROUND_COLOR = '#FFFFFF';