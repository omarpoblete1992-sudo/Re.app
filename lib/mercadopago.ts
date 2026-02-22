import MercadoPago from "mercadopago"

// Initialize the MercadoPago client with the access token from environment variables
const client = new MercadoPago({
    accessToken: process.env.MP_ACCESS_TOKEN!,
})

export default client
