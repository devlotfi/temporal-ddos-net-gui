import { Button } from "@heroui/react";
import { Computer, Moon, Sun } from "lucide-react";
import LogoSVG from "./svg/LogoSVG";
import { useContext } from "react";
import { ThemeContext } from "../context/theme-context";
import { ThemeOptions } from "../types/theme-options";

export default function IndexNavbar() {
  const { themeOption, setTheme } = useContext(ThemeContext);

  const switchTheme = () => {
    switch (themeOption) {
      case ThemeOptions.LIGHT:
        setTheme(ThemeOptions.DARK);
        break;
      case ThemeOptions.DARK:
        setTheme(ThemeOptions.SYSTEM);
        break;
      case ThemeOptions.SYSTEM:
        setTheme(ThemeOptions.LIGHT);
        break;
    }
  };

  return (
    <div className="flex flex-col p-[1rem]">
      <div className="flex h-[4rem] px-[0.8rem] justify-between items-center rounded-3xl bg-surface border border-border">
        <div className="flex items-center gap-[1rem]">
          <LogoSVG className="h-[2.5rem] ml-[0.5rem]" />
          <div className="hidden sm:flex text-[14pt] font-bold">
            Temporal DDOS Net GUI
          </div>
        </div>

        <div className="flex items-center">
          <Button
            isIconOnly
            size="lg"
            variant="outline"
            className="bg-background text-foreground text-[15pt] border border-border"
            onPress={switchTheme}
          >
            {themeOption === ThemeOptions.LIGHT ? (
              <Sun className="size-[1.4rem]"></Sun>
            ) : themeOption === ThemeOptions.DARK ? (
              <Moon className="size-[1.4rem]"></Moon>
            ) : (
              <Computer className="size-[1.4rem]"></Computer>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
