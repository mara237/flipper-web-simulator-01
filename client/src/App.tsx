/*
 * FLIPPER WEB SIMULATOR — App Router
 * Design: Cyber Dashboard — Dark Tech + Neon Accent Industrial
 * Primary: #ff6b00 (Flipper Orange), Accent: #00d4ff (Cyan Neon)
 * Background: #0d1117, Typography: Space Grotesk + JetBrains Mono
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import SubGHz from "./pages/SubGHz";
import NFC from "./pages/NFC";
import BadUSB from "./pages/BadUSB";
import GPIO from "./pages/GPIO";
import Infrared from "./pages/Infrared";
import IButton from "./pages/IButton";
import BLE from "./pages/BLE";
import FileManager from "./pages/FileManager";
import Settings from "./pages/Settings";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/subghz" component={SubGHz} />
        <Route path="/nfc" component={NFC} />
        <Route path="/badusb" component={BadUSB} />
        <Route path="/gpio" component={GPIO} />
        <Route path="/infrared" component={Infrared} />
        <Route path="/ibutton" component={IButton} />
        <Route path="/ble" component={BLE} />
        <Route path="/files" component={FileManager} />
        <Route path="/settings" component={Settings} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.13 0.01 240)",
                border: "1px solid oklch(0.25 0.01 240)",
                color: "oklch(0.92 0.005 240)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
