"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "#1A1B23",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#fff",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
