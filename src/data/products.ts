export interface Product {
  id: number
  name: string
  price: number
  image: string
  slug: string
  weight: string
  servings: string
}

export const products: Product[] = [
  { id: 1, name: "Arnold Circus Stool", price: 20, weight: "500g", servings: "22 servings", image: "/test.png", slug: "arnold-circus-stool" },
  { id: 2, name: "Arnoldino Stool", price: 30, weight: "500g", servings: "22 servings", image: "/test.png", slug: "arnoldino-stool" },
  { id: 3, name: "Hookalotti", price: 40, weight: "500g", servings: "22 servings", image: "/test.png", slug: "hookalotti" },
  { id: 4, name: "Chicken", price: 40, weight: "500g", servings: "22 servings", image: "/test.png", slug: "chicken" },
  { id: 5, name: "Hookalotti", price: 40, weight: "500g", servings: "22 servings", image: "/test.png", slug: "hookalotti-2" },
];