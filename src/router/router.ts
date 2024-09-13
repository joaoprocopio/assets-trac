import { createBrowserRouter } from "react-router-dom"

import { env } from "~/env"

export const router = createBrowserRouter(
  [
    {
      path: "/",
      lazy: async () => {
        const { AppLayout } = await import("~/layouts/app-layout")

        return { Component: AppLayout }
      },
      children: [
        {
          path: "/:companyId",
        },
      ],
    },
  ],
  {
    basename: env.BASE_URL,
  }
)
