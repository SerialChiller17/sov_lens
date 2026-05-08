import { DesktopOnlyGate } from "./app/DesktopOnlyGate";
import RoutedApp from "./app/App";

export default function App() {
  return (
    <DesktopOnlyGate>
      <RoutedApp />
    </DesktopOnlyGate>
  );
}
