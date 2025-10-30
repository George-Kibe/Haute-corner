import React from 'react'
import { Stack } from 'expo-router'
import { HRight } from '@/components/HeaderRight'
import Hleft from '@/components/HeaderLeft'

const ProductLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: "Product Details",
          headerRight: () => <HRight />,
          headerLeft: Hleft
        }}
      />
    </Stack>
  )
}

export default ProductLayout
