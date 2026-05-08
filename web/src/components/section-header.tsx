import { cn } from "@heroui/react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { type ComponentProps, type PropsWithChildren } from "react";

interface SectionHeaderProps extends ComponentProps<"div"> {
  icon: IconName;
  iconProps?: {
    className: string;
  };
  iconWrapperProps?: ComponentProps<"div">;
  labelProps?: ComponentProps<"div">;
}

export default function SectionHeader({
  children,
  icon,
  iconProps,
  className,
  iconWrapperProps: {
    className: classNameIconWrapper,
    ...iconWrapperProps
  } = {},
  labelProps: { className: classNameLabel, ...labelProps } = {},
  ...props
}: PropsWithChildren<SectionHeaderProps>) {
  return (
    <div
      className={cn(
        "flex items-center gap-[1rem] md:gap-[2rem] py-[2rem]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex justify-center items-center rounded-2xl size-[3rem] bg-accent",
          classNameIconWrapper,
        )}
        {...iconWrapperProps}
      >
        <DynamicIcon
          name={icon}
          className={cn(
            "text-accent-foreground size-[2rem]",
            iconProps?.className,
          )}
        ></DynamicIcon>
      </div>
      <div
        className={cn("flex font-bold text-[20pt]", classNameLabel)}
        {...labelProps}
      >
        {children}
      </div>
    </div>
  );
}
