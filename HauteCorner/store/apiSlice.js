import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

// Orders still use the old API until checkout is rebuilt in Phase 5.
const baseUrl = "https://buenas-admin.vercel.app/api/";

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({baseUrl}),
    endpoints: (builder) => ({
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
    useCreateOrderMutation,
    useGetOrderQuery,
} = apiSlice
