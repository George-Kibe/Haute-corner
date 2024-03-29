import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

//const baseUrl = "http://localhost:8000/";
const baseUrl = "https://buenas-admin.vercel.app/api/";

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({baseUrl}),
    endpoints: (builder) => ({
        getProducts: builder.query({
            query: () => "products",
        }),
        getProduct: builder.query({
            query: (id) => `products/${id}`,
        }),
        //orders
        createOrder: builder.mutation({
            query: (newOrder) => ({
                url: 'orders',
                method: 'POST',
                body: newOrder,
            }),
        }),
        getOrder: builder.query({
            query: (ref) => `orders/${ref}`,
        })
    }),
})

//creates these hooks automatically
export const {
    useGetProductQuery,
    useGetProductsQuery,
    useCreateOrderMutation,
    useGetOrderQuery,
} = apiSlice