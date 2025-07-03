import Preferences from "@/pages/Preferences";

interface PreferencesViewProps {
  onBack: () => void;
}

export const PreferencesView = ({ onBack }: PreferencesViewProps) => {
  return <Preferences onBack={onBack} />;
}; 