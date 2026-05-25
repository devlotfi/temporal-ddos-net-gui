import { Button, Chip, cn } from "@heroui/react";
import { Home, Laptop, Moon, Sun } from "lucide-react";
import LogoSVG from "./svg/LogoSVG";
import { useContext } from "react";
import { ThemeContext } from "../context/theme-context";
import { ThemeOptions } from "../types/theme-options";
import { useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";

function NavbarNavigationButton({
  title,
  path,
  icon,
}: {
  title: string;
  path: string;
  icon: IconName;
}) {
  const navigate = useNavigate();
  const search = useSearch({ from: "/dashboard" });
  const { pathname } = useLocation();

  return (
    <Button
      size="md"
      variant={pathname === path ? "primary" : "ghost"}
      className={cn(
        "rounded-2xl items-center w-[10rem]",
        pathname !== path && "text-foreground",
      )}
      onPress={() =>
        navigate({
          to: path,
          search,
        })
      }
    >
      <DynamicIcon name={icon} className="size-[1.2rem]"></DynamicIcon>
      <div className="flex">{title}</div>
    </Button>
  );
}

export default function DashboardNavbar() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/dashboard" });
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
      <div className="flex relative h-[4rem] px-[0.8rem] justify-center items-center rounded-3xl bg-surface border border-border">
        <div className="flex absolute left-[1rem] items-center gap-[1rem]">
          <LogoSVG className="h-[2.5rem]" />
          <Button
            isIconOnly
            size="lg"
            variant="outline"
            className="bg-background text-foreground text-[15pt] border border-border"
            onPress={() =>
              navigate({
                to: "/",
              })
            }
          >
            <Home className="size-[1.4rem]"></Home>
          </Button>

          <div className="flex p-[0.3rem] rounded-3xl bg-background border border-border">
            <NavbarNavigationButton
              title="Statistiques"
              path="/dashboard"
              icon="chart-column"
            ></NavbarNavigationButton>
            <NavbarNavigationButton
              title="Timeline"
              path="/dashboard/timeline"
              icon="calendar-range"
            ></NavbarNavigationButton>
            <NavbarNavigationButton
              title="Alertes"
              path="/dashboard/alerts"
              icon="siren"
            ></NavbarNavigationButton>
            <NavbarNavigationButton
              title="Simulation"
              path="/dashboard/simulation"
              icon="play"
            ></NavbarNavigationButton>
          </div>
        </div>

        <div className="flex absolute right-[1rem] gap-[0.5rem] items-center">
          <div className="flex flex-col gap-[0.1rem]">
            <Chip
              size="md"
              className="flex-col bg-background border border-border text-foreground"
            >
              <div className="flex w-full gap-[0.5rem] items-center justify-between">
                <div className="flex opacity-80">Modéle:</div>
                <div className="flex">{search.model}</div>
              </div>
              <div className="flex w-full gap-[0.5rem] items-center justify-between">
                <div className="flex opacity-80">Jour de validation:</div>
                <div className="flex">{search.day}</div>
              </div>
            </Chip>
          </div>

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
              <Laptop className="size-[1.4rem]"></Laptop>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
