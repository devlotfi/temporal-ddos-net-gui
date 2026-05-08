import { cn } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

interface DataRowProps extends ComponentProps<"div"> {
  name: ReactNode;
  value: ReactNode;
  fold?: boolean;
}

export default function DataRow({
  name,
  value,
  fold = false,
  className,
  ...props
}: DataRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col mb-[0.3rem]",
        !fold && "md:flex-row md:gap-[0.5rem] md:mb-0",
        className,
      )}
      {...props}
    >
      <div className="flex flex-1 justify-between items-center gap-[0.7rem]">
        <div className="flex text-[12pt] opacity-80">{name}</div>
        <div className="flex h-[1px] flex-1 bg-separator"></div>
      </div>
      <div className="flex text-[12pt] break-all">{value}</div>
    </div>
  );
}
