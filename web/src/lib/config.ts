export const STORE_CONFIG = {
  name: "Tienda de Camisetas MVP",
  payment: {
    method: "manual", // "manual" | "simulated"
    bankName: "BCP",
    accountNumber: "123-4567890-1-23",
    accountHolder: "Tienda de Camisetas SAC",
    contactEmail: "pagos@tiendacamisetas.com",
    contactPhone: "+51 999 888 777"
  },
  shipping: {
    cost: 1500, // centavos (S/ 15.00)
    freeFrom: 20000, // gratis desde S/ 200
    enabledModes: ["shipping", "pickup"]
  },
  contact: {
    email: "hola@tiendacamisetas.com",
    phone: "+51 999 888 777"
  }
}
