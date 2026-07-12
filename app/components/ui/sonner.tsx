import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "~/hooks/use-theme";

/** App-wide toast outlet. Must render inside ThemeProvider. */
export function Toaster(props: ToasterProps) {
  const { theme } = useTheme();

  return <Sonner theme={theme} richColors closeButton {...props} />;
}
