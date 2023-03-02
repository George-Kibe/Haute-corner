import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

const baseUrl = "http://localhost:8000/";

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
    }),
})
//creates these hooks automatically
export const {useGetProductQuery, useGetProductsQuery} = apiSlice