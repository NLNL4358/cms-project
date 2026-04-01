import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--error-bg": "oklch(0.94 0.06 25)",
          "--error-text": "oklch(0.4 0.15 25)",
          "--error-border": "oklch(0.8 0.1 25)",
          "--success-bg": "oklch(0.94 0.06 148)",
          "--success-text": "oklch(0.35 0.12 148)",
          "--success-border": "oklch(0.8 0.1 148)",
          "--warning-bg": "oklch(0.94 0.08 85)",
          "--warning-text": "oklch(0.4 0.12 85)",
          "--warning-border": "oklch(0.8 0.1 85)",
        }
      }
      {...props} />
  );
}

export { Toaster }
