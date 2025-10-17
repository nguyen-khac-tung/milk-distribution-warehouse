"use client"

import * as React from "react"

export const Chart = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
))
Chart.displayName = "Chart"

export const ChartContainer = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
))
ChartContainer.displayName = "ChartContainer"

export const ChartTooltip = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
))
ChartTooltip.displayName = "ChartTooltip"

export const ChartTooltipContent = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
))
ChartTooltipContent.displayName = "ChartTooltipContent"

export const ChartLegend = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
))
ChartLegend.displayName = "ChartLegend"

export const ChartLegendItem = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
))
ChartLegendItem.displayName = "ChartLegendItem"
